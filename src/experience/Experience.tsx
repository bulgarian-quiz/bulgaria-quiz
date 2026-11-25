import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PCScene from "./PCScene";
import TowerScene from "./TowerScene";
import Tablet from "./Tablet";
import { TIER_DPR, useExperience } from "./store";
import MissionScene from "./MissionScene";
import MissionHUD from "./MissionHUD";
import ExperienceQuiz from "./ExperienceQuiz";
import BoardScene from "./BoardScene";
import BoardHUD from "./BoardHUD";
import { LoadingOverlay, PostFX, QualityGovernor, SceneErrorBoundary } from "./rendering";
import Keys from "./Keys";
import "./experience.css";

export default function Experience() {
  const stage = useExperience((s) => s.stage);
  const tabletOpen = useExperience((s) => s.tabletOpen);
  const setTablet = useExperience((s) => s.setTablet);
  const setMode = useExperience((s) => s.setMode);
  const activeGame = useExperience((s) => s.activeGame);
  const missionPhase = useExperience((s) => s.missionPhase);
  const nearTable = useExperience((s) => s.nearTable);
  const tier = useExperience((s) => s.tier);
  const { language } = useLanguage();
  const bg = language === "bg";
  const [flash, setFlash] = useState(0);
  const [locked, setLocked] = useState(false);
  const inWorld = stage === "tower";
  const onStation = inWorld && activeGame === "none";

  const exitToSite = useCallback(() => {
    document.exitPointerLock?.();
    const url = new URL(window.location.href);
    url.searchParams.delete("experience");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setMode("legacy");
  }, [setMode]);

  useEffect(() => {
    if (stage === "divein") setFlash(1);
    if (stage === "tower") { const t = setTimeout(() => setFlash(0), 250); return () => clearTimeout(t); }
  }, [stage]);

  useEffect(() => {
    const onLock = () => setLocked(!!document.pointerLockElement);
    const onKey = (e: KeyboardEvent) => {
      // Escape always leaves the 3D experience for the standard site.
      if (e.key === "Escape") { e.preventDefault(); exitToSite(); return; }
      if (!inWorld || activeGame !== "none") return;
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "")) return;
      if (e.key.toLowerCase() === "t") setTablet(!tabletOpen);
    };
    document.addEventListener("pointerlockchange", onLock);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerlockchange", onLock);
      window.removeEventListener("keydown", onKey);
    };
  }, [inWorld, activeGame, tabletOpen, setTablet, exitToSite]);

  const scene = stage !== "tower" ? <PCScene language={language} />
    : activeGame === "quiz3d" ? <MissionScene />
    : activeGame === "dragdrop3d" ? <BoardScene />
    : <TowerScene />;

  return (
    <div className={`xp-root${onStation && !tabletOpen ? " is-roaming" : ""}`}>
      <SceneErrorBoundary onExit={exitToSite} language={language}>
        <Canvas
          flat
          shadows={tier > 0}
          dpr={TIER_DPR[tier]}
          camera={{ fov: 70, near: 0.02, far: 2000, position: [0, 1.22, 0.4] }}
          gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
        >
          <QualityGovernor />
          <Suspense fallback={null}>
            {scene}
            <PostFX />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
      <LoadingOverlay language={language} />

      {stage === "pc" && (
        <div className="xp-hud">
          <div className="xp-bottom">
            <div className="xp-panel xp-pill">
              {bg ? "Напиши " : "Type "}<code>divein</code>{bg ? " в терминала и натисни Enter" : " in the terminal and press Enter"}
            </div>
            <Keys items={[["Esc", bg ? "към сайта" : "back to the site"]]} />
          </div>
        </div>
      )}

      {onStation && !tabletOpen && (
        <div className="xp-hud">
          {locked && <div className="xp-crosshair" aria-hidden="true" />}
          {nearTable && (
            <div className="xp-panel xp-prompt" role="status">
              <kbd>E</kbd> {bg ? "Отвори картата на мисиите" : "Open the mission map"}
            </div>
          )}
          <div className="xp-bottom">
            {!locked && <div className="xp-panel xp-pill">{bg ? "Кликни, за да се оглеждаш с мишката" : "Click to look around with the mouse"}</div>}
            <Keys items={[
              ["W A S D", bg ? "движение" : "move"],
              ["Space", bg ? "скок" : "jump"],
              ["T", bg ? "таблет" : "tablet"],
              ["Esc", bg ? "към сайта" : "back to the site"],
            ]} />
          </div>
        </div>
      )}

      {onStation && <Tablet />}
      {inWorld && activeGame === "quiz3d" && <MissionHUD />}
      {inWorld && activeGame === "quiz3d" && missionPhase === "quiz" && <ExperienceQuiz />}
      {inWorld && activeGame === "dragdrop3d" && <BoardHUD />}

      <div className="xp-flash" style={{ opacity: flash, transitionDuration: flash ? "1400ms" : "1600ms" }} aria-hidden="true" />
    </div>
  );
}
