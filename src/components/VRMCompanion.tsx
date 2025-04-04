import React, {
  MutableRefObject,
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  GLTF,
  GLTFLoader,
  GLTFParser,
} from "three/examples/jsm/loaders/GLTFLoader";
import {
  VRM,
  VRMUtils,
  VRMLoaderPlugin,
  VRMSpringBoneColliderShapeCapsule,
  VRMSpringBoneColliderShapeSphere,
  VRMExpressionPresetName,
} from "@pixiv/three-vrm";
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Euler,
  LoopOnce,
  Mesh,
  NumberKeyframeTrack,
  Vector3,
} from "three";
import { loadMixamoAnimation } from "../helpers/loadMixamoAnimation";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";

export const emotions = {
  happy: VRMExpressionPresetName.Happy,
  sad: VRMExpressionPresetName.Sad,
  angry: VRMExpressionPresetName.Angry,
  relaxed: VRMExpressionPresetName.Relaxed,
  surprised: VRMExpressionPresetName.Surprised,
  neutral: VRMExpressionPresetName.Neutral,
};

interface VrmAvatarProps {
  meshRef?: MutableRefObject<any>;
  physicsRef?: MutableRefObject<any>;
  vrmUrl: string;
  animations: Record<"greet" | "idle" | "talk" | "bored" | "walk", string[]>;
  scale: number[];
  rotation?: number[];
  position?: number[];
  physics?: boolean;
  isStaticPosition?: boolean;
  gltfLoaded?: (gltf: GLTF) => void;
}

