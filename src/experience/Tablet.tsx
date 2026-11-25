import { useCallback, useMemo, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { LegacyRoutes } from "@/App";
import { ArrowLeft, BarChart3, Gamepad2, Map, Settings, User, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import RegionAtlas from "@/components/RegionAtlas";
import { regionsData } from "@/data/questions";
import quizArtwork from "@/assets/game-quiz-belogradchik.jpg";
import boardArtwork from "@/assets/game-cartography-coast.jpg";
import { useExperience, type QualityPreference } from "./store";

type Tab = "games" | "map" | "stats" | "account" | "settings";

/** Segmented control: one row of mutually exclusive choices. */
function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="xp-segmented" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export default function Tablet() {
  const open = useExperience((s) => s.tabletOpen);
  const setTablet = useExperience((s) => s.setTablet);
  const setMode = useExperience((s) => s.setMode);
  const setStage = useExperience((s) => s.setStage);
  const launchGame = useExperience((s) => s.launchGame);
  const quality = useExperience((s) => s.quality);
  const setQuality = useExperience((s) => s.setQuality);
  const { language, setLanguage } = useLanguage();
  const { user, profile, stats, signOut, isRegionCompleted } = useAuth();
  const [tab, setTab] = useState<Tab>("games");
  const [auth, setAuth] = useState(false);
  const [app, setApp] = useState<string | null>(null);
  const closeApp = useCallback(() => setApp(null), []);
  const bg = language === "bg";

  const completed = useMemo(
    () => Object.fromEntries(Object.keys(regionsData).filter((id) => isRegionCompleted(id)).map((id) => [id, true])),
    [isRegionCompleted],
  );
  const completedCount = Object.keys(completed).length;

  const tabs: { id: Tab; icon: typeof Map; label: string }[] = [
    { id: "games", icon: Gamepad2, label: bg ? "Игри" : "Games" },
    { id: "map", icon: Map, label: bg ? "Карта" : "Map" },
    { id: "stats", icon: BarChart3, label: bg ? "Прогрес" : "Progress" },
    { id: "account", icon: User, label: bg ? "Профил" : "Account" },
    { id: "settings", icon: Settings, label: bg ? "Настройки" : "Settings" },
  ];

  const exitToSite = () => {
    setTablet(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("experience");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setMode("legacy");
  };

  return (
    <>
      <div className={`xp-tablet-layer${open ? " is-open" : ""}`} aria-hidden={!open}>
        <div className={`xp-tablet${app ? " is-app" : ""}`} role="dialog" aria-modal="true" aria-label={bg ? "Таблет" : "Tablet"}>
          <div className="xp-tablet__screen dark">
            {app ? (
              <div className="xp-tablet__app">
                <div className="xp-tablet__appbar">
                  <button className="xp-button" onClick={closeApp}><ArrowLeft size={16} /> {bg ? "Таблет" : "Tablet"}</button>
                  <button className="xp-iconbutton" onClick={() => { closeApp(); setTablet(false); }} aria-label={bg ? "Затвори" : "Close"}><X size={18} /></button>
                </div>
                <div className="xp-tablet__appbody">
                  <MemoryRouter initialEntries={[app]}>
                    <LegacyRoutes onHome={closeApp} />
                  </MemoryRouter>
                </div>
              </div>
            ) : (
              <div className="xp-tablet__home">
                <nav className="xp-tablet__nav" aria-label={bg ? "Раздели" : "Sections"}>
                  {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined} title={t.label}>
                      <t.icon size={20} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                  <div className="xp-tablet__spacer" />
                  <button onClick={() => setTablet(false)} title={bg ? "Затвори (T)" : "Close (T)"}>
                    <X size={20} /><span>{bg ? "Затвори" : "Close"}</span>
                  </button>
                </nav>

                <section key={tab} className="xp-tablet__content">
                  <header className="xp-tablet__header">
                    <h2>{tabs.find((t) => t.id === tab)?.label}</h2>
                    <time>{new Date().toLocaleTimeString(bg ? "bg-BG" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
                  </header>

                  {tab === "games" && (
                    <>
                      <div className="xp-gamegrid">
                        <button className="xp-gamecard" onClick={() => launchGame("quiz3d")}>
                          <img src={quizArtwork} alt="" />
                          <span className="xp-gamecard__shade" />
                          <span className="xp-gamecard__copy">
                            <small>{bg ? "Игра 1" : "Game 1"}</small>
                            <strong>{bg ? "Области" : "Provinces"}</strong>
                            <span>{bg ? "Скочи с парашут, карай от област до област и отговори на въпросите." : "Skydive in, drive province to province and answer the questions."}</span>
                          </span>
                          <span className="xp-gamecard__cta">{bg ? "Започни" : "Start"}</span>
                        </button>
                        <button className="xp-gamecard" onClick={() => launchGame("dragdrop3d")}>
                          <img src={boardArtwork} alt="" />
                          <span className="xp-gamecard__shade" />
                          <span className="xp-gamecard__copy">
                            <small>{bg ? "Игра 2" : "Game 2"}</small>
                            <strong>{bg ? "Подреди областите" : "Arrange the regions"}</strong>
                            <span>{bg ? "Постави всичките 28 области на 3D картата." : "Place all 28 regions on the 3D map."}</span>
                          </span>
                          <span className="xp-gamecard__cta">{bg ? "Започни" : "Start"}</span>
                        </button>
                      </div>
                      <div className="xp-approw">
                        <button className="xp-appbutton" onClick={() => setApp("/flashcards")}>{bg ? "Флашкарти" : "Flashcards"}</button>
                        <button className="xp-appbutton" onClick={() => setApp("/about")}>{bg ? "За нас" : "About"}</button>
                        {user && <button className="xp-appbutton" onClick={() => setApp("/profile")}>{bg ? "Профил и класация" : "Profile and leaderboard"}</button>}
                      </div>
                    </>
                  )}

                  {tab === "map" && (
                    <div className="xp-mapview">
                      <p>{user
                        ? (bg ? `Завършени области: ${completedCount} от 28` : `Provinces completed: ${completedCount} of 28`)
                        : (bg ? "Влез в профила си, за да пазиш завършените области." : "Log in to keep track of the provinces you complete.")}</p>
                      <RegionAtlas variant="quiz" completed={completed} />
                    </div>
                  )}

                  {tab === "stats" && (
                    user && stats ? (
                      <div className="xp-stats">
                        {([
                          [bg ? "Точки" : "Points", stats.total_points],
                          [bg ? "Серия (дни)" : "Streak (days)", stats.current_streak],
                          [bg ? "Изиграни игри" : "Games played", stats.games_played],
                          [bg ? "Точки от куиза" : "Quiz points", stats.quiz_points],
                          [bg ? "Точки от подреждане" : "Arranging points", stats.dragdrop_points],
                          [bg ? "Завършени области" : "Provinces completed", stats.completed_regions?.length ?? 0],
                        ] as [string, number][]).map(([k, v]) => (
                          <div key={k} className="xp-stat"><small>{k}</small><strong>{v}</strong></div>
                        ))}
                      </div>
                    ) : (
                      <div className="xp-empty">
                        <p>{bg ? "Влез в профила си, за да виждаш точките, серията и завършените области." : "Log in to see your points, streak and completed provinces."}</p>
                        <button className="xp-button xp-button--primary" onClick={() => setAuth(true)}>{bg ? "Вход" : "Log in"}</button>
                      </div>
                    )
                  )}

                  {tab === "account" && (
                    user ? (
                      <div className="xp-account">
                        <div className="xp-account__avatar">
                          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.display_name || "U")[0]}
                        </div>
                        <div>
                          <strong>{profile?.display_name}</strong>
                          <small>{user.email}</small>
                        </div>
                        <div className="xp-row">
                          <button className="xp-button xp-button--primary" onClick={() => setApp("/profile")}>{bg ? "Профил и класация" : "Profile and leaderboard"}</button>
                          <button className="xp-button" onClick={() => signOut()}>{bg ? "Изход от профила" : "Log out"}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="xp-empty">
                        <p>{bg ? "С профил пазиш точките и прогреса си между игрите." : "With an account your points and progress are kept between games."}</p>
                        <button className="xp-button xp-button--primary" onClick={() => setAuth(true)}>{bg ? "Вход или регистрация" : "Log in or sign up"}</button>
                      </div>
                    )
                  )}

                  {tab === "settings" && (
                    <div className="xp-settings">
                      <label>{bg ? "Език" : "Language"}</label>
                      <Segmented label={bg ? "Език" : "Language"} value={language} options={[["bg", "Български"], ["en", "English"]]} onChange={(v) => setLanguage(v)} />
                      <label>{bg ? "Графика" : "Graphics"}</label>
                      <Segmented<QualityPreference> label={bg ? "Графика" : "Graphics"} value={quality}
                        options={[["auto", bg ? "Автоматично" : "Automatic"], ["high", bg ? "Висока" : "High"], ["low", bg ? "Ниска" : "Low"]]}
                        onChange={setQuality} />
                      <p className="xp-note">{bg ? "Автоматично намалява ефектите, ако компютърът не смогва." : "Automatic lowers the effects when the computer can't keep up."}</p>
                      <div className="xp-row">
                        <button className="xp-button" onClick={() => { setTablet(false); setStage("pc"); }}>{bg ? "Обратно към терминала" : "Back to the terminal"}</button>
                        <button className="xp-button xp-button--primary" onClick={exitToSite}>{bg ? "Към сайта" : "Back to the site"}</button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={auth} onClose={() => setAuth(false)} />
    </>
  );
}
