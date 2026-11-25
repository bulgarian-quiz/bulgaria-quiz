import { useEffect, useState } from "react";

const detect = () => {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || ua || (narrow && "ontouchstart" in window);
};

/** True on phones/tablets — enables tap-based controls automatically. */
export function useTouchMode() {
  const [touch, setTouch] = useState(detect);
  useEffect(() => {
    const update = () => setTouch(detect());
    const mql = window.matchMedia("(pointer: coarse)");
    mql.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mql.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("touch-mode", touch);
  }, [touch]);
  return touch;
}