const VrmCompanion = forwardRef(
  (
    {
      meshRef,
      physicsRef,
      vrmUrl,
      animations,
      scale,
      rotation,
      position,
      physics,
      isStaticPosition,
      gltfLoaded,
    }: VrmAvatarProps,
    ref
  ) => {
    const [gltf, setGltf] = useState<GLTF | null>(null);
    const [animationMixer, setAnimationMixer] = useState<AnimationMixer | null>(
      null
    );
    const [prevVrmUrl, setPrevVrmUrl] = useState<string | null>(null);
    const [currentText, setCurrentText] = useState<string>("");

    const [targetPosition, setTargetPosition] = useState(position);
    const [targetLookAt, setTargetLookAt] = useState<number[] | null>(null);
    const [animationCache, setAnimationCache] = useState<
      Record<string, AnimationAction[]>
    >({});
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    const loader = useMemo(() => {
      return new GLTFLoader().register(
        (parser: GLTFParser) =>
          new VRMLoaderPlugin(parser, {
            autoUpdateHumanBones: true,
          })
      );
    }, []);

    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const gltfRef = useRef<Mesh>(null);
    const vrmRef = useRef<VRM>(null);
    const virtualTextRef = useRef<Mesh>(null);

    // bind refs to props for external access
    useEffect(() => {
      if (meshRef) {
        meshRef.current = gltfRef.current;
      }
      if (physicsRef) {
        physicsRef.current = rigidBodyRef.current;
      }
    }, [meshRef, physicsRef]);

    useFrame(({ camera }, delta) => {
      if (animationMixer?.update) {
        animationMixer.update(delta);
      }
      if (vrmRef?.current?.update) {
        vrmRef.current.update(delta);
      }

      if (virtualTextRef.current && gltfRef.current) {
        const avatarPosition = new Vector3().setFromMatrixPosition(
          gltfRef.current.matrixWorld
        );
        virtualTextRef.current.position.copy(avatarPosition);
        virtualTextRef.current.position.y += 1.5;
        virtualTextRef.current.lookAt(camera.position);
      }

      if (gltfRef?.current?.matrixWorld && !isStaticPosition) {
        const currentPosition = new Vector3().setFromMatrixPosition(
          gltfRef.current.matrixWorld
        );

        const distance = currentPosition.distanceTo(
          new Vector3(...targetPosition)
        );

        if (gltfRef.current && distance > 0.1) {
          gltfRef.current.position.lerp(new Vector3(...targetPosition), 0.01);
        }
      }
      if (gltfRef?.current?.lookAt && targetLookAt && !isStaticPosition) {
        gltfRef.current.lookAt(new Vector3(...targetLookAt));
        gltfRef.current.rotateY(Math.PI);
      }
    });

    const getRandomAnimation = useCallback(
      (type: string) => {
        const randomAnim = (animations as any)?.[type]?.[
          Math.floor(Math.random() * (animations as any)?.[type]?.length)
        ];

        return randomAnim;
      },
      [animations]
    );

    const playAnimation = useCallback(
      async (type: string) => {
        animationCache[type][0].reset().setLoop(LoopOnce, 1).play();
      },
      [animationCache]
    );

    const moveMouth = useCallback(
      async (audioUrl: string) => {
        try {
          const audioResp = await fetch(audioUrl);
          const audioBuffer = await audioResp.arrayBuffer();
          const source = audioContext?.createBufferSource();
          const audio = await audioContext?.decodeAudioData(audioBuffer);
          source.buffer = audio;
          source?.connect(analyser);
          source.start(0);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateMouth = () => {
            requestAnimationFrame(updateMouth);

            analyser.getByteFrequencyData(dataArray);

            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizationFactor = 50;
            const normalizedVolume = Math.min(1, volume / normalizationFactor);

            // Set the weight of the 'Aa' blend shape based on the volume
            vrmRef.current.expressionManager.setValue("aa", normalizedVolume);
            vrmRef.current.expressionManager.update();
          };

          updateMouth();
        } catch (error) {
          console.error(error);
        }
      },
      [audioContext, analyser]
    );

    const setupAudioAnalyser = useCallback(async () => {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setAudioContext(audioContext);

      const analyser = audioContext?.createAnalyser();
      setAnalyser(analyser);
    }, []);

    const setupAudioPlayer = useCallback(async () => {
      const audio = new Audio();
      setAudio(audio);
    }, []);

    const setupAnimations = useCallback(async () => {
      return new Promise(async (resolve) => {
        const mixer = new AnimationMixer(vrmRef.current.scene);
        mixer.timeScale = 1.0;
        setAnimationMixer(mixer);

        // load walk animation
        const randomWalk = getRandomAnimation("walk");
        const walkClip = await loadMixamoAnimation(randomWalk, vrmRef.current);
        const walkAction = mixer.clipAction(walkClip);

        // // load idle animation
        const randomIdle = getRandomAnimation("idle");
        const idleClip = await loadMixamoAnimation(randomIdle, vrmRef.current);
        const idleAction = mixer.clipAction(idleClip);

        setAnimationCache((prev) => ({
          ...prev,
          walk: [...(prev?.walk || []), walkAction],
          idle: [...(prev?.idle || []), idleAction],
        }));

        idleAction.play();

        // blink loop
        const blinkTrack =
          vrmRef.current.expressionManager.getExpressionTrackName("blink");
        const blinkKeys = new NumberKeyframeTrack(
          blinkTrack as string,
          [0.0, 0.2, 0.4, 6.0], // times
          [0.0, 1.0, 0.0, 0.0] // values
        );
        const blinkClip = new AnimationClip(
          blinkTrack as string,
          6.8, // duration
          [blinkKeys]
        );
        const action = mixer.clipAction(blinkClip);
        action.play();
        resolve(mixer);
      });
    }, [getRandomAnimation]);

    // load vrm and play greet animation
    useEffect(() => {
      if ((!gltf && vrmUrl) || prevVrmUrl !== vrmUrl) {
        loader.loadAsync(vrmUrl).then(async (gltf: GLTF) => {
          setPrevVrmUrl(vrmUrl);
          const vrm = gltf.userData.vrm as VRM;
          VRMUtils.removeUnnecessaryJoints(vrm.scene);
          VRMUtils.removeUnnecessaryVertices(vrm.scene);

          vrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });

          const vrmScale = scale[0];

          if (scale[0]) {
            vrm.scene.scale.setScalar(scale[0]);

            // scale joints
            for (const joint of vrm.springBoneManager.joints) {
              joint.settings.stiffness *= vrmScale;
              joint.settings.hitRadius *= vrmScale;
            }

            // scale colliders
            for (const collider of vrm.springBoneManager.colliders) {
              const shape = collider.shape;
              if (shape instanceof VRMSpringBoneColliderShapeCapsule) {
                shape.radius *= vrmScale;
                shape.tail.multiplyScalar(vrmScale);
              } else if (shape instanceof VRMSpringBoneColliderShapeSphere) {
                shape.radius *= vrmScale;
              }
            }
          }

          setGltf(gltf);

          vrmRef.current = vrm;

          gltfLoaded?.(gltf);

          await setupAnimations();
          await setupAudioAnalyser();
          await setupAudioPlayer();
        });
      }
    }, [
      vrmUrl,
      scale,
      gltf,
      loader,
      prevVrmUrl,
      getRandomAnimation,
      gltfLoaded,
      playAnimation,
      setupAnimations,
      setupAudioAnalyser,
      setupAudioPlayer,
    ]);

    useImperativeHandle(ref, () => ({
      setText: (text: string) => {
        setCurrentText(text);
      },
      moveTo: async (position: number[]) => {
        await playAnimation("walk");
        setTargetPosition(position);
      },
      lookAt: (position: number[]) => {
        setTargetLookAt(position);
      },
      getPosition: () => {
        return new Vector3().setFromMatrixPosition(gltfRef.current.matrixWorld);
      },
      talk: async (audioUrl: string, targetLookAt?: number[]) =>
        new Promise(async (resolve) => {
          const randomTalk = getRandomAnimation("talk");
          const talkClip = await loadMixamoAnimation(
            randomTalk,
            vrmRef.current
          );
          const talkAction = animationMixer?.clipAction(talkClip);
          talkAction?.reset().setLoop(LoopOnce, 1).fadeIn(1).play();

          setTimeout(() => {
            talkAction?.fadeOut(1);
          }, (talkClip.duration - 1) * 1000);

          await moveMouth(audioUrl);

          if (targetLookAt) {
            setTargetLookAt(targetLookAt);
          }

          audio.src = audioUrl;
          audio.play();

          audio.addEventListener("ended", () => {
            if (talkAction.isRunning()) {
              talkAction.fadeOut(1);
            }
            resolve("ended");
          });
        }),
      playEmotion: async (emotion: string) => {
        // facial emotion
        const expressionManager = vrmRef.current?.expressionManager;

        if (expressionManager) {
          const transitionSpeed = 0.1; // Adjust this value to change the speed of the transition
          const updateFrequency = 75; // Adjust this value to change the frequency of the updates

          // Transition into the emotion
          const transitionInInterval = setInterval(() => {
            const currentValue = expressionManager.getValue(emotion);
            if (currentValue >= 1) {
              clearInterval(transitionInInterval);
            } else {
              expressionManager.setValue(
                emotion,
                currentValue + transitionSpeed
              );
              expressionManager.update();
            }
          }, updateFrequency);

          // Wait for 2-3 seconds, then transition out of the emotion
          setTimeout(() => {
            const transitionOutInterval = setInterval(() => {
              const currentValue = expressionManager.getValue(emotion);
              if (currentValue <= 0) {
                clearInterval(transitionOutInterval);
              } else {
                expressionManager.setValue(
                  emotion,
                  currentValue - transitionSpeed
                );
                expressionManager.update();
              }
            }, updateFrequency);
          }, 2000 + Math.random() * 1000); // Wait for a random time between 2 and 3 seconds
        }

        // body emotion
        if (emotion === "happy" || emotion === "angry" || emotion === "sad") {
          const randomEmotion = getRandomAnimation(emotion);
          const emotionClip = await loadMixamoAnimation(
            randomEmotion,
            vrmRef.current
          );
          const emotionAction = animationMixer?.clipAction(emotionClip);
          emotionAction?.reset().setLoop(LoopOnce, 1).fadeIn(1).play();

          setTimeout(() => {
            emotionAction?.fadeOut(1);
          }, (emotionClip.duration - 1) * 1000);
        }
      },
    }));

    return (
      <>
        {gltf?.scene && (
          <Suspense fallback={null}>
            {physics ? (
              <group>
                <Text
                  color="white"
                  anchorX={"center"}
                  anchorY={-0.4}
                  fontSize={0.05}
                  outlineColor={"black"}
                  outlineWidth={0.004}
                  maxWidth={1}
                  ref={virtualTextRef}
                >
                  {currentText}
                </Text>
                <RigidBody
                  ref={rigidBodyRef}
                  shape="capsule"
                  position={
                    position ? new Vector3().fromArray(position) : undefined
                  }
                  rotation={
                    rotation
                      ? new Euler().fromArray(rotation as any)
                      : undefined
                  }
                  restitution={0.1}
                >
                  <primitive
                    object={gltf.scene}
                    ref={gltfRef}
                    scale={scale || [1, 1, 1]}
                    receiveShadow
                    castShadow
                  />
                </RigidBody>
              </group>
            ) : (
              <group>
                <Text
                  color="white"
                  anchorX={"center"}
                  anchorY={-0.4}
                  fontSize={0.05}
                  outlineColor={"black"}
                  outlineWidth={0.004}
                  maxWidth={1}
                  ref={virtualTextRef}
                >
                  {currentText}
                </Text>
                <primitive
                  object={gltf.scene}
                  ref={gltfRef}
                  position={position}
                  rotation={rotation}
                  scale={scale || [1, 1, 1]}
                  receiveShadow
                  castShadow
                />
              </group>
            )}
          </Suspense>
        )}
      </>
    );
  }
);

export default VrmCompanion;
