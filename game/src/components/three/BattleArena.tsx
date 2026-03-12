"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, Component, ReactNode } from "react";
import { ArenaScene } from "./ArenaScene";
import { BattleState, StageConfig } from "@/types";

interface BattleArenaProps {
  battleState: BattleState;
  stageConfig: StageConfig;
}

// Error boundary to catch WebGL/Three.js failures
class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-0 flex items-center justify-center" style={{ background: "#050d1a" }}>
          <div className="text-center p-8">
            <div className="text-xl font-bold mb-4" style={{ color: "#ff2d55" }}>
              WebGL Error
            </div>
            <div className="text-sm opacity-60 mb-4">{this.state.error}</div>
            <div className="text-xs opacity-40">
              WebGL対応ブラウザが必要です
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function BattleArena({ battleState, stageConfig }: BattleArenaProps) {
  return (
    <div className="fixed inset-0 z-0">
      <WebGLErrorBoundary fallback={null}>
        <Canvas
          camera={{ position: [0, 2, 8], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
          onCreated={() => {
            console.log("[CoinBattle] WebGL canvas initialized");
          }}
        >
          <color attach="background" args={["#050d1a"]} />
          <fog attach="fog" args={["#050d1a", 10, 30]} />
          <Suspense fallback={null}>
            <ArenaScene battleState={battleState} stageConfig={stageConfig} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
