// Checks a typed answer in the photo game.
//
// Most answers are settled here, on the device, without any network call: the
// check forgives capital letters, punctuation and quotes, the Bulgarian
// definite article (-ът, -ят, -та, -то, -те …), word order, a typo or two in
// longer words, and answers typed in Latin letters ("Rilski manastir"). Only
// an answer this check cannot confirm goes to the AI (the check-answer edge
// function), which accepts other wordings of the same place.

import { supabase } from '@/integrations/supabase/client';

export type Lang = 'bg' | 'en';

// Latin → Cyrillic, longest sequences first (Bulgarian streamlined system, plus common variants).
const TRANSLIT: [string, string][] = [
  ['sht', 'щ'], ['sh', 'ш'], ['ch', 'ч'], ['zh', 'ж'], ['ts', 'ц'], ['yu', 'ю'], ['ya', 'я'], ['ja', 'я'], ['ju', 'ю'],
  ['a', 'а'], ['b', 'б'], ['v', 'в'], ['w', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['z', 'з'], ['i', 'и'], ['y', 'й'],
  ['j', 'й'], ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'],
  ['u', 'у'], ['f', 'ф'], ['h', 'х'], ['c', 'ц'], ['q', 'к'], ['x', 'кс'],
];

function toCyrillic(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const pair = TRANSLIT.find(([latin]) => text.startsWith(latin, i));
    if (pair) {
      out += pair[1];
      i += pair[0].length;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

const STOPWORDS: Record<Lang, Set<string>> = {
  bg: new Set(['на', 'в', 'във', 'и', 'до', 'от', 'с', 'със', 'край', 'при', 'гр', 'град', 'село', 'с.', 'това', 'е', 'този', 'тази']),
  en: new Set(['the', 'of', 'in', 'a', 'an', 'and', 'at', 'near', 'this', 'is', 'it']),
};

// Generic words a player may leave out ("Рилски" for "Рилски манастир") as long
// as the distinctive part of the name is there.
const GENERIC: Record<Lang, Set<string>> = {
  bg: new Set(['манастир', 'паметник', 'църкв', 'храм', 'катедрал', 'крепост', 'пещер', 'връх', 'мост', 'гробниц', 'скал', 'езер', 'дворец', 'резерват', 'свети', 'св']),
  en: new Set(['monastery', 'monument', 'church', 'cathedral', 'fortress', 'cave', 'peak', 'mount', 'bridge', 'tomb', 'rocks', 'rock', 'lakes', 'lake', 'palace', 'saint', 'st']),
};

// Bulgarian endings, longest first; stripped the same way from both sides so
// "Мадарският", "Мадарския" and "Мадарски" all reduce to "мадарск".
const BG_ENDINGS = ['ият', 'ия', 'ът', 'ят', 'та', 'то', 'те', 'та', 'а', 'я', 'и', 'о', 'е', 'ъ'];

function stemBg(word: string): string {
  for (const ending of BG_ENDINGS) {
    if (word.length - ending.length >= 3 && word.endsWith(ending)) return word.slice(0, -ending.length);
  }
  return word;
}

function stemEn(word: string): string {
  if (word.length > 4 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** The words of an answer, lower-case, without punctuation, articles or filler words. */
export function answerTokens(text: string, lang: Lang): string[] {
  // Accents and marks are dropped on both sides alike (й reads as и, ё as е),
  // so answers typed with or without them compare equal.
  const fold = (value: string) => value.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  let s = fold(text.toLowerCase());
  s = s.replace(/св\./g, 'свети ').replace(/\bst\./g, 'saint ');
  s = s.replace(/[„“”"«»'’`.,!?;:()[\]{}/\\–—_-]+/g, ' ');
  if (lang === 'bg' && /[a-z]/.test(s)) s = fold(toCyrillic(s));
  const words = s.split(/\s+/).filter(Boolean);
  return words
    .filter((w) => !STOPWORDS[lang].has(w))
    .map((w) => (lang === 'bg' ? stemBg(w) : stemEn(w)));
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // Two neighbouring letters swapped ("Мадраски") count as one typo.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  }
  return dp[a.length][b.length];
}

/** Words count as the same with one typo from 5 letters, two from 9. */
function similarWords(a: string, b: string): boolean {
  if (a === b) return true;
  const longest = Math.max(a.length, b.length);
  const allowed = longest >= 9 ? 2 : longest >= 5 ? 1 : 0;
  return allowed > 0 && editDistance(a, b) <= allowed;
}

function isGeneric(word: string, lang: Lang): boolean {
  for (const g of GENERIC[lang]) if (word.startsWith(g)) return true;
  return false;
}

function matchesVariant(user: string[], expected: string[], lang: Lang): boolean {
  if (user.length === 0 || expected.length === 0) return false;
  const distinctive = expected.filter((w) => !isGeneric(w, lang));
  const required = distinctive.length > 0 ? distinctive : expected;
  const allRequiredFound = required.every((e) => user.some((u) => similarWords(u, e)));
  if (!allRequiredFound) return false;
  // Every word the player typed must belong to the answer, so "Рилски манастир
  // или Бачковски" is not accepted for "Рилски манастир".
  return user.every((u) => expected.some((e) => similarWords(u, e)));
}

/** Every accepted way of writing a question's answer, in the player's language. */
export function acceptedAnswers(answer: string, accepts: string[]): string[] {
  return [answer, ...accepts];
}

/** True when the typed answer clearly names the expected answer. */
export function matchesLocally(typed: string, accepted: string[], lang: Lang): boolean {
  const user = answerTokens(typed, lang);
  return accepted.some((variant) => matchesVariant(user, answerTokens(variant, lang), lang));
}

export type AnswerVerdict = { correct: boolean; checkedBy: 'device' | 'ai' | 'none' };

/**
 * Checks a typed answer: on the device first, then, if that is not enough, with
 * the AI. If the AI cannot be reached the device's verdict stands.
 */
export async function checkTypedAnswer(params: {
  typed: string;
  question: string;
  accepted: string[];
  lang: Lang;
}): Promise<AnswerVerdict> {
  const typed = params.typed.trim();
  if (!typed) return { correct: false, checkedBy: 'none' };
  if (matchesLocally(typed, params.accepted, params.lang)) return { correct: true, checkedBy: 'device' };
  if (typed.length > 80) return { correct: false, checkedBy: 'device' };

  try {
    const request = supabase.functions.invoke('check-answer', {
      body: { question: params.question, accepted: params.accepted.slice(0, 8), answer: typed, language: params.lang },
    });
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    const result = await Promise.race([request, timeout]);
    if (result && !result.error && result.data && typeof result.data.correct === 'boolean') {
      return { correct: result.data.correct, checkedBy: 'ai' };
    }
  } catch {
    // The device's verdict stands.
  }
  return { correct: false, checkedBy: 'device' };
}
