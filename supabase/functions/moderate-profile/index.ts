// Checks a player's name or profile photo before it is saved, and suspends the
// account for 24 hours when it is inappropriate (sexual, hateful, violent,
// insulting or vulgar). The browser cannot change either itself: the profiles
// table only accepts these changes from this function (service role).
//
// Actions (POST JSON):
//   { action: "check_name", name }        -> { ok }            (sign-up, no account yet; never suspends)
//   { action: "set_name", name }          -> { ok, banned_until? }
//   { action: "set_avatar", image }       -> { ok, banned_until? }  image = data:image/...;base64,...
//   { action: "remove_avatar" }           -> { ok }
// A suspended account gets 403 { error: "banned", banned_until }.
//
// Names: a word list here first, then the chat's free text model (or Gemini).
// Photos need a model that can see images, which only Gemini (GEMINI_API_KEY)
// offers; without it, or when it does not answer, a new photo is refused for
// now (503) rather than saved unchecked.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkImage, checkName } from "../_shared/moderationAi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const memoryLimits = new Map<string, { count: number; resetAt: number }>();
function memoryLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = memoryLimits.get(key);
  if (!entry || now > entry.resetAt) {
    memoryLimits.set(key, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
async function withinLimit(key: string, limit: number): Promise<boolean> {
  const { data, error } = await admin.rpc("chat_rate_limit", { p_key: key, p_limit: limit });
  if (!error && typeof data === "boolean") return data;
  return memoryLimit(key, limit);
}
function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** True when the name is inappropriate (the word list, then a model; the list alone if no model answers). */
const nameIsInappropriate = async (name: string) => (await checkName(name)).flagged === true;

/** True/false from Gemini's vision; null when it is not configured or did not answer. */
const imageIsInappropriate = async (dataUrl: string) => (await checkImage(dataUrl)).flagged;

const cleanName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const name = Array.from(value, (ch) => (ch.charCodeAt(0) < 32 ? " " : ch)).join("").replace(/\s+/g, " ").trim();
  return name.length >= 1 && name.length <= 50 ? name : null;
};

const IMAGE_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_IMAGE_LENGTH = 400_000; // about 300 KB of image; the app sends a 256 px JPEG

async function suspend(userId: string, reason: "name" | "photo"): Promise<string> {
  const { data, error } = await admin.rpc("ban_user_24h", { _user_id: userId, _reason: reason });
  if (error) console.error("ban failed", error);
  return typeof data === "string" ? data : new Date(Date.now() + 24 * 3600 * 1000).toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action === "check_name") {
      const name = cleanName(body?.name);
      if (!name) return json({ error: "Invalid name" }, 400);
      if (!(await withinLimit(`moderate:anon:${clientIp(req)}`, 30))) return json({ error: "Too many checks" }, 429);
      return json({ ok: !(await nameIsInappropriate(name)) });
    }

    // Every other action is for a signed-in player's own profile.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in" }, 401);
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return json({ error: "Not signed in" }, 401);

    const { data: ban } = await admin
      .from("user_bans").select("banned_until").eq("user_id", user.id).gt("banned_until", new Date().toISOString())
      .maybeSingle();
    if (ban) return json({ error: "banned", banned_until: ban.banned_until }, 403);

    if (!(await withinLimit(`moderate:user:${user.id}`, 20))) return json({ error: "Too many changes" }, 429);

    if (action === "set_name") {
      const name = cleanName(body?.name);
      if (!name) return json({ error: "Invalid name" }, 400);
      if (await nameIsInappropriate(name)) {
        return json({ ok: false, banned_until: await suspend(user.id, "name") });
      }
      const { error } = await admin.from("profiles").update({ display_name: name }).eq("user_id", user.id);
      if (error) throw error;
      await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, display_name: name } });
      return json({ ok: true });
    }

    if (action === "set_avatar") {
      const image = typeof body?.image === "string" ? body.image : "";
      if (image.length > MAX_IMAGE_LENGTH || !IMAGE_PATTERN.test(image)) return json({ error: "Invalid image" }, 400);
      const bad = await imageIsInappropriate(image);
      if (bad === null) return json({ error: "unavailable" }, 503);
      if (bad) return json({ ok: false, banned_until: await suspend(user.id, "photo") });
      const { error } = await admin.from("profiles").update({ avatar_url: image }).eq("user_id", user.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "remove_avatar") {
      const { error } = await admin.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("moderate-profile error", error);
    return json({ error: "Could not check" }, 500);
  }
});
