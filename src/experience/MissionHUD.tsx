import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { regionsData } from "@/data/questions";
import Keys from "./Keys";
import { useExperience } from "./store";
import { drive } from "./missionDrive";

const CITY_TRAVEL_SECONDS = 3;

/** Live speed in km/h, read from the shared drive state each frame without re-rendering React. */
function Speedometer() {
  const value = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const kmh = Math.round(drive.speed * 3.6);
      if (value.current && value.current.textContent !== String(kmh)) value.current.textContent = String(kmh);
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, drive.speed / 26)})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="xp-panel xp-speedo" aria-hidden="true">
      <span ref={value} className="xp-speedo__value">0</span>
      <span className="xp-speedo__unit">km/h</span>
      <span className="xp-speedo__track"><span ref={bar} /></span>
    </div>
  );
}

/** Game 1 overlay: the current objective, the keys for it, the region and progress, and a way back. */
export default function MissionHUD() {
  const phase = useExperience((s) => s.missionPhase);
  const setMissionPhase = useExperience((s) => s.setMissionPhase);
  const regionId = useExperience((s) => s.currentRegionId);
  const regionIndex = useExperience((s) => s.regionIndex);
  const driveSeconds = useExperience((s) => s.driveSeconds);
  const returnToTower = useExperience((s) => s.returnToTower);
  const { language } = useLanguage();
  const bg = language === "bg";
  const name = regionsData[regionId]?.name[language] ?? regionId;

  if (phase === "quiz") return null;

  const left = Math.max(0, CITY_TRAVEL_SECONDS - Math.floor(driveSeconds));
  const objective: Record<Exclude<typeof phase, "quiz">, string> = {
    freefall: bg ? "Свободно падане. Отвори парашута, когато си готов." : "Freefall. Open the parachute when you are ready.",
    parachute: bg ? "Парашутът е отворен. Плъзгаш се към пътя." : "Canopy open. Gliding down to the road.",
    roadside: bg ? "Приземи се до пътя." : "You landed by the road.",
    driving: bg ? `Карай към следващата област · ${left} s` : `Drive to the next province · ${left} s`,
    pullOver: bg ? `Пристигаш в „${name}“. Колата спира до табелата и въпросите се отварят сами.` : `Arriving in ${name}. The car stops by the sign and the questions open by themselves.`,
  };
  const keys: Record<Exclude<typeof phase, "quiz">, [string, string][]> = {
    freefall: [["Click", bg ? "парашут" : "parachute"], ["Esc", bg ? "към сайта" : "back to the site"]],
    parachute: [["Esc", bg ? "към сайта" : "back to the site"]],
    roadside: [["Esc", bg ? "към сайта" : "back to the site"]],
    driving: [["W", bg ? "газ" : "faster"], ["S", bg ? "спирачка" : "brake"], ["A D", bg ? "волан" : "steer"], ["Esc", bg ? "към сайта" : "back to the site"]],
    pullOver: [["Esc", bg ? "към сайта" : "back to the site"]],
  };

  return (
    <div className="xp-hud">
      <header className="xp-topbar">
        <div className="xp-panel xp-titlecard">
          <span className="xp-eyebrow">{bg ? "Игра 1 · Области" : "Game 1 · Provinces"}</span>
          <h1>{name}</h1>
          <div className="xp-progress"><span style={{ transform: `scaleX(${(regionIndex + 1) / 28})` }} /></div>
          <small>{regionIndex + 1} / 28</small>
        </div>
        <button className="xp-button" onClick={returnToTower}>{bg ? "Към станцията" : "Back to the station"}</button>
      </header>
      <div className="xp-panel xp-objective" role="status" aria-live="polite">{objective[phase]}</div>
      {phase === "roadside" && (
        <button type="button" className="xp-panel xp-enter" onClick={() => setMissionPhase("driving")}>
          <kbd>E</kbd>
          <span>
            <strong>{bg ? "Натисни E" : "Press E"}</strong>
            {bg ? "за да влезеш в колата" : "to get in the car"}
          </span>
        </button>
      )}
      {(phase === "driving" || phase === "pullOver") && <Speedometer />}
      <div className="xp-bottom"><Keys items={keys[phase]} /></div>
    </div>
  );
}
