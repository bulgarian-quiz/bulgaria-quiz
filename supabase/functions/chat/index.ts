import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting, used only if the database limit below cannot be reached.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 30, windowMs = 3600000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// The limit is kept in the database (see the chat_rate_limit migration) so it
// holds across every instance and restart of this function.
const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

async function withinLimit(key: string, limit: number): Promise<boolean> {
  const { data, error } = await admin.rpc("chat_rate_limit", { p_key: key, p_limit: limit });
  if (!error && typeof data === "boolean") return data;
  console.warn("Database rate limit unavailable, using the in-memory limit:", error?.message);
  return checkRateLimit(key, limit);
}

// Visitors who are not logged in can chat too, but every message uses the
// site's Google AI quota, so they get tighter limits: per IP address, plus a
// shared ceiling for all anonymous traffic on this instance.
/** Every visitor, logged in or not, can send this many messages per hour. */
const MESSAGES_PER_HOUR = 10;
const ANON_LIMIT_TOTAL_PER_HOUR = 300;
const ANON_MAX_MESSAGES = 12;
const ANON_MAX_CHARS = 2000;

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// The AI runs on Google's Gemini API with the site owner's own key. The key is
// a server-side secret (GEMINI_API_KEY) and never reaches the browser: the site
// only talks to this function. Google's OpenAI-compatible endpoint streams the
// same "data: {choices:[{delta}]}" format the chat window already reads.
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
// Tried in order: when one is overloaded or retired, the next one answers.
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-flash-lite-latest"];
const RETRY_STATUSES = new Set([404, 429, 500, 503]);

type ChatMessage = { role: string; content: string };

async function callModel(conversation: ChatMessage[]): Promise<Response | null> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    let last: Response | null = null;
    for (const model of GEMINI_MODELS) {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${geminiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: conversation, stream: true }),
      });
      if (response.ok) return response;
      console.warn(`Gemini model ${model} unavailable (${response.status}), trying the next one`);
      await response.body?.cancel();
      last = response;
    }
  }

  // Free, keyless provider first: no bill for the site owner or visitors.
  try {
    const free = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai-fast",
        messages: [...conversation, { role: "system", content: "Answer briefly, in at most 4 short sentences." }],
        reasoning_effort: "low",
        max_tokens: 400,
        stream: true,
      }),
    });
    if (free.ok) return free;
    console.warn(`Free model unavailable (${free.status})`);
    await free.body?.cancel();
  } catch (e) {
    console.warn("Free model request failed", e);
  }

  return null;
}

