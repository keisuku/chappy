"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface HeroFigureProps {
  position: [number, number, number];
  color: string;
  emissive: string;
  power: number;
  isActive: boolean;
  name: string;
  side: "left" | "right";
}

/**
 * Giant hero figure — occupies >40% of viewport.
 * Geometric robot silhouette with glowing elements.
 */
export function HeroFigure({
  position,
  color,
  emissive,
  power,
  isActive,
  name,
  side,
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
      // Breathing animation
      const breathe = Math.sin(t * 1.2) * 0.03;
      groupRef.current.position.y = position[1] + breathe;

      // Slight rotation facing center
      const faceAngle = side === "left" ? 0.15 : -0.15;
      groupRef.current.rotation.y = faceAngle + Math.sin(t * 0.5) * 0.05;

      // Scale pulse on power
      const powerScale = 1 + (power - 50) / 500;
      groupRef.current.scale.setScalar(powerScale);
    }

    // Eye glow pulse
    if (eyeLeftRef.current && eyeRightRef.current) {
      const eyeIntensity = isActive
        ? 2 + Math.sin(t * 3) * 1.5
        : 0.5;
      const mat = eyeLeftRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = eyeIntensity;
      const mat2 = eyeRightRef.current.material as THREE.MeshStandardMaterial;
      mat2.emissiveIntensity = eyeIntensity;
    }

    // Core glow
    if (coreRef.current) {
      const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
      coreMat.emissiveIntensity = isActive
        ? 1 + Math.sin(t * 2) * 0.5
        : 0.3;
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
