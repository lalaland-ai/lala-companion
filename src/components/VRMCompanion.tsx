import React, {
  MutableRefObject,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMUtils, VRMLoaderPlugin } from "@pixiv/three-vrm";
import {
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  NumberKeyframeTrack,
} from "three";
import { loadMixamoAnimation } from "../helpers/loadMixamoAnimation";

const vrms = [
  {
    rotation: [0.1, 3, 0],
    model: "https://lalaland.chat/vrms/purple-girl.vrm",
    scale: [1, 1, 1],
    animations: {
      idle: [
        "https://lalaland.chat/animations/female/idle-1.fbx",
        "https://lalaland.chat/animations/female/idle-2.fbx",
      ],
      greet: [
        "https://lalaland.chat/animations/female/greet-1.fbx",
        "https://lalaland.chat/animations/female/salute.fbx",
        "https://lalaland.chat/animations/female/cat-ass.fbx",
      ],
      talk: [
        "https://lalaland.chat/animations/female/talk-1.fbx",
        "https://lalaland.chat/animations/female/talk-2.fbx",
        "https://lalaland.chat/animations/female/talk-3.fbx",
      ],
      bored: ["https://lalaland.chat/animations/female/cat-ass.fbx"],
    },
  },
];

interface VrmCompanionProps {
  virtualText: string;
  voiceUrl: string;
  audioRef?: MutableRefObject<HTMLAudioElement>;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

const VrmCompanion = ({
  virtualText,
  voiceUrl,
  audioRef,
  onSpeakStart,
  onSpeakEnd,
}: VrmCompanionProps) => {
  const [gltf, setGltf] = useState(null);
  const [animationMixer, setAnimationMixer] = useState<AnimationMixer>(null);
  const [currentClip, setCurrentClip] = useState<AnimationClip>(null);

  const loader = useMemo(() => {
    return new GLTFLoader().register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          autoUpdateHumanBones: true,
        })
    );
  }, []);

  const randomVrm = useMemo(
    () => vrms[Math.floor(Math.random() * vrms.length)],
    []
  );

  const gltfRef = useRef<any>();
  const vrmRef = useRef<VRM>();
  const textRef = useRef<Text>(null);

  useFrame(({ clock }, delta) => {
    const s = Math.sin(Math.PI * clock.elapsedTime);

    const expressionManager = vrmRef.current?.expressionManager;

    if (expressionManager && animationMixer) {
      // expressionManager.setValue("aa", 1.0);
      vrmRef.current.update(clock.getDelta());
    }

    if (animationMixer?.update) {
      animationMixer.update(delta);
    }
    if (vrmRef?.current?.update) {
      vrmRef.current.update(delta);
    }

    if (textRef.current) {
      (textRef.current as any).position.y = s * 0.01;
    }
  });

  const playAnimation = useCallback(
    async (
      animationFile: string,
      vrm: VRM,
      currentMixer?: AnimationMixer,
      oldClip?: AnimationClip
    ) => {
      const clip = await loadMixamoAnimation(animationFile, vrm);

      if (oldClip || currentClip) {
        (currentMixer || animationMixer)
          .clipAction(oldClip || currentClip)
          .fadeOut(2);
      }
      (currentMixer || animationMixer).clipAction(clip).fadeIn(2).play();
      setCurrentClip(clip);

      return clip;
    },
    [animationMixer, currentClip]
  );

  const getRandomAnimation = useCallback(
    (type: string) => {
      const randomAnim = (randomVrm as any).animations?.[type]?.[
        Math.floor(
          Math.random() * (randomVrm as any).animations?.[type]?.length
        )
      ];

      return randomAnim;
    },
    [randomVrm.animations]
  );

  // load vrm and play greet animation
  useEffect(() => {
    if (!gltf) {
      loader.loadAsync(randomVrm.model).then(async (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        VRMUtils.removeUnnecessaryJoints(vrm.scene);
        VRMUtils.removeUnnecessaryVertices(vrm.scene);

        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

        setGltf(gltf);
        vrmRef.current = vrm;

        const currentMixer = new AnimationMixer(vrm.scene);
        currentMixer.timeScale = 1.0;
        setAnimationMixer(currentMixer);

        // wave greet
        const randomGreet = getRandomAnimation("greet");
        const greetClip = await playAnimation(randomGreet, vrm, currentMixer);

        // happy expression
        const happyName = vrm.expressionManager.getExpressionTrackName("happy");
        const happyTrack = new NumberKeyframeTrack(
          happyName,
          [0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0], // times
          [0.0, 0.2, 0.4, 0.6, 0.7, 0.7, 0.6, 0.6, 0.4, 0.2, 0.0] // values
        );
        const happyClip = new AnimationClip(
          happyName,
          6.8, // duration
          [happyTrack]
        );
        const happyAction = currentMixer.clipAction(happyClip);
        happyAction.setLoop(LoopOnce, 1).play();

        // blink loop
        const trackName = vrm.expressionManager.getExpressionTrackName("blink");
        const track = new NumberKeyframeTrack(
          trackName,
          [0.0, 0.2, 0.4, 6.0], // times
          [0.0, 1.0, 0.0, 0.0] // values
        );
        const clip = new AnimationClip(
          trackName,
          6.8, // duration
          [track]
        );
        const action = currentMixer.clipAction(clip);
        action.play();

        // greet cleanup to idle
        setTimeout(async () => {
          const randomIdle = getRandomAnimation("idle");
          await playAnimation(randomIdle, vrm, currentMixer, greetClip);
        }, greetClip.duration * 1000);
      });
    }
  }, [getRandomAnimation, gltf, loader, playAnimation, randomVrm.model]);

  useEffect(() => {
    const main = async () => {
      if (voiceUrl) {
        onSpeakStart?.();
        audioRef.current.src = voiceUrl;
        audioRef.current.play();

        const randomTalk = getRandomAnimation("talk");
        const talkClip = await playAnimation(randomTalk, vrmRef.current);

        // lips movement
        const trackName =
          vrmRef.current.expressionManager.getExpressionTrackName("aa");
        const track = new NumberKeyframeTrack(
          trackName,
          [0.0, 0.5, 1.5, 2.0, 2.5], // times
          [0.0, 1.0, 0.0, 1.0, 0.0] // values
        );
        const clip = new AnimationClip(
          trackName,
          2.5, // duration
          [track]
        );
        const lipsAction = animationMixer.clipAction(clip);
        lipsAction.play();

        audioRef.current.onended = async () => {
          onSpeakEnd?.();
          animationMixer.clipAction(talkClip).fadeOut(2);
          lipsAction.fadeOut(1);
          const randomIdle = getRandomAnimation("idle");
          await playAnimation(randomIdle, vrmRef.current);
        };
      }
    };
    main();
  }, [voiceUrl]);

  return (
    <>
      {gltf?.scene && (
        <Suspense fallback={null}>
          <group>
            <Text
              color="white"
              anchorX={"center"}
              anchorY={-0.9}
              fontSize={0.05}
              outlineColor={"black"}
              outlineWidth={0.004}
              maxWidth={1}
              ref={textRef}
            >
              {virtualText}
            </Text>
            <primitive
              object={gltf.scene}
              ref={gltfRef}
              rotation={randomVrm.rotation}
              scale={randomVrm.scale || [1, 1, 1]}
              position={[0, -1, 0]}
            />
          </group>
        </Suspense>
      )}
    </>
  );
};

const Scene = ({ virtualText, voiceUrl, onSpeakStart, onSpeakEnd }: VrmCompanionProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <>
      <Canvas
        style={{
          zIndex: 1,
          height: "100vh",
          width: "100%",
        }}
      >
        <OrbitControls
          makeDefault
          minDistance={0.75}
          maxDistance={1.5}
          enableDamping
        />
        <ambientLight />
        <spotLight position={[0, 5, -3]} intensity={20} />
        <VrmCompanion
          virtualText={virtualText}
          voiceUrl={voiceUrl}
          audioRef={audioRef}
          onSpeakStart={onSpeakStart}
          onSpeakEnd={onSpeakEnd}
        />
      </Canvas>
      <audio autoPlay ref={audioRef} src={""} />
    </>
  );
};

export default Scene;
