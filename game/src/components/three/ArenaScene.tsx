"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { BattleState, StageConfig } from "@/types";
import { HeroFigure } from "./HeroFigure";
import { CandlestickWall } from "./CandlestickWall";
import { ParticleField } from "./ParticleField";

interface ArenaSceneProps {
  battleState: BattleState;
  stageConfig: StageConfig;
}

export function ArenaScene({ battleState, stageConfig }: ArenaSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();

    // Dynamic camera: low angle cinematic sway
    camera.position.x = Math.sin(t * 0.15) * 1.5;
    camera.position.y = 1.5 + Math.sin(t * 0.1) * 0.3;
    camera.position.z = 7 + Math.sin(t * 0.08) * 0.5;
    camera.lookAt(0, 1.5, 0);

    // Camera shake at high stages
    if (stageConfig.shakeIntensity > 0 && battleState.isActive) {
      const shake = stageConfig.shakeIntensity;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }

    // Animate light
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(t * 2) * 0.5 * stageConfig.bloomStrength;
    }
  });

  const leftColor = battleState.leftBot.character.primaryColor;
  const rightColor = battleState.rightBot.character.primaryColor;

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#aaccff" />
      <pointLight ref={lightRef} position={[0, 5, 3]} intensity={2} color={stageConfig.color} distance={20} />
      <pointLight position={[-4, 3, 2]} intensity={1} color={leftColor} distance={12} />
      <pointLight position={[4, 3, 2]} intensity={1} color={rightColor} distance={12} />

      {/* Environment */}
      <Environment preset="night" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#0a1628"
          metalness={0.8}
          roughness={0.3}
          emissive="#001122"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Grid lines on floor */}
      <gridHelper args={[30, 60, "#112244", "#0a1830"]} position={[0, -0.49, 0]} />

      {/* Candlestick wall behind characters */}
      <CandlestickWall candles={battleState.candles} />

      {/* LEFT HERO — positioned left, huge scale */}
      <HeroFigure
        position={[-2.5, 0, 0]}
        color={leftColor}
        emissive={battleState.leftBot.character.emissiveColor}
        power={battleState.leftBot.power}
        isActive={battleState.isActive}
        name={battleState.leftBot.character.name}
        side="left"
      />

      {/* RIGHT HERO — positioned right, huge scale */}
      <HeroFigure
        position={[2.5, 0, 0]}
        color={rightColor}
        emissive={battleState.rightBot.character.emissiveColor}
        power={battleState.rightBot.power}
        isActive={battleState.isActive}
        name={battleState.rightBot.character.name}
        side="right"
      />

      {/* Particles */}
      <ParticleField
        count={stageConfig.particleCount}
        color={stageConfig.color}
        isActive={battleState.isActive}
        stage={stageConfig.id}
      />
    </group>
  );
}
