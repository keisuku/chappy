"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BotAnimation } from "@/types";

interface HeroFigureProps {
  position: [number, number, number];
  color: string;
  emissive: string;
  power: number;
  isActive: boolean;
  name: string;
  side: "left" | "right";
  animation?: BotAnimation | null;
}

/**
 * Giant hero figure — occupies >40% of viewport.
 * Geometric robot silhouette with glowing elements.
 * Now responds to visual event animations.
 */
export function HeroFigure({
  position,
  color,
  emissive,
  power,
  isActive,
  name,
  side,
  animation,
}: HeroFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const emissiveCol = useMemo(() => new THREE.Color(emissive), [emissive]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      // Base breathing animation
      let yOffset = Math.sin(t * 1.2) * 0.03;
      let rotY = (side === "left" ? 0.15 : -0.15) + Math.sin(t * 0.5) * 0.05;
      let scaleVal = 1 + (power - 50) / 500;
      let xOffset = 0;

      // Event-driven animation overrides
      if (animation && isActive) {
        const ai = animation.intensity;

        switch (animation.type) {
          case "attack_lunge": {
            // Lunge toward center
            const lungeDir = side === "left" ? 1 : -1;
            const lungePhase = Math.sin(t * 8) * Math.max(0, 1 - ((t * 2) % 3));
            xOffset = lungeDir * lungePhase * ai * 0.8;
            rotY += lungeDir * lungePhase * ai * 0.1;
            break;
          }
          case "power_up": {
            // Scale pulse + vertical lift
            const pulsePhase = Math.sin(t * 4);
            scaleVal += pulsePhase * ai * 0.15;
            yOffset += Math.abs(pulsePhase) * ai * 0.1;
            break;
          }
          case "stagger": {
            // Knockback + wobble
            const staggerDir = side === "left" ? -1 : 1;
            const wobble = Math.sin(t * 10) * Math.max(0, 1 - ((t * 1.5) % 2));
            xOffset = staggerDir * wobble * ai * 0.4;
            rotY += wobble * ai * 0.15;
            yOffset -= ai * 0.05;
            break;
          }
          case "guard": {
            // Compact defensive pose
            scaleVal -= ai * 0.05;
            yOffset -= ai * 0.03;
            break;
          }
          case "celebrate": {
            // Bounce + expand
            const bouncePhase = Math.abs(Math.sin(t * 6));
            yOffset += bouncePhase * ai * 0.15;
            scaleVal += Math.sin(t * 3) * ai * 0.1;
            rotY += Math.sin(t * 2) * ai * 0.1;
            break;
          }
          case "charge": {
            // Lean forward + grow
            const chargeDir = side === "left" ? 1 : -1;
            rotY += chargeDir * ai * 0.1;
            scaleVal += ai * 0.05;
            const chargeGlow = Math.sin(t * 6);
            yOffset += chargeGlow * ai * 0.02;
            break;
          }
          case "dodge": {
            // Quick sidestep
            const dodgeDir = side === "left" ? -1 : 1;
            const dodgePhase = Math.sin(t * 12) * Math.max(0, 1 - ((t * 3) % 2));
            xOffset = dodgeDir * dodgePhase * ai * 0.5;
            break;
          }
        }
      }

      groupRef.current.position.x = position[0] + xOffset;
      groupRef.current.position.y = position[1] + yOffset;
      groupRef.current.rotation.y = rotY;
      groupRef.current.scale.setScalar(scaleVal);
    }

    // Eye glow pulse — intensifies during events
    if (eyeLeftRef.current && eyeRightRef.current) {
      let eyeIntensity = isActive ? 2 + Math.sin(t * 3) * 1.5 : 0.5;
      if (animation && isActive) {
        eyeIntensity += animation.intensity * 3;
      }
      const mat = eyeLeftRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = eyeIntensity;
      const mat2 = eyeRightRef.current.material as THREE.MeshStandardMaterial;
      mat2.emissiveIntensity = eyeIntensity;
    }

    // Core glow — pulses harder during events
    if (coreRef.current) {
      const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
      let coreIntensity = isActive ? 1 + Math.sin(t * 2) * 0.5 : 0.3;
      if (animation && isActive) {
        coreIntensity += animation.intensity * 2 * Math.abs(Math.sin(t * 4));
      }
      coreMat.emissiveIntensity = coreIntensity;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body — large torso block */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[1.2, 1.8, 0.8]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.7}
          roughness={0.3}
          emissive={emissiveCol}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-0.85, 2.6, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.6]} />
        <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.2} emissive={emissiveCol} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.85, 2.6, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.6]} />
        <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.2} emissive={emissiveCol} emissiveIntensity={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.7]} />
        <meshStandardMaterial
          color="#1a2a3a"
          metalness={0.9}
          roughness={0.1}
          emissive={emissiveCol}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Eyes */}
      <mesh ref={eyeLeftRef} position={[-0.15, 3.35, 0.36]}>
        <boxGeometry args={[0.15, 0.06, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.15, 3.35, 0.36]}>
        <boxGeometry args={[0.15, 0.06, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Core energy orb */}
      <mesh ref={coreRef} position={[0, 2, 0.45]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[0.4, 1.4, 0.5]} />
        <meshStandardMaterial color="#0a1628" metalness={0.6} roughness={0.4} emissive={emissiveCol} emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[0.4, 1.4, 0.5]} />
        <meshStandardMaterial color="#0a1628" metalness={0.6} roughness={0.4} emissive={emissiveCol} emissiveIntensity={0.05} />
      </mesh>

      {/* Arms */}
      <mesh position={[-1.1, 1.8, 0]} castShadow>
        <boxGeometry args={[0.3, 1.4, 0.35]} />
        <meshStandardMaterial color="#0a1628" metalness={0.6} roughness={0.4} emissive={emissiveCol} emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[1.1, 1.8, 0]} castShadow>
        <boxGeometry args={[0.3, 1.4, 0.35]} />
        <meshStandardMaterial color="#0a1628" metalness={0.6} roughness={0.4} emissive={emissiveCol} emissiveIntensity={0.05} />
      </mesh>

      {/* Power aura — ring around character */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.7, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1 : 0.2}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
