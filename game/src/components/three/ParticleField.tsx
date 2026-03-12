"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  count: number;
  color: string;
  isActive: boolean;
  stage: number;
}

/**
 * Large-scale particle system for cinematic battle effects.
 * Particles drift upward and pulse with the battle stage.
 */
export function ParticleField({ count, color, isActive, stage }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);

  const particleCount = Math.max(50, count * 10);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 2;

      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = 0.005 + Math.random() * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    return { positions: pos, velocities: vel };
  }, [particleCount]);

  useFrame(() => {
    if (!meshRef.current) return;

    const posAttr = meshRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const speedMult = isActive ? 1 + stage * 0.3 : 0.5;

    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] += velocities[i * 3] * speedMult;
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * speedMult;
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * speedMult;

      // Reset particles that drift too high
      if (posArray[i * 3 + 1] > 12) {
        posArray[i * 3] = (Math.random() - 0.5) * 20;
        posArray[i * 3 + 1] = -1;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 15 - 2;
      }
    }

    posAttr.needsUpdate = true;
  });

  const particleColor = useMemo(() => new THREE.Color(color), [color]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color={particleColor}
        size={0.08}
        transparent
        opacity={isActive ? 0.6 : 0.2}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
