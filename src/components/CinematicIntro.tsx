import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mouse } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import history681 from '@/assets/history-681.jpg';
import history864 from '@/assets/history-864.jpg';
import history917 from '@/assets/history-917.jpg';
import history1018 from '@/assets/history-1018.jpg';
import history1185 from '@/assets/history-1185.jpg';
import history1230 from '@/assets/history-1230.jpg';
import history1396 from '@/assets/history-1396.jpg';
import history1762 from '@/assets/history-1762.jpg';
import history1835 from '@/assets/history-1835.jpg';
import history1876 from '@/assets/history-1876.jpg';
import history1878 from '@/assets/history-1878.jpg';
import history1885 from '@/assets/history-1885.jpg';
import history1908 from '@/assets/history-1908.jpg';
import history1912 from '@/assets/history-1912.jpg';
import history1943 from '@/assets/history-1943.jpg';
import history1944 from '@/assets/history-1944.jpg';
import history1946 from '@/assets/history-1946.jpg';
import history1968 from '@/assets/history-1968.jpg';
import history1984 from '@/assets/history-1984.jpg';
import history1989 from '@/assets/history-1989.jpg';
import history2004 from '@/assets/history-2004.jpg';
import history2007 from '@/assets/history-2007.jpg';
import history2026 from '@/assets/history-2026.jpg';
import { stableViewportHeight } from '@/lib/viewport';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const chapters = [
  { year: '681', image: history681, bg: 'Основаване на България', en: 'The Bulgarian state is founded', bodyBg: 'Хан Аспарух утвърждава държавата южно от Дунав.', bodyEn: 'Khan Asparuh establishes the state south of the Danube.' },
  { year: '864', image: history864, bg: 'Покръстването', en: 'Christianization', bodyBg: 'Княз Борис I приема християнството и променя посоката на държавата.', bodyEn: 'Knyaz Boris I adopts Christianity and changes the nation’s course.' },
  { year: '917', image: history917, bg: 'Златният век', en: 'The Golden Age', bodyBg: 'При цар Симеон Велики България достига културен и политически връх.', bodyEn: 'Under Tsar Simeon the Great, Bulgaria reaches a cultural and political zenith.' },
  { year: '1018', image: history1018, bg: 'Краят на Първото царство', en: 'The First Empire falls', bodyBg: 'Българските земи преминават под византийска власт.', bodyEn: 'The Bulgarian lands fall under Byzantine rule.' },
  { year: '1185', image: history1185, bg: 'Възстановяването', en: 'The restoration', bodyBg: 'Въстанието на Асен и Петър възстановява българската държава.', bodyEn: 'The uprising of Asen and Peter restores the Bulgarian state.' },
  { year: '1230', image: history1230, bg: 'Клокотница', en: 'Klokotnitsa', bodyBg: 'Победата на Иван Асен II превръща България във водеща сила на Балканите.', bodyEn: 'Ivan Asen II’s victory makes Bulgaria a leading Balkan power.' },
  { year: '1396', image: history1396, bg: 'Падане под османска власт', en: 'Ottoman conquest', bodyBg: 'Средновековната държава губи независимостта си за близо пет века.', bodyEn: 'The medieval state loses its independence for nearly five centuries.' },
  { year: '1762', image: history1762, bg: 'История славянобългарска', en: 'Slavonic-Bulgarian History', bodyBg: 'Паисий Хилендарски събужда паметта за българското минало.', bodyEn: 'Paisius of Hilendar reawakens the memory of Bulgaria’s past.' },
  { year: '1835', image: history1835, bg: 'Българското възраждане', en: 'The National Revival', bodyBg: 'Новобългарското училище отваря пътя към знание и свобода.', bodyEn: 'Modern Bulgarian schools open a path toward knowledge and freedom.' },
  { year: '1876', image: history1876, bg: 'Априлското въстание', en: 'The April Uprising', bodyBg: 'Жаждата за свобода привлича вниманието на Европа.', bodyEn: 'The struggle for freedom draws Europe’s attention.' },
  { year: '1878', image: history1878, bg: 'Освобождението', en: 'Liberation', bodyBg: 'Българската държавност е възстановена след Руско-турската война.', bodyEn: 'Bulgarian statehood is restored after the Russo-Turkish War.' },
  { year: '1885', image: history1885, bg: 'Съединението', en: 'Unification', bodyBg: 'Княжество България и Източна Румелия се обединяват.', bodyEn: 'The Principality of Bulgaria and Eastern Rumelia unite.' },
  { year: '1908', image: history1908, bg: 'Независимостта', en: 'Independence', bodyBg: 'В Търново България обявява пълната си независимост.', bodyEn: 'Bulgaria declares its full independence in Tarnovo.' },
  { year: '1912', image: history1912, bg: 'Балканските войни', en: 'The Balkan Wars', bodyBg: 'Страната влиза в решаваща борба за национално обединение.', bodyEn: 'The country enters a defining struggle for national unification.' },
  { year: '1943', image: history1943, bg: 'Спасяването на българските евреи', en: 'Rescue of Bulgarian Jews', bodyBg: 'Граждани, духовници и политици спират депортацията.', bodyEn: 'Citizens, clergy, and politicians prevent the deportation.' },
  { year: '1944', image: history1944, bg: 'Нова политическа епоха', en: 'A new political era', bodyBg: 'Девети септември променя управлението и обществото за десетилетия.', bodyEn: 'The events of September 9 reshape government and society for decades.' },
  { year: '1946', image: history1946, bg: 'Народна република България', en: 'People’s Republic of Bulgaria', bodyBg: 'Монархията е премахната и започва еднопартийно комунистическо управление.', bodyEn: 'The monarchy is abolished and one-party communist rule begins.' },
  { year: '1968', image: history1968, bg: 'Индустриализация и колективизация', en: 'Industrialization and collectivization', bodyBg: 'Държавно планираната икономика преобразява градовете, селата и труда.', bodyEn: 'The state-planned economy transforms cities, villages, and working life.' },
  { year: '1984', image: history1984, bg: 'Късният социализъм', en: 'Late socialism', bodyBg: 'Всекидневието минава между панелните квартали, недостига и засиления държавен контрол.', bodyEn: 'Daily life unfolds amid housing estates, shortages, and intensified state control.' },
  { year: '1989', image: history1989, bg: 'Демократичният преход', en: 'Democratic transition', bodyBg: 'Падането на режима отваря пътя към многопартийна демокрация.', bodyEn: 'The fall of the regime opens the way to multiparty democracy.' },
  { year: '2004', image: history2004, bg: 'България в НАТО', en: 'Bulgaria joins NATO', bodyBg: 'Страната става част от Северноатлантическия съюз.', bodyEn: 'The country becomes a member of the North Atlantic Alliance.' },
  { year: '2007', image: history2007, bg: 'България в Европейския съюз', en: 'Bulgaria joins the European Union', bodyBg: 'България става част от европейското семейство.', bodyEn: 'Bulgaria becomes part of the European Union.' },
  { year: '2026', image: history2026, bg: 'България днес', en: 'Bulgaria today', bodyBg: 'Държава с древна памет, която продължава да пише своята история.', bodyEn: 'A country with an ancient memory, still writing its history.' },
];

