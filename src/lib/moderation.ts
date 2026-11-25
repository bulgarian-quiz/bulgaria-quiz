// Names and profile photos are checked by the moderate-profile edge function
// before they are saved; an inappropriate one suspends the account for 24
// hours (the database only accepts these changes from that function).

import { supabase } from '@/integrations/supabase/client';

export type ModerationResult =
  | { status: 'saved' }
  | { status: 'rejected'; bannedUntil: string | null }
  | { status: 'banned'; bannedUntil: string }
  | { status: 'unavailable' }
  | { status: 'error' };

type Body = { ok?: boolean; banned_until?: string; error?: string };

async function call(body: Record<string, unknown>): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke<Body>('moderate-profile', { body });
  let payload: Body | null = data ?? null;
  // Non-2xx answers arrive as an error carrying the response.
  if (error && 'context' in error && error.context instanceof Response) {
    payload = await error.context.json().catch(() => null);
  }
  if (payload?.error === 'banned' && payload.banned_until) return { status: 'banned', bannedUntil: payload.banned_until };
  if (payload?.error === 'unavailable') return { status: 'unavailable' };
  if (payload?.ok === true) return { status: 'saved' };
  if (payload?.ok === false) return { status: 'rejected', bannedUntil: payload.banned_until ?? null };
  return { status: 'error' };
}

/** Before sign-up: whether a name may be used. True when the check cannot be reached (the server checks again). */
export async function isNameAllowed(name: string): Promise<boolean> {
  const result = await call({ action: 'check_name', name });
  return result.status !== 'rejected';
}

export const saveDisplayName = (name: string) => call({ action: 'set_name', name });
export const saveAvatar = (image: string) => call({ action: 'set_avatar', image });
export const removeAvatar = () => call({ action: 'remove_avatar' });

/** Shrinks a chosen photo to a 256 px square JPEG data URL (small to store and to check). */
export function shrinkImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      if (!side) return reject(new Error('empty image'));
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}
