// Clearly offensive words for player names, in Bulgarian and English. A name
// is blocked when one of its words starts with a root below, or when, with
// spaces and dots taken out ("f.u.c.k"), it contains one of the unmistakable
// roots. Spellings with digits ("sh1t"), repeated letters ("fuuuck") and Latin
// look-alike letters inside Cyrillic words ("xуй") are caught too. The AI
// check catches what this list misses; the database keeps a shorter copy for
// names given at sign-up (supabase/migrations/20261124120000_profile_moderation.sql).

const WORD_START = [
  'fuck', 'fuk', 'shit', 'bitch', 'cunt', 'nigg', 'fagg', 'whore', 'slut', 'porn', 'hitler', 'nazis',
  'penis', 'vagina', 'asshole', 'pussy', 'putk', 'kurv', 'pederas', 'shiban', 'kopele', 'duhach', 'huy', 'eba',
  'хуй', 'хуя', 'путк', 'путьо', 'педерас', 'педал', 'курв', 'шибан', 'еба', 'ебеш', 'ебем', 'ебя', 'копеле', 'духач',
];

// Short words that are part of ordinary names ("Dickens", "Cockburn"), blocked only on their own.
const WHOLE_WORD = ['dick', 'dicks', 'cock', 'cocks', 'rape', 'nazi', 'sex', 'sexy', 'гъз', 'секс'];

const ANYWHERE = [
  'fuck', 'nigger', 'nigga', 'faggot', 'whore', 'asshole', 'pussy', 'porn', 'hitler',
  'хуй', 'путка', 'педераст', 'курва', 'шибан', 'копеле',
];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };
// Latin letters that look like Cyrillic ones, used inside a Cyrillic word.
const LOOKALIKE: Record<string, string> = {
  a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', h: 'н', b: 'в', i: 'и', u: 'и',
};

const collapse = (word: string) => word.replace(/(.)\1+/g, '$1');

function variants(word: string): string[] {
  const out = new Set([word, collapse(word)]);
  if (/[а-я]/.test(word) && /[a-z]/.test(word)) {
    const cyr = Array.from(word, (ch) => LOOKALIKE[ch] ?? ch).join('');
    out.add(cyr);
    out.add(collapse(cyr));
  }
  return [...out];
}

export function nameHasBlockedWord(name: string): boolean {
  const lower = Array.from(name.toLowerCase().normalize('NFKC'), (ch) => LEET[ch] ?? ch).join('');
  const words = lower.split(/[^a-zа-яё]+/).filter(Boolean);
  if (words.some((w) => variants(w).some((v) => WHOLE_WORD.includes(v) || WORD_START.some((root) => v.startsWith(root))))) return true;
  const joined = words.join('');
  return variants(joined).some((v) => ANYWHERE.some((root) => v.includes(root)));
}
