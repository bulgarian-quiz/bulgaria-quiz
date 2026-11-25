import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calendar-day key (YYYY-MM-DD) in the user's local time zone.
 * `toISOString()` is UTC, which rolls the day over at 02:00/03:00 in Bulgaria,
 * so streaks must never be keyed on it.
 */
export function localDateKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** URL of a file in /public that works at any deploy base ("/" or "./"). */
export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