interface CinematicIntroProps {
  onProgress?: (progress: number) => void;
}

const CinematicIntro = ({ onProgress }: CinematicIntroProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number>();
  const [progress, setProgress] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [wordmarkReady, setWordmarkReady] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    let active = true;
    const revealWordmark = () => {
      if (active) setWordmarkReady(true);
    };
    if (!document.fonts) revealWordmark();
    else void document.fonts.load('400 120px "Caveat Local"').then(revealWordmark, revealWordmark);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const startedAt = performance.now();
    let animationFrame = 0;
    const animateTitle = (now: number) => {
      const elapsed = now - startedAt;
      const fadeIn = clamp(elapsed / 2200);
      setTitleOpacity(fadeIn);
      if (fadeIn < 1) animationFrame = requestAnimationFrame(animateTitle);
    };
    animationFrame = requestAnimationFrame(animateTitle);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const update = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (section) {
          const travel = Math.max(1, section.offsetHeight - stableViewportHeight());
          const nextProgress = clamp(-section.getBoundingClientRect().top / travel);
          setProgress(nextProgress);
          onProgress?.(nextProgress);
        }
        frameRef.current = undefined;
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [onProgress]);

  const introEnd = 0.03;
  const journey = clamp((progress - introEnd) / (1 - introEnd));
  const chapterPosition = journey * (chapters.length - 1);
  const activeIndex = Math.min(chapters.length - 1, Math.floor(chapterPosition + 0.5));
  const activeChapter = chapters[activeIndex];
  const headingText = language === 'bg' ? activeChapter.bg : activeChapter.en;
  const localDistance = Math.abs(chapterPosition - activeIndex);

  // Chapter titles wrap between whole words only. If a single word (such as
  // "славянобългарска") is wider than the column on a narrow screen, the title
  // shrinks just enough to fit instead of splitting the word.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    const fit = () => {
      heading.style.fontSize = '';
      const overflow = heading.scrollWidth - heading.clientWidth;
      if (overflow > 1) {
        const size = parseFloat(getComputedStyle(heading).fontSize);
        heading.style.fontSize = `${Math.floor(size * (heading.clientWidth / heading.scrollWidth) * 0.98)}px`;
      }
    };
    fit();
    // iOS fires resize while scrolling (the address bar shows and hides); the
    // heading only needs measuring again when the width really changes.
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      fit();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [headingText]);
  // A flat central plateau holds each photograph still at full-screen size.
  const chapterFocus = (distance: number) => clamp((0.49 - distance) / 0.23);
  const focus = chapterFocus(localDistance);
  const scrollTitleVisibility = clamp(1 - progress / (introEnd * 0.72));
  const timelineVisibility = clamp((progress - introEnd * 0.72) / (introEnd * 0.28));

  return (
    <section ref={sectionRef} className="history-intro" aria-label={language === 'bg' ? 'История на България' : 'History of Bulgaria'}>
      <div className="history-intro__stage">
        <div className="cinematic-intro__grain" aria-hidden="true" />
        <p
          aria-hidden="true"
          className="history-intro__wordmark"
          style={{
            opacity: (wordmarkReady ? titleOpacity : 0) * scrollTitleVisibility,
            transform: `translate3d(0, ${-progress * 180}px, 0) scale(${0.96 + titleOpacity * 0.04})`,
          }}
        >
          Bulgaria
        </p>
        <div className="history-intro__journey" style={{ opacity: timelineVisibility }}>
          <div className="history-intro__images" aria-live="polite">
            {chapters.map((chapter, index) => {
              const distance = Math.abs(chapterPosition - index);
              const visibility = chapterFocus(distance);
              return (
                <figure
                  className="history-intro__scene"
                  key={chapter.year}
                  style={visibility > 0
                    ? { opacity: visibility, transform: `translate3d(${(1 - visibility) * 34}vw, 0, 0) scale(${0.72 + visibility * 0.28})`, willChange: 'transform, opacity' }
                    : { opacity: 0, visibility: 'hidden' }}
                  aria-hidden={index !== activeIndex}
                >
                  <img src={chapter.image} alt="" width={1536} height={1024} loading={index === 0 ? 'eager' : 'lazy'} />
                  <div className="history-intro__vignette" />
                </figure>
              );
            })}
          </div>

          <div className="history-intro__copy" style={{ opacity: focus, transform: `translate3d(0, ${(1 - focus) * 26}px, 0)` }}>
            <span>{activeChapter.year}</span>
            <h2 ref={headingRef}>{headingText}</h2>
            <p>{language === 'bg' ? activeChapter.bodyBg : activeChapter.bodyEn}</p>
          </div>

          <div className="history-intro__rail" style={{ opacity: 1 - focus * 0.72 }}>
            <div
              className="history-intro__track"
              style={{ transform: `translate3d(calc(50vw - ${chapterPosition * 11.5}rem), 0, 0)` }}
            >
              {chapters.map((chapter, index) => (
                <div className={`history-intro__tick${index === activeIndex ? ' is-active' : ''}`} key={chapter.year}>
                  <i />
                  <span>{chapter.year}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="history-intro__counter">
            <span>{String(activeIndex + 1).padStart(2, '0')}</span>
            <i />
            <span>{chapters.length}</span>
          </div>
        </div>

        <div
          className="cinematic-intro__scroll-cue"
          style={{ opacity: clamp(1 - progress / 0.025), transform: `translate3d(-50%, ${progress * 100}px, 0)` }}
          aria-hidden="true"
        >
          <Mouse className="h-5 w-5" strokeWidth={1.35} />
          <span>{language === 'bg' ? 'превърти' : 'scroll'}</span>
        </div>
      </div>
    </section>
  );
};

export default CinematicIntro;