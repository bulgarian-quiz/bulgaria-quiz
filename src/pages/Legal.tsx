import { useLanguage } from "@/contexts/LanguageContext";
import { useSeo } from "@/seo/useSeo";
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/lib/legal";

/**
 * The Privacy Policy and the Terms & Conditions, at /privacy-policy and
 * /terms-and-conditions on the main site.
 */
export type LegalKind = "privacy" | "terms";

const UPDATED = { bg: "7 ноември 2026 г.", en: "7 November 2026" };

type Section = { h: string; p: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const DOCS: Record<LegalKind, Record<"bg" | "en", Doc>> = {
  privacy: {
    bg: {
      title: "Политика за поверителност",
      intro:
        "„Опознай България“ (bulgaria-game.com) е безплатен образователен сайт, създаден от ученици от ПМГ „Христо Смирненски“, Перник. Тази политика обяснява какви данни събираме, защо и какви права имаш.",
      sections: [
        { h: "Какви данни събираме", p: [
          "Без профил: не събираме лични данни. Сайтът пази в браузъра ти настройки като тема, език, избор за бисквитките и дали си гледал филма на началната страница.",
          "С профил: имейл адрес, парола (съхранява се само в защитен, необратим вид), име за показване и по желание снимка на профила, както и игровият ти напредък — точки, серии, изиграни игри и завършени области.",
          "Мултиплейър: стаите и резултатите от игрите срещу други играчи.",
          "AI асистент: съобщенията, които изпращаш, се предават за отговор на доставчик на изкуствен интелект (Pollinations или Google Gemini). Не ги запазваме в нашата база данни. За да ограничим злоупотреби, броим съобщенията на час по профил или по IP адрес.",
        ] },
        { h: "Защо ги използваме", p: [
          "За да работят профилът, входът, точките и класацията (изпълнение на услугата, която си поискал); за да пазим сайта от злоупотреби (законен интерес); и за незадължителни бисквитки — само ако ги приемеш (съгласие).",
        ] },
        { h: "Бисквитки и локално хранилище", p: [
          "Използваме само необходимото, за да работят входът и настройките. В момента сайтът не използва рекламни или аналитични бисквитки. Ако в бъдеще добавим такива, те ще се включват само след като ги приемеш. Можеш да промениш избора си по всяко време от Настройки → Бисквитки.",
        ] },
        { h: "С кого споделяме данни", p: [
          "Не продаваме и не предоставяме данните ти за реклама. Използваме доставчици, които ни помагат сайтът да работи: хостинг и база данни (Lovable Cloud / Supabase), AI отговори (Pollinations, Google Gemini) и шрифтове (Google Fonts, който вижда IP адреса ти при зареждане на шрифта). Някои от тях може да обработват данни извън ЕС при подходящи гаранции.",
        ] },
        { h: "Колко дълго пазим данните", p: [
          "Данните на профила пазим, докато профилът съществува. Броячът на съобщения към AI асистента се нулира всеки час. Настройките в браузъра остават, докато не ги изтриеш.",
        ] },
        { h: "Деца", p: [
          "Сайтът е предназначен за ученици. Ако си под 14 години, помоли родител или настойник да създаде профила или да се съгласи с него. Игрите и флашкартите могат да се използват и без профил.",
        ] },
        { h: "Твоите права", p: [
          "Имаш право на достъп до данните си, да ги поправиш, да поискаш изтриването им, да ограничиш обработването или да възразиш срещу него, да получиш данните си и да оттеглиш съгласие. Можеш да подадеш жалба и до Комисията за защита на личните данни (cpdp.bg).",
        ] },
        { h: "Контакт", p: [
          "За въпроси или искания, свързани с данните ти, пиши ни на имейлите от страницата „За нас“ на bulgaria-game.com/about.",
        ] },
        { h: "Промени", p: [
          "Ако променим тази политика, ще обновим датата по-горе. При съществени промени ще уведомим потребителите с профил.",
        ] },
      ],
    },
    en: {
      title: "Privacy Policy",
      intro:
        "“Get to Know Bulgaria” (bulgaria-game.com) is a free educational site made by students of PMG “Hristo Smirnenski”, Pernik. This policy explains what data we collect, why, and what your rights are.",
      sections: [
        { h: "What we collect", p: [
          "Without an account: no personal data. Your browser keeps settings such as theme, language, your cookie choice and whether you have seen the homepage film.",
          "With an account: your email address, password (stored only in a protected, irreversible form), display name and, optionally, a profile picture, plus your game progress — points, streaks, games played and completed provinces.",
          "Multiplayer: game rooms and results of games against other players.",
          "AI assistant: the messages you send are passed to an AI provider (Pollinations or Google Gemini) for a reply. We do not store them in our database. To prevent abuse, we count messages per hour by account or IP address.",
        ] },
        { h: "Why we use it", p: [
          "To run your account, sign-in, points and leaderboard (providing the service you asked for); to protect the site from abuse (legitimate interest); and for optional cookies only if you accept them (consent).",
        ] },
        { h: "Cookies and local storage", p: [
          "We only use what sign-in and your settings need. The site currently uses no advertising or analytics cookies. If we add any, they will only run after you accept them. You can change your choice at any time in Settings → Cookies.",
        ] },
        { h: "Who we share data with", p: [
          "We do not sell your data or share it for advertising. We use providers that help run the site: hosting and database (Lovable Cloud / Supabase), AI replies (Pollinations, Google Gemini) and fonts (Google Fonts, which sees your IP address when the font loads). Some may process data outside the EU under appropriate safeguards.",
        ] },
        { h: "How long we keep it", p: [
          "Account data is kept while the account exists. The AI message counter resets every hour. Browser settings stay until you clear them.",
        ] },
        { h: "Children", p: [
          "The site is meant for students. If you are under 14, ask a parent or guardian to create the account or agree to it. The games and flashcards can be used without an account.",
        ] },
        { h: "Your rights", p: [
          "You can access, correct or delete your data, restrict or object to its processing, receive a copy of it and withdraw consent. You can also complain to the Bulgarian Commission for Personal Data Protection (cpdp.bg).",
        ] },
        { h: "Contact", p: [
          "For questions or requests about your data, email us at the addresses on the About page, bulgaria-game.com/about.",
        ] },
        { h: "Changes", p: [
          "If we change this policy, we will update the date above. For significant changes we will notify account holders.",
        ] },
      ],
    },
  },
  terms: {
    bg: {
      title: "Общи условия",
      intro:
        "Тези условия важат за използването на „Опознай България“ (bulgaria-game.com) — безплатен образователен сайт, създаден от ученици от ПМГ „Христо Смирненски“, Перник. Като използваш сайта или създадеш профил, се съгласяваш с тях.",
      sections: [
        { h: "Услугата", p: [
          "Сайтът предлага безплатни игри, куизове, флашкарти и AI асистент за историята и географията на България. Може да променяме, добавяме или премахваме функции по всяко време.",
        ] },
        { h: "Профил", p: [
          "Пази паролата си и не споделяй профила си. Ако си под 14 години, профилът трябва да е създаден или одобрен от родител или настойник. Може да спрем профил, който нарушава тези условия.",
        ] },
        { h: "Правила за поведение", p: [
          "Не използвай обидни, неприлични или чужди имена; не тормози други играчи; не се опитвай да мамиш в класацията, да претоварваш или да пробиваш сайта; не използвай AI асистента за вредно или незаконно съдържание.",
        ] },
        { h: "AI асистент", p: [
          "Отговорите се създават автоматично и може да съдържат грешки. Проверявай важната информация в учебник или друг надежден източник. Броят съобщения на час е ограничен.",
        ] },
        { h: "Съдържание", p: [
          "Текстовете, въпросите, изображенията и кодът на сайта принадлежат на създателите му или се използват с разрешение. Можеш да ги използваш за лично обучение и в училище, но не и да ги копираш или разпространяваш с търговска цел.",
        ] },
        { h: "Без гаранции", p: [
          "Сайтът се предоставя „както е“. Стараем се информацията да е вярна и сайтът да работи, но не гарантираме, че винаги ще е без грешки или без прекъсване, и доколкото законът позволява, не носим отговорност за загуби от използването му.",
        ] },
        { h: "Поверителност", p: [
          "Как обработваме данните ти е описано в Политиката за поверителност на bulgaria-game.com/privacy-policy.",
        ] },
        { h: "Промени и приложимо право", p: [
          "Може да обновяваме тези условия; датата по-горе показва последната версия. Прилага се българското право.",
        ] },
        { h: "Контакт", p: [
          "Въпроси можеш да ни изпратиш на имейлите от страницата „За нас“ на bulgaria-game.com/about.",
        ] },
      ],
    },
    en: {
      title: "Terms & Conditions",
      intro:
        "These terms apply to using “Get to Know Bulgaria” (bulgaria-game.com), a free educational site made by students of PMG “Hristo Smirnenski”, Pernik. By using the site or creating an account, you agree to them.",
      sections: [
        { h: "The service", p: [
          "The site offers free games, quizzes, flashcards and an AI assistant about the history and geography of Bulgaria. We may change, add or remove features at any time.",
        ] },
        { h: "Your account", p: [
          "Keep your password safe and do not share your account. If you are under 14, a parent or guardian must create or approve the account. We may suspend accounts that break these terms.",
        ] },
        { h: "Rules of conduct", p: [
          "Do not use offensive, indecent or other people's names; do not harass other players; do not cheat on the leaderboard, overload or attack the site; do not use the AI assistant for harmful or illegal content.",
        ] },
        { h: "AI assistant", p: [
          "Replies are generated automatically and may contain mistakes. Check important information in a textbook or another reliable source. The number of messages per hour is limited.",
        ] },
        { h: "Content", p: [
          "The site's texts, questions, images and code belong to its creators or are used with permission. You may use them for personal and school learning, but not copy or distribute them commercially.",
        ] },
        { h: "No warranty", p: [
          "The site is provided “as is”. We try to keep the information accurate and the site running, but do not guarantee it will always be error-free or uninterrupted and, as far as the law allows, are not liable for losses from using it.",
        ] },
        { h: "Privacy", p: [
          "How we handle your data is described in the Privacy Policy at bulgaria-game.com/privacy-policy.",
        ] },
        { h: "Changes and governing law", p: [
          "We may update these terms; the date above shows the latest version. Bulgarian law applies.",
        ] },
        { h: "Contact", p: [
          "Send questions to the email addresses on the About page, bulgaria-game.com/about.",
        ] },
      ],
    },
  },
};

export default function Legal({ kind }: { kind: LegalKind }) {
  const { language, setLanguage } = useLanguage();
  const lang = language === "en" ? "en" : "bg";
  const doc = DOCS[kind][lang];
  useSeo(kind === "privacy" ? "/privacy-policy" : "/terms-and-conditions");
  const other = kind === "privacy"
    ? { href: TERMS_URL, label: DOCS.terms[lang].title }
    : { href: PRIVACY_POLICY_URL, label: DOCS.privacy[lang].title };

  return (
    <main className="legal-page min-h-[100svh] bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <nav className="mb-10 flex flex-wrap items-center justify-between gap-3 text-sm">
          <a href="/" className="font-semibold text-foreground hover:text-primary">
            {lang === "bg" ? "← Опознай България" : "← Get to Know Bulgaria"}
          </a>
          <button
            type="button"
            onClick={() => setLanguage(lang === "bg" ? "en" : "bg")}
            className="rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            {lang === "bg" ? "English" : "Български"}
          </button>
        </nav>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {lang === "bg" ? "В сила от " : "Effective "}{UPDATED[lang]}
        </p>
        <p className="mt-8 text-lg leading-relaxed text-foreground/90">{doc.intro}</p>
        {doc.sections.map((section) => (
          <section key={section.h} className="mt-10">
            <h2 className="text-xl font-semibold">{section.h}</h2>
            {section.p.map((text) => (
              <p key={text} className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
            ))}
          </section>
        ))}
        <footer className="mt-14 border-t border-border pt-6 text-sm">
          <a href={other.href} className="font-medium text-blue-500 underline underline-offset-2 hover:text-blue-400">{other.label}</a>
        </footer>
      </div>
    </main>
  );
}
