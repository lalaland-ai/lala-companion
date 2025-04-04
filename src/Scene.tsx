import { VRM } from "@pixiv/three-vrm";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import React, { useRef, useEffect, RefObject } from "react";
import { Mesh } from "three";
import { animations } from "./constants/animations";
import VrmCompanion from "./components/VRMCompanion";

interface SceneProps {
  virtualText: string;
  voiceUrl: string;
  audioRef?: RefObject<HTMLAudioElement>;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

const Scene = ({
  virtualText,
  voiceUrl,
  onSpeakStart,
  onSpeakEnd,
}: SceneProps) => {
  const vrmRef = useRef<VRM>(null);
  const vrmMeshRef = useRef<Mesh>(null);
  const vrmPhysicsRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (virtualText) {
      (vrmRef as any)?.current?.setText?.(virtualText);
    }
  }, [virtualText]);

  useEffect(() => {
    const speak = async () => {
      if (voiceUrl) {
        onSpeakStart?.();
        await (vrmRef as any)?.current?.talk?.(voiceUrl);
        onSpeakEnd?.();
      }
    };
    speak();
  }, [voiceUrl]);

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

        {/* left */}
        <pointLight position={[1, 2, 1]} intensity={2.5} castShadow />

        {/* right */}
        <pointLight position={[-1, 2, 1]} intensity={2.5} castShadow />

        <VrmCompanion
          ref={vrmRef}
          meshRef={vrmMeshRef}
          physicsRef={vrmPhysicsRef}
          vrmUrl={"./assets/vrms/lala.vrm"}
          animations={animations}
          scale={[1, 1, 1]}
          position={[0, -1, 0]}
          rotation={[0, Math.PI, 0]}
          isStaticPosition
        />
      </Canvas>
    </>
  );
};

export default Scene;
