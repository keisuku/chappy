"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Candlestick } from "@/types";

interface CandlestickWallProps {
  candles: Candlestick[];
}

/**
 * Massive candlestick chart rendered as a wall behind the battle arena.
 * Green = bullish, Red = bearish. Giant scale for cinematic impact.
 */
export function CandlestickWall({ candles }: CandlestickWallProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Normalize candles for display
  const displayData = useMemo(() => {
    if (candles.length === 0) return [];

    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;

    return candles.slice(-60).map((c, i) => {
      const normalize = (v: number) => ((v - minP) / range) * 6; // 6 units tall
      const isBull = c.close >= c.open;
      return {
        x: (i - 30) * 0.22,
        bodyBottom: normalize(Math.min(c.open, c.close)),
        bodyTop: normalize(Math.max(c.open, c.close)),
        wickBottom: normalize(c.low),
        wickTop: normalize(c.high),
        isBull,
      };
    });
  }, [candles]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Subtle drift
      groupRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.2;
    }
  });

  const bullColor = new THREE.Color("#00cc66");
  const bearColor = new THREE.Color("#ff2244");
  const bullEmissive = new THREE.Color("#004422");
  const bearEmissive = new THREE.Color("#440011");

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {displayData.map((d, i) => {
        const bodyH = Math.max(0.02, d.bodyTop - d.bodyBottom);
        const bodyY = d.bodyBottom + bodyH / 2;
        const wickH = d.wickTop - d.wickBottom;
        const wickY = d.wickBottom + wickH / 2;
        const color = d.isBull ? bullColor : bearColor;
        const emissive = d.isBull ? bullEmissive : bearEmissive;

        return (
          <group key={i} position={[d.x, 0, 0]}>
            {/* Candle body */}
            <mesh position={[0, bodyY, 0]}>
              <boxGeometry args={[0.14, bodyH, 0.14]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={0.5}
                metalness={0.4}
                roughness={0.6}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Wick */}
            <mesh position={[0, wickY, 0]}>
              <boxGeometry args={[0.02, wickH, 0.02]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={0.3}
                transparent
                opacity={0.6}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
