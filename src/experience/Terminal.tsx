import { useEffect, useRef, useState } from "react";

const LOGO = [
  "  ████████████████  ",
  "  ████████████████  ",
  "  ░░░░░░░░░░░░░░░░  ",
  "  ░░░░░░░░░░░░░░░░  ",
  "  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ",
  "  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ",
];
const LOGO_COLORS = ["#f2f2f2", "#f2f2f2", "#00966E", "#00966E", "#D62612", "#D62612"];

type Line = { text: string; color?: string; logo?: number };

export default function Terminal({ onDivein, active, language }: { onDivein: () => void; active: boolean; language: "bg" | "en" }) {
  const [lines, setLines] = useState<Line[]>([
    { text: "BG-OS 6.8.2-balkan (tty1)" },
    { text: "Last login: " + new Date().toUTCString() + " from orbital-7" },
    { text: "" },
    { text: language === "bg" ? "Мисията те чака. Напиши divein и натисни Enter. help показва всички команди." : "The mission is waiting. Type divein and press Enter. help lists every command.", color: "#ffd479" },
    { text: "" },
  ]);
  const [input, setInputState] = useState("");
  const inputRef = useRef("");
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const opsecInstalled = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 1e6);
  }, [lines, input]);

  useEffect(() => {
    if (!active) return;
    const run = (cmd: string) => {
      const c = cmd.trim();
      const out: Line[] = [{ text: `operator@bulgaria:~$ ${cmd}`, color: "#8fd18f" }];
      if (c === "") {
        // nothing
      } else if (c === "fastfetch") {
        const info = [
          ["", "operator@bulgaria"],
          ["", "-----------------"],
          ["OS", "BG-OS 6.8 Balkan x86_64"],
          ["Host", "Orbital Station Rila-7"],
          ["Kernel", "6.8.2-balkan"],
          ["Uptime", `${Math.floor(performance.now() / 60000)} mins`],
          ["Shell", "bash 5.2.26"],
          ["Locale", language === "bg" ? "bg_BG.UTF-8" : "en_US.UTF-8"],
          ["Region", "28 provinces, 110 994 km²"],
          ["CPU", "Musala M8 (16) @ 2.925 GHz"],
          ["GPU", "Pirin RTX 7000"],
          ["Memory", "7 241MiB / 32 768MiB"],
          ["Capital", "Sofia 42.69°N 23.32°E"],
        ];
        for (let i = 0; i < Math.max(LOGO.length, info.length); i++) {
          const [k, v] = info[i] ?? ["", ""];
          out.push({ text: `${k ? k + ": " : ""}${v}`, logo: i < LOGO.length ? i : -1 });
        }
      } else if (c === "divein") {
        out.push({ text: language === "bg" ? "Стартиране на мисията..." : "Launching mission...", color: "#ffd479" });
        setTimeout(onDivein, 700);
      } else if (/^(sudo )?apt(-get)? install opsec$/.test(c.replace(/\s+/g, " "))) {
        setLines((l) => [...l, ...out]);
        if (!c.startsWith("sudo")) {
          setLines((l) => [...l,
            { text: "E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)", color: "#ff7b7b" },
            { text: "E: Unable to acquire the dpkg frontend lock, are you root?", color: "#ff7b7b" }]);
          return;
        }
        const steps: [number, Line][] = opsecInstalled.current ? [
          [250, { text: "[sudo] password for operator: " }],
          [500, { text: "Reading package lists... Done" }],
          [300, { text: "Building dependency tree... Done" }],
          [200, { text: "Reading state information... Done" }],
          [200, { text: "opsec is already the newest version (1.0.4)." }],
          [150, { text: "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded." }],
        ] : [
          [250, { text: "[sudo] password for operator: " }],
          [600, { text: "Reading package lists... Done" }],
          [400, { text: "Building dependency tree... Done" }],
          [250, { text: "Reading state information... Done" }],
          [200, { text: "The following NEW packages will be installed:" }],
          [80, { text: "  opsec" }],
          [150, { text: "0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded." }],
          [100, { text: "Need to get 1,420 kB of archives." }],
          [100, { text: "After this operation, 4,892 kB of additional disk space will be used." }],
          [500, { text: "Get:1 https://repo.rila7.bg/balkan balkan/main amd64 opsec amd64 1.0.4 [1,420 kB]" }],
          [700, { text: "Fetched 1,420 kB in 1s (1,812 kB/s)" }],
          [250, { text: "Selecting previously unselected package opsec." }],
          [300, { text: "(Reading database ... 142080 files and directories currently installed.)" }],
          [250, { text: "Preparing to unpack .../opsec_1.0.4_amd64.deb ..." }],
          [450, { text: "Unpacking opsec (1.0.4) ..." }],
          [500, { text: "Setting up opsec (1.0.4) ..." }],
          [400, { text: "Processing triggers for man-db (2.12.0) ..." }],
        ];
        busy.current = true;
        let t = 0;
        steps.forEach(([d, line], i) => {
          t += d;
          setTimeout(() => {
            setLines((l) => [...l, line]);
            if (i === steps.length - 1) { busy.current = false; opsecInstalled.current = true; }
          }, t);
        });
        return;
      } else if (c === "opsec" || c === "opsec --status") {
        if (!opsecInstalled.current) {
          out.push({ text: "Command 'opsec' not found, but can be installed with:", color: "#ff7b7b" });
          out.push({ text: "sudo apt install opsec" });
        } else {
          out.push({ text: "opsec 1.0.4 — operational security status", color: "#ffd479" });
          out.push({ text: "  Satellite uplink ......... ENCRYPTED (AES-256)", color: "#8fd18f" });
          out.push({ text: "  Firewall ................. ACTIVE (28/28 provinces)", color: "#8fd18f" });
          out.push({ text: "  Orbital telemetry ........ CLEARED", color: "#8fd18f" });
          out.push({ text: "  Clearance level .......... OPERATOR" });
        }
      } else if (c === "help") {
        out.push({ text: opsecInstalled.current ? "fastfetch   divein   opsec" : "fastfetch   divein   sudo apt install opsec" });
      } else if (c === "clear") {
        setLines([]);
        return;
      } else {
        out.push({ text: language === "bg" ? "Грешна команда." : "Wrong command.", color: "#ff7b7b" });
      }
      setLines((l) => [...l, ...out]);
    };
    const onKey = (e: KeyboardEvent) => {
      const input = inputRef.current;
      const setInput = (v: string | ((s: string) => string)) => {
        inputRef.current = typeof v === "function" ? v(inputRef.current) : v;
        setInputState(inputRef.current);
      };
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (busy.current) { e.preventDefault(); return; }
      if (e.key === "Enter") {
        if (input.trim()) history.current.unshift(input);
        hIdx.current = -1;
        run(input);
        setInput("");
      } else if (e.key === "Backspace") setInput((s) => s.slice(0, -1));
      else if (e.key === "ArrowUp") {
        hIdx.current = Math.min(hIdx.current + 1, history.current.length - 1);
        setInput(history.current[hIdx.current] ?? "");
      } else if (e.key === "ArrowDown") {
        hIdx.current = Math.max(hIdx.current - 1, -1);
        setInput(hIdx.current < 0 ? "" : history.current[hIdx.current]);
      } else if (e.key.length === 1) setInput((s) => (s + e.key).slice(0, 60));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, language, onDivein]);

  return (
    <div
      ref={scrollRef}
      className="w-full h-full overflow-hidden font-mono text-[19px] leading-[1.45] px-7 py-6"
      style={{
        background: "radial-gradient(120% 90% at 50% 40%, #0f1512 0%, #070908 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px)",
        backgroundBlendMode: "screen",
        color: "#dfe6e1",
        textShadow: "0 0 6px rgba(160,255,200,.35)",
      }}
    >
      {lines.map((l, i) => (
        <div key={i} className={l.logo !== undefined ? "whitespace-pre" : "whitespace-pre-wrap"} style={{ color: l.color }}>
          {l.logo !== undefined && (
            <span style={{ color: l.logo >= 0 ? LOGO_COLORS[l.logo] : undefined }}>
              {l.logo >= 0 ? LOGO[l.logo] : " ".repeat(LOGO[0].length)}
            </span>
          )}
          {l.logo !== undefined ? "  " : ""}
          {l.text}
        </div>
      ))}
      <div className="whitespace-pre">
        <span style={{ color: "#8fd18f" }}>operator@bulgaria</span>:<span style={{ color: "#7fb4ff" }}>~</span>$ {input}
        <span className="animate-pulse">█</span>
      </div>
    </div>
  );
}
