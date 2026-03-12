"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { BattleState, StageConfig, VisualBattleEvent } from "@/types";
import { HeroFigure } from "./HeroFigure";
import { CandlestickWall } from "./CandlestickWall";
import { ParticleField } from "./ParticleField";

interface ArenaSceneProps {
  battleState: BattleState;
  stageConfig: StageConfig;
  activeEvents?: VisualBattleEvent[];
}

export function ArenaScene({ battleState, stageConfig, activeEvents = [] }: ArenaSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const eventFlashRef = useRef<THREE.PointLight>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);

  // Get dominant event (highest excitement)
  const dominantEvent = activeEvents.length > 0 ? activeEvents[0] : null;

  // Derive event-driven camera parameters
  const eventCamera = useMemo(() => {
    if (!dominantEvent) return null;
    return dominantEvent.camera;
  }, [dominantEvent]);

  const eventVisual = useMemo(() => {
    if (!dominantEvent) return null;
    return dominantEvent.visual;
  }, [dominantEvent]);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();

    // Base camera: low angle cinematic sway
    let camX = Math.sin(t * 0.15) * 1.5;
    let camY = 1.5 + Math.sin(t * 0.1) * 0.3;
    let camZ = 7 + Math.sin(t * 0.08) * 0.5;
    let lookX = 0;
    const lookY = 1.5;

    // Event-driven camera overrides
    if (eventCamera && battleState.isActive) {
      const ei = eventCamera.intensity;

      switch (eventCamera.type) {
        case "zoom_in":
          camZ -= ei * 2.5;
          if (eventCamera.target === "left") { camX -= ei * 1.5; lookX = -1.5; }
          else if (eventCamera.target === "right") { camX += ei * 1.5; lookX = 1.5; }
          break;
        case "zoom_out":
          camZ += ei * 2;
          break;
        case "slam":
          camY -= ei * 0.5;
          camZ -= ei * 1.5;
          camX += (Math.random() - 0.5) * ei * 0.3;
          camY += (Math.random() - 0.5) * ei * 0.3;
          break;
        case "orbit_fast":
          camX = Math.sin(t * 1.5) * (3 + ei * 2);
          camZ = Math.cos(t * 1.5) * (6 + ei);
          camY = 2 + ei;
          break;
        case "shake":
          camX += (Math.random() - 0.5) * ei * 0.4;
          camY += (Math.random() - 0.5) * ei * 0.3;
          break;
        case "pan_to":
          if (eventCamera.target === "left") lookX = -2;
          else if (eventCamera.target === "right") lookX = 2;
          break;
      }
    }

    // Stage-based shake (additive)
    if (stageConfig.shakeIntensity > 0 && battleState.isActive) {
      const shake = stageConfig.shakeIntensity;
      camX += (Math.random() - 0.5) * shake;
      camY += (Math.random() - 0.5) * shake;
    }

    camera.position.set(camX, camY, camZ);
    camera.lookAt(lookX, lookY, 0);

    // Stage light pulse
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(t * 2) * 0.5 * stageConfig.bloomStrength;
    }

    // Event flash light
    if (eventFlashRef.current) {
      if (eventVisual && eventVisual.type !== "none") {
        eventFlashRef.current.visible = true;
        const flashColor = new THREE.Color(eventVisual.color);
        eventFlashRef.current.color = flashColor;
        // Pulse flash intensity then decay
        const flashPhase = (t * 4) % (Math.PI * 2);
        eventFlashRef.current.intensity = eventVisual.intensity * 8 * Math.max(0, Math.sin(flashPhase));
      } else {
        eventFlashRef.current.visible = false;
        eventFlashRef.current.intensity = 0;
      }
    }

    // Shockwave ring expansion
    if (shockwaveRef.current) {
      if (eventVisual && eventVisual.type === "shockwave") {
        shockwaveRef.current.visible = true;
        const expandPhase = (t * 2) % 3;
        const scale = 1 + expandPhase * eventVisual.radius;
        shockwaveRef.current.scale.setScalar(scale);
        const mat = shockwaveRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(0, 0.6 - expandPhase * 0.2);
        mat.emissiveIntensity = eventVisual.intensity * 2;
        mat.emissive = new THREE.Color(eventVisual.color);
      } else {
        shockwaveRef.current.visible = false;
      }
    }
  });

  const leftColor = battleState.leftBot.character.primaryColor;
  const rightColor = battleState.rightBot.character.primaryColor;

  // Compute hero animation state from events
  const leftAnimation = useMemo(() => {
    const event = activeEvents.find(
      (e) => e.animation.side === "left" || e.animation.side === "both"
    );
    return event?.animation ?? null;
  }, [activeEvents]);

  const rightAnimation = useMemo(() => {
    const event = activeEvents.find(
      (e) => e.animation.side === "right" || e.animation.side === "both"
    );
    return event?.animation ?? null;
  }, [activeEvents]);

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#aaccff" />
      <pointLight ref={lightRef} position={[0, 5, 3]} intensity={2} color={stageConfig.color} distance={20} />
      <pointLight position={[-4, 3, 2]} intensity={1} color={leftColor} distance={12} />
      <pointLight position={[4, 3, 2]} intensity={1} color={rightColor} distance={12} />

      {/* Event flash light */}
      <pointLight ref={eventFlashRef} position={[0, 4, 4]} intensity={0} color="#ffffff" distance={25} visible={false} />

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

      {/* Shockwave ring (event-driven) */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} visible={false}>
        <ringGeometry args={[0.8, 1.0, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

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
        animation={leftAnimation}
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
        animation={rightAnimation}
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
