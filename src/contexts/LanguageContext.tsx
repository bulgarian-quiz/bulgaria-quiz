import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'bg' | 'en';

interface Translations {
  // Navbar
  home: string;
  games: string;
  about: string;
  siteTitle: string;
  flashcards: string;
  
  // Homepage
  welcome: string;
  discoverBulgaria: string;
  mostSearchedTopics: string;
  
  // Games page
  startGame: string;
  gameDescription: string;
  bulgariaQuiz: string;
  dragDropGame: string;
  dragDropDescription: string;
  photoQuiz: string;
  photoQuizDescription: string;
  
  // About page
  aboutUs: string;
  aboutIntro: string;
  class: string;
  contactEmail: string;
  teamMember1Name: string;
  teamMember2Name: string;
  schoolName: string;
  
  // Game
  geographyQuiz: string;
  completed: string;
  legend: string;
  correct3: string;
  correct2: string;
  correct01: string;
  clickRegion: string;
  endGame: string;
  confirmLeave: string;
  yes: string;
  no: string;
  confirm: string;
  nextQuestion: string;
  finish: string;
  correctAnswer: string;
  wrongAnswer: string;
  bravo: string;
  answeredCorrectly: string;
  perfectRegions: string;
  tryAgain: string;
  
  // Timer
  timerSettings: string;
  timerQuestion: string;
  timerDuration: string;
  seconds: string;
  
  // Drag Drop Game
  placeRegions: string;
  placed: string;
  regions: string;
  timeUp: string;
  
  // Flashcards
  historyFlashcards: string;
  historyFlashcardsDescription: string;
  geographyFlashcards: string;
  geographyFlashcardsDescription: string;
  generalFlashcards: string;
  generalFlashcardsDescription: string;
  viewFlashcards: string;
  clickToFlip: string;
  back: string;
  reset: string;
}

