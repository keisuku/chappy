"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ArenaScene } from "./ArenaScene";
import { BattleState, StageConfig } from "@/types";

interface BattleArenaProps {
  battleState: BattleState;
  stageConfig: StageConfig;
}

export function BattleArena({ battleState, stageConfig }: BattleArenaProps) {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#050d1a"]} />
        <fog attach="fog" args={["#050d1a", 10, 30]} />
        <Suspense fallback={null}>
          <ArenaScene battleState={battleState} stageConfig={stageConfig} />
        </Suspense>
      </Canvas>
    </div>
  );
}
