import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePoints } from "@/contexts/PointsContext";
import { regionsData } from "@/data/questions";
import { boardPicker } from "./boardPicker";
import { regionRoute } from "./regions";
import { useExperience } from "./store";

const TOTAL = 28;

/** Game 2 overlay: progress, the region tray (drag onto the map or tap then click), feedback and the finish card. */
export default function BoardHUD() {
  const { language } = useLanguage();
  const bg = language === "bg";
  const { awardRegionPlaced, awardGameComplete } = usePoints();
  const placed = useExperience((s) => s.boardPlaced);
  const selected = useExperience((s) => s.boardSelected);
  const feedback = useExperience((s) => s.boardFeedback);
  const select = useExperience((s) => s.selectBoardRegion);
  const place = useExperience((s) => s.placeBoardRegion);
  const returnToTower = useExperience((s) => s.returnToTower);
  const launchGame = useExperience((s) => s.launchGame);
  const count = Object.keys(placed).length;
  const done = count >= TOTAL;
  const [toast, setToast] = useState<{ ok: boolean; key: number } | null>(null);
  const awarded = useRef(false);

  // Shuffle once per game so chips never jump around while you play.
  const order = useMemo(() => {
    const list = [...regionRoute];
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count === 0]);

  useEffect(() => {
    if (!feedback) return;
    setToast({ ok: feedback.ok, key: feedback.at });
    if (feedback.ok) void awardRegionPlaced();
    const t = window.setTimeout(() => setToast(null), 1400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback?.at]);

  useEffect(() => {
    if (done && !awarded.current) { awarded.current = true; void awardGameComplete(); }
    if (!done) awarded.current = false;
  }, [done, awardGameComplete]);

  // Dropping a chip anywhere on the canvas: find the province under the pointer.
  useEffect(() => {
    const over = (e: DragEvent) => { if (e.dataTransfer?.types.includes("text/plain")) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      const source = e.dataTransfer?.getData("text/plain");
      if (!source) return;
      e.preventDefault();
      const target = boardPicker.current?.(e.clientX, e.clientY);
      if (target) place(target, source);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => { window.removeEventListener("dragover", over); window.removeEventListener("drop", drop); };
  }, [place]);

  const name = (id: string) => regionsData[id]?.name[language] ?? id;
  const hint = done ? "" : selected
    ? (bg ? `Кликни върху мястото на „${name(selected)}“ на картата` : `Click where ${name(selected)} is on the map`)
    : (bg ? "Избери област от списъка, после я постави на картата" : "Pick a region from the list, then place it on the map");

  return (
    <div className="xp-hud">
      <header className="xp-topbar">
        <div className="xp-panel xp-titlecard">
          <span className="xp-eyebrow">{bg ? "Игра 2" : "Game 2"}</span>
          <h1>{bg ? "Подреди областите" : "Arrange the regions"}</h1>
          <div className="xp-progress" aria-label={`${count} / ${TOTAL}`}>
            <span style={{ transform: `scaleX(${count / TOTAL})` }} />
          </div>
          <small>{count} / {TOTAL}</small>
        </div>
        <button className="xp-button" onClick={returnToTower}>{bg ? "Към станцията" : "Back to the station"}</button>
      </header>

      {!done && <p className="xp-hint" aria-live="polite">{hint}</p>}

      {toast && (
        <div key={toast.key} className={`xp-toast ${toast.ok ? "is-ok" : "is-bad"}`} role="status">
          {toast.ok ? (bg ? "Точно така!" : "Exactly right!") : (bg ? "Не е тук. Опитай пак." : "Not there. Try again.")}
        </div>
      )}

      {!done && (
        <aside className="xp-panel xp-tray" aria-label={bg ? "Области" : "Regions"}>
          <h2>{bg ? "Области" : "Regions"} <span>{TOTAL - count}</span></h2>
          <div className="xp-chips">
            {order.filter((r) => !placed[r.id]).map((r) => (
              <button
                key={r.id}
                className="xp-chip"
                draggable
                aria-pressed={selected === r.id}
                onDragStart={(e) => { e.dataTransfer.setData("text/plain", r.id); e.dataTransfer.effectAllowed = "move"; select(r.id); }}
                onClick={() => select(selected === r.id ? null : r.id)}
              >
                {name(r.id)}
              </button>
            ))}
          </div>
        </aside>
      )}

      {done && (
        <div className="xp-modal" role="dialog" aria-labelledby="board-done">
          <div className="xp-panel xp-result">
            <span className="xp-eyebrow">{bg ? "Картата е подредена" : "Map complete"}</span>
            <h2 id="board-done">{bg ? "Всичките 28 области са на място" : "All 28 regions are in place"}</h2>
            <div className="xp-row">
              <button className="xp-button" onClick={() => launchGame("dragdrop3d")}>{bg ? "Играй пак" : "Play again"}</button>
              <button className="xp-button xp-button--primary" onClick={returnToTower}>{bg ? "Към станцията" : "Back to the station"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