function jsonResponse(body: Record<string, string>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Website information lives here on the server so callers cannot rewrite the system prompt.
const getWebsiteContext = (language: "bg" | "en") => {
  if (language === 'bg') {
    return `
Този уебсайт е "Опознай България" - образователна платформа за изучаване на България.

Страници на сайта:
1. НАЧАЛО (/) - Главната страница с приветствие и най-търсени теми за България.
2. ИГРИ (/games) - Три игри:
   - Куиз за България - интерактивен куиз свързан с всяка област в България
   - Подреди областите - игра с влачене на областите на правилното място на картата
   - Познай мястото (/photo-quiz) - 27 снимки на забележителности, личности и традиции; лесен режим с 4 отговора или напреднал, в който отговорът се пише
3. ФЛАШКАРТИ (/flashcards) - Три категории флашкарти:
   - История - факти за българската история
   - География - факти за българската география
   - Общи интересни факти - разнообразни факти за България
4. ЗА НАС (/about) - Информация за създателите:
   - Създатели: Мирослав Мутафчиев и Теодор Петров
   - Ученици от 5А клас, ПМГ "Христо Смирненски" гр. Перник
   - Имейли: m.mutafchiev2025@pmg-pernik.com и t.petrov2025@pmg-pernik.com

Функции:
- Двуезичен сайт (български и английски)
- Тъмен и светъл режим
- Система за точки и класация за регистрирани потребители
`;
  }
  
  return `
This website is "Discover Bulgaria" - an educational platform for learning about Bulgaria.

Website pages:
1. HOME (/) - Main page with welcome message and most searched topics about Bulgaria.
2. GAMES (/games) - Three games:
   - Bulgaria Quiz - interactive quiz about every region in Bulgaria
   - Arrange the Regions - drag and drop game to place regions correctly on the map
   - Guess the Place (/photo-quiz) - 27 photos of landmarks, famous people and traditions; easy mode with 4 answers or advanced mode where you type the answer
3. FLASHCARDS (/flashcards) - Three flashcard categories:
   - History - facts about Bulgarian history
   - Geography - facts about Bulgarian geography
   - General Interesting Facts - various facts about Bulgaria
4. ABOUT (/about) - Information about the creators:
   - Creators: Miroslav Mutafchiev and Teodor Petrov
   - 5th grade students (5A class) from PMG "Hristo Smirnenski" in Pernik
   - Emails: m.mutafchiev2025@pmg-pernik.com and t.petrov2025@pmg-pernik.com

Features:
- Bilingual website (Bulgarian and English)
- Dark and light mode
- Points system and leaderboard for registered users
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // A signed-in user is identified by their token; anyone else (no token,
    // or an expired one) chats anonymously under the stricter limits.
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id ?? null;
    }

    const isAnonymous = userId === null;
    // A suspended account (see moderate-profile) cannot use this until the suspension ends.
    if (userId) {
      const { data: suspended } = await admin.rpc("is_banned", { _user_id: userId });
      if (suspended === true) return jsonResponse({ error: "banned" }, 403);
    }

    const body = await req.json();
    const { messages, language } = body;

    if (!language || !["bg", "en"].includes(language)) {
      return jsonResponse({ error: "Invalid language parameter" }, 400);
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "Messages must be a non-empty array" }, 400);
    }

    if (messages.length > 50) {
      return jsonResponse({ error: "Too many messages in conversation" }, 400);
    }

    const maxChars = isAnonymous ? ANON_MAX_CHARS : 10000;

    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return jsonResponse({ error: "Invalid message format" }, 400);
      }

      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return jsonResponse({ error: "Invalid message role" }, 400);
      }

      if (typeof msg.content !== "string") {
        return jsonResponse({ error: "Message content must be a string" }, 400);
      }

      if (msg.content.length > maxChars) {
        return jsonResponse({ error: `Message content too long (max ${maxChars} characters)` }, 400);
      }
    }

    // 10 messages an hour for everyone: per account when logged in, per IP address
    // otherwise, plus a shared ceiling for all guests together.
    const limitKey = isAnonymous ? `anon:${clientIp(req)}` : `user:${userId}`;
    const allowed = (isAnonymous ? await withinLimit("anon:all", ANON_LIMIT_TOTAL_PER_HOUR) : true) &&
      await withinLimit(limitKey, MESSAGES_PER_HOUR);
    if (!allowed) {
      return jsonResponse({
        error: language === "bg"
          ? `Достигна лимита от ${MESSAGES_PER_HOUR} съобщения на час. Опитай отново по-късно.`
          : `You have reached the limit of ${MESSAGES_PER_HOUR} messages per hour. Please try again later.`,
      }, 429);
    }

    const context = getWebsiteContext(language);

    const systemPrompt = language === "bg"
      ? `Ти си приятелски AI асистент за уебсайта "Опознай България" - образователна платформа за изучаване на България.

ИНФОРМАЦИЯ ЗА УЕБСАЙТА:
${context}

ИНСТРУКЦИИ:
- Отговаряй на български език когато потребителят пише на български
- Можеш да отговаряш на въпроси за уебсайта (страници, функции, създатели)
- Можеш да отговаряш на въпроси за България - история, география, култура, традиции
- Бъди информативен, приятелски настроен и лаконичен
- Ако потребителят пита за нещо от сайта, използвай информацията по-горе`
      : `You are a friendly AI assistant for the website "Discover Bulgaria" - an educational platform for learning about Bulgaria.

WEBSITE INFORMATION:
${context}

INSTRUCTIONS:
- Respond in English when the user writes in English
- You can answer questions about the website (pages, features, creators)
- You can answer questions about Bulgaria - history, geography, culture, traditions
- Be informative, friendly, and concise
- If the user asks about something from the website, use the information above`;

    const conversation = [
      { role: "system", content: systemPrompt },
      // Guests send only the recent part of the conversation, to keep each call small.
      ...(isAnonymous ? messages.slice(-ANON_MAX_MESSAGES) : messages),
    ];

    const aiResponse = await callModel(conversation);
    if (!aiResponse) {
      return jsonResponse({ error: "AI service is not configured." }, 500);
    }

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonResponse({ error: "AI rate limit reached. Please wait and try again." }, 429);
      }

      if (aiResponse.status === 402) {
        return jsonResponse({ error: "AI credits required. Please top up workspace usage." }, 402);
      }

      console.error("AI provider error:", aiResponse.status, await aiResponse.text());
      return jsonResponse({ error: "AI service temporarily unavailable." }, 503);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return jsonResponse({ error: "We encountered an issue processing your request. Please try again later." }, 500);
  }
});
