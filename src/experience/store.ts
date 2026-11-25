import { create } from "zustand";
import { isDesktopPresentation } from "@/experience/deviceMode";
import { requestHub } from "@/lib/journey";

export type Stage = "boot" | "pc" | "divein" | "tower";
export type Mode = "undecided" | "legacy" | "game";
export type MissionPhase = "freefall" | "parachute" | "roadside" | "driving" | "pullOver" | "quiz";
/** Picture quality. "auto" follows the measured frame rate (see QualityGovernor). */
export type QualityPreference = "auto" | "high" | "low";
/** 0 = low (no post, no shadows, 1x pixels), 1 = medium, 2 = high. */
export type QualityTier = 0 | 1 | 2;
/** Pixel ratio range per quality tier. */
export const TIER_DPR: Record<QualityTier, [number, number]> = { 0: [0.75, 1], 1: [1, 1.5], 2: [1, 2] };
export type BoardFeedback = { id: string; ok: boolean; at: number } | null;

const MODE_KEY = "bg-experience-mode";

const initialMode = (): Mode => {
  if (typeof window === "undefined") return "undecided";
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("experience");
  if (forced === "game") return "game";
  return "legacy";
};

interface ExperienceState {
  mode: Mode;
  stage: Stage;
  tabletOpen: boolean;
  activeGame: "none" | "quiz3d" | "dragdrop3d";
  missionPhase: MissionPhase;
  regionIndex: number;
  currentRegionId: string;
  driveSeconds: number;
  quality: QualityPreference;
  tier: QualityTier;
  /** Game 2: the region picked from the tray, the ones already placed, and the last placement result. */
  boardSelected: string | null;
  boardPlaced: Record<string, true>;
  boardFeedback: BoardFeedback;
  /** Station: the player is standing at the map table (shows the E prompt). */
  nearTable: boolean;
  setNearTable: (near: boolean) => void;
  setQuality: (q: QualityPreference) => void;
  setTier: (t: QualityTier) => void;
  selectBoardRegion: (id: string | null) => void;
  /** Try to place `source` (default: the selected region) on province `target`. Returns true when correct. */
  placeBoardRegion: (target: string, source?: string | null) => boolean;
  setMode: (m: Mode, remember?: boolean) => void;
  setStage: (s: Stage) => void;
  setTablet: (open: boolean) => void;
  launchGame: (game: "quiz3d" | "dragdrop3d") => void;
  setMissionPhase: (phase: MissionPhase) => void;
  setDriveSeconds: (seconds: number) => void;
  finishRegion: () => void;
  returnToTower: () => void;
}

const startMode = initialMode();
export const useExperience = create<ExperienceState>((set) => ({
  mode: startMode,
  stage: startMode === "game" ? "pc" : "boot",
  tabletOpen: false,
  activeGame: "none",
  missionPhase: "freefall",
  regionIndex: 0,
  currentRegionId: "sofiaCity",
  driveSeconds: 0,
  quality: "auto",
  tier: 2,
  boardSelected: null,
  boardPlaced: {},
  boardFeedback: null,
  nearTable: false,
  setNearTable: (nearTable) => set({ nearTable }),
  setQuality: (quality) => set(quality === "auto" ? { quality } : { quality, tier: quality === "high" ? 2 : 0 }),
  setTier: (tier) => set((s) => (s.quality === "auto" ? { tier } : {})),
  selectBoardRegion: (boardSelected) => set({ boardSelected }),
  placeBoardRegion: (target, source) => {
    const state = useExperience.getState();
    const id = source ?? state.boardSelected;
    if (!id || state.boardPlaced[target]) return false;
    const ok = id === target;
    set({
      boardFeedback: { id: target, ok, at: performance.now() },
      boardSelected: ok ? null : state.boardSelected,
      boardPlaced: ok ? { ...state.boardPlaced, [target]: true } : state.boardPlaced,
    });
    return ok;
  },
  setMode: (mode, remember = true) => {
    // Coming back from the 3D experience lands on "Продължи пътешествието", not the film's start.
    if (mode === "legacy" && useExperience.getState().mode === "game" && typeof window !== "undefined") {
      // Only when the site underneath is the homepage (hash URLs carry the route after "#").
      const route = import.meta.env.VITE_ROUTER === "hash" ? (window.location.hash.slice(1).split("?")[0] || "/") : window.location.pathname;
      if (route === "/") requestHub();
    }
    if (remember) {
      try {
        if (mode === "legacy") localStorage.setItem(MODE_KEY, "legacy");
        else localStorage.removeItem(MODE_KEY);
      } catch { /* storage blocked: the choice lasts for this visit */ }
    }
    set({
      mode,
      stage: mode === "game" ? "pc" : "boot",
      tabletOpen: false,
      activeGame: "none",
      missionPhase: "freefall",
      regionIndex: 0,
      currentRegionId: "sofiaCity",
      driveSeconds: 0,
    });
  },
  setStage: (stage) => set({ stage }),
  setTablet: (tabletOpen) => set({ tabletOpen }),
  launchGame: (activeGame) => set({ activeGame, tabletOpen: false, missionPhase: "freefall", regionIndex: 0, currentRegionId: "sofiaCity", driveSeconds: 0, boardSelected: null, boardPlaced: {}, boardFeedback: null }),
  setMissionPhase: (missionPhase) => set({ missionPhase }),
  setDriveSeconds: (driveSeconds) => set({ driveSeconds }),
  finishRegion: () => set((state) => {
    const next = (state.regionIndex + 1) % 28;
    const ids = ["sofiaCity", "pernik", "kyustendil", "blagoevgrad", "pazardzhik", "plovdiv", "smolyan", "kardzhali", "haskovo", "staraZagora", "yambol", "burgas", "sliven", "varna", "dobrich", "silistra", "shumen", "razgrad", "targovishte", "ruse", "velikoTarnovo", "gabrovo", "lovech", "pleven", "vratsa", "montana", "vidin", "sofiaProvince"];
    return { missionPhase: "driving", regionIndex: next, currentRegionId: ids[next], driveSeconds: 0, tabletOpen: false };
  }),
  returnToTower: () => set({ activeGame: "none", missionPhase: "freefall", tabletOpen: false, driveSeconds: 0 }),
}));

/** Desktop presentation = desktop browser mode, wide viewport, WebGL available. */
export const isDesktop3DCapable = () => {
  if (typeof window === "undefined") return false;
  if (!isDesktopPresentation() || window.innerWidth < 980) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

/** Sub-solar point for the current UTC time (degrees). */
export const subSolarPoint = (date = new Date()) => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date.getTime() - start) / 86400000;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10));
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const lon = (12 - hours) * 15;
  return { lat: decl, lon };
};

// Development only: lets automated browser checks drive the experience. Stripped from production builds.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __xpStore?: typeof useExperience }).__xpStore = useExperience;
}
