import { Component, type ReactNode } from "react";
import { AdaptiveDpr, PerformanceMonitor, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useExperience, type QualityTier } from "./store";

/**
 * Quality tiers. "auto" starts on high and steps down (or back up) from the
 * measured frame rate, so slower laptops stay smooth and fast ones get the
 * full picture. A manual choice in the tablet overrides it.
 */

export function QualityGovernor() {
  const setTier = useExperience((s) => s.setTier);
  return (
    <>
      <PerformanceMonitor
        ms={250}
        iterations={8}
        onDecline={() => setTier(Math.max(0, useExperience.getState().tier - 1) as QualityTier)}
        onIncline={() => setTier(Math.min(2, useExperience.getState().tier + 1) as QualityTier)}
        flipflops={3}
        onFallback={() => setTier(0)}
      />
      <AdaptiveDpr pixelated={false} />
    </>
  );
}

/** Bloom on the bright things (screens, sun, inlays), filmic tone mapping, edge smoothing, a soft vignette. */
export function PostFX() {
  const tier = useExperience((s) => s.tier);
  if (tier === 0) {
    return (
      <EffectComposer multisampling={0}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={tier === 2 ? 0.9 : 0.6} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.55} />
      <SMAA />
    </EffectComposer>
  );
}

/** Full-screen loading card driven by three.js's loading manager. */
export function LoadingOverlay({ language }: { language: "bg" | "en" }) {
  const { active, progress } = useProgress();
  const visible = active && progress < 100;
  return (
    <div className={`xp-loader${visible ? " is-visible" : ""}`} aria-hidden={!visible} role="status">
      <div className="xp-loader__card">
        <div className="xp-loader__mark" aria-hidden="true" />
        <p>{language === "bg" ? "Зареждане на света" : "Loading the world"}</p>
        <div className="xp-loader__bar"><span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} /></div>
        <small>{Math.round(progress)}%</small>
      </div>
    </div>
  );
}

/** Keeps a failed asset or shader from taking the whole page down. */
export class SceneErrorBoundary extends Component<{ children: ReactNode; onExit: () => void; language: "bg" | "en" }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("3D scene failed:", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    const bg = this.props.language === "bg";
    return (
      <div className="xp-failure" role="alert">
        <div className="xp-panel">
          <h2>{bg ? "Сцената не успя да се зареди" : "The scene could not load"}</h2>
          <p>{bg ? "Видеокартата или връзката не се справиха. Опитай пак или се върни към сайта." : "The graphics card or connection could not keep up. Try again or go back to the site."}</p>
          <div className="xp-row">
            <button className="xp-button" onClick={() => this.setState({ failed: false })}>{bg ? "Опитай пак" : "Try again"}</button>
            <button className="xp-button xp-button--primary" onClick={this.props.onExit}>{bg ? "Към сайта" : "Back to the site"}</button>
          </div>
        </div>
      </div>
    );
  }
}