const translations: Record<Language, Translations> = {
  bg: {
    home: 'Начало',
    games: 'Игри',
    about: 'За нас',
    siteTitle: 'Опознай България',
    flashcards: 'Флашкарти',
    welcome: 'Добре дошли!',
    discoverBulgaria: 'Опознай България!',
    mostSearchedTopics: 'Най-търсените теми:',
    startGame: 'Започни играта',
    gameDescription: 'Играта представлява интересен куиз свързан с всяка област в България. Подходящ е за ученици над 4-ти клас.',
    bulgariaQuiz: 'Куиз за България',
    dragDropGame: 'Подреди областите',
    dragDropDescription: 'В играта трябва да кликнете върху областта и с помощта на влачене я сложете там, където се намира на картата.',
    photoQuiz: 'Познай мястото',
    photoQuizDescription: '27 снимки: забележителности, личности и традиции на България. Избери верния отговор от четири или, в напредналия режим, напиши го сам.',
    aboutUs: 'За нас',
    aboutIntro: 'Ние сме ученици от ПМГ "Христо Смирненски" гр. Перник и създадохме този уебсайт с интересни игри.',
    class: 'клас',
    contactEmail: 'Имейл за контакт',
    teamMember1Name: 'Мирослав Мутафчиев',
    teamMember2Name: 'Теодор Петров',
    schoolName: 'ПМГ "Христо Смирненски"',
    geographyQuiz: 'Географски куиз',
    completed: 'Завършени',
    legend: 'Легенда',
    correct3: '3/3 правилни',
    correct2: '2/3 правилни',
    correct01: '0-1/3 правилни',
    clickRegion: 'Кликнете върху област от картата, за да започнете куиз с въпроси за нея.',
    endGame: 'Край',
    confirmLeave: 'Сигурни ли сте, че искате да напуснете играта?',
    yes: 'Да',
    no: 'Не',
    confirm: 'Потвърди',
    nextQuestion: 'Следващ въпрос',
    finish: 'Завърши',
    correctAnswer: 'Правилно! 🎉',
    wrongAnswer: 'Грешен отговор 😔',
    bravo: 'Браво! Ти завърши играта',
    answeredCorrectly: 'Отговорени правилно въпроси',
    perfectRegions: 'Изцяло правилно отговорени въпроси за област',
    tryAgain: 'Опитай пак',
    timerSettings: 'Настройки на таймера',
    timerQuestion: 'Искате ли да играете с таймер?',
    timerDuration: 'Време (секунди)',
    seconds: 'сек.',
    placeRegions: 'Постави областите на правилното място',
    placed: 'Поставени',
    regions: 'Области',
    timeUp: 'Времето изтече!',
    historyFlashcards: 'История',
    historyFlashcardsDescription: 'Флашкарти, от които можете да научите интересни факти за България, свързани с Историята.',
    geographyFlashcards: 'География',
    geographyFlashcardsDescription: 'Флашкарти, от които можете да научите интересни факти за България, свързани с Географията.',
    generalFlashcards: 'Общи интересни факти',
    generalFlashcardsDescription: 'Флашкарти, от които можете да научите интересни факти за България, свързани с всичко.',
    viewFlashcards: 'Разгледай флашкартите',
    clickToFlip: 'Кликнете, за да обърнете',
    back: 'Назад',
    reset: 'Отначало',
  },
  en: {
    home: 'Home',
    games: 'Games',
    about: 'About',
    siteTitle: 'Discover Bulgaria',
    flashcards: 'Flashcards',
    welcome: 'Welcome!',
    discoverBulgaria: 'Discover Bulgaria!',
    mostSearchedTopics: 'Most searched topics:',
    startGame: 'Start Game',
    gameDescription: 'This game is an interesting quiz related to every region in Bulgaria. Suitable for students above 4th grade.',
    bulgariaQuiz: 'Bulgaria Quiz',
    dragDropGame: 'Arrange the Regions',
    dragDropDescription: 'In this game you need to click on a region and drag it to its correct location on the map.',
    photoQuiz: 'Guess the Place',
    photoQuizDescription: '27 photos of Bulgarian landmarks, famous people and traditions. Pick the right answer from four or, in advanced mode, type it yourself.',
    aboutUs: 'About Us',
    aboutIntro: 'We are students from PMG "Hristo Smirnenski" in Pernik and we created this website with fun games.',
    class: 'grade',
    contactEmail: 'Contact email',
    teamMember1Name: 'Miroslav Mutafchiev',
    teamMember2Name: 'Teodor Petrov',
    schoolName: 'PMG "Hristo Smirnenski"',
    geographyQuiz: 'Geography Quiz',
    completed: 'Completed',
    legend: 'Legend',
    correct3: '3/3 correct',
    correct2: '2/3 correct',
    correct01: '0-1/3 correct',
    clickRegion: 'Click on a region on the map to start a quiz about it.',
    endGame: 'End',
    confirmLeave: 'Are you sure you want to leave the game?',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    nextQuestion: 'Next Question',
    finish: 'Finish',
    correctAnswer: 'Correct! 🎉',
    wrongAnswer: 'Wrong answer 😔',
    bravo: 'Bravo! You finished the game',
    answeredCorrectly: 'Questions answered correctly',
    perfectRegions: 'Perfectly answered regions',
    tryAgain: 'Try Again',
    timerSettings: 'Timer Settings',
    timerQuestion: 'Do you want to play with a timer?',
    timerDuration: 'Time (seconds)',
    seconds: 'sec.',
    placeRegions: 'Place the regions in their correct location',
    placed: 'Placed',
    regions: 'Regions',
    timeUp: 'Time is up!',
    historyFlashcards: 'History',
    historyFlashcardsDescription: 'Flashcards to learn interesting facts about Bulgaria related to History.',
    geographyFlashcards: 'Geography',
    geographyFlashcardsDescription: 'Flashcards to learn interesting facts about Bulgaria related to Geography.',
    generalFlashcards: 'General Interesting Facts',
    generalFlashcardsDescription: 'Flashcards to learn interesting facts about Bulgaria related to everything.',
    viewFlashcards: 'View Flashcards',
    clickToFlip: 'Click to flip',
    back: 'Back',
    reset: 'Reset',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('bg');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
