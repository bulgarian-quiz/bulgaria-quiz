export interface Flashcard {
  title: { bg: string; en: string };
  content: { bg: string; en: string };
}

export interface FlashcardCategory {
  id: string;
  titleKey: string;
  descriptionKey: string;
  cards: Flashcard[];
}

export const historyCards: Flashcard[] = [
  {
    title: { bg: "Създаване на Българската държава (681 г.)", en: "Establishment of the Bulgarian State (681 AD)" },
    content: { bg: "България е призната от Византия като самостоятелна държава. Това поставя началото на Първата българска държава.", en: "Bulgaria was recognized by Byzantium as an independent state. This marks the beginning of the First Bulgarian Empire." },
  },
  {
    title: { bg: "Покръстване на България (864 г.)", en: "Christianization of Bulgaria (864 AD)" },
    content: { bg: "Княз Борис I въвежда християнството като официална религия. Това обединява народа и укрепва държавата.", en: "Prince Boris I introduces Christianity as the official religion. This unites the people and strengthens the state." },
  },
  {
    title: { bg: "Създаване на славянската писменост (9 век)", en: "Creation of the Slavic Script (9th century)" },
    content: { bg: "Кирил и Методий създават азбуката, която по-късно става основа на българската писменост. Това помага за развитие на културата и образованието.", en: "Cyril and Methodius create the alphabet, which later becomes the foundation of Bulgarian writing. This helps develop culture and education." },
  },
  {
    title: { bg: "Златният век при цар Симеон I (893–927 г.)", en: "The Golden Age under Tsar Simeon I (893–927 AD)" },
    content: { bg: "България достига най-голямото си териториално разширение и културен разцвет. Създават се важни литературни и духовни творби.", en: "Bulgaria reaches its greatest territorial expansion and cultural prosperity. Important literary and spiritual works are created." },
  },
  {
    title: { bg: "Битката при Клокотница (1230 г.)", en: "Battle of Klokotnitsa (1230 AD)" },
    content: { bg: "Цар Иван Асен II побеждава епирския владетел Теодор Комнин. България става най-силната държава на Балканите.", en: "Tsar Ivan Asen II defeats the Epirote ruler Theodore Komnenos. Bulgaria becomes the most powerful state in the Balkans." },
  },
  {
    title: { bg: "Падането под османска власт (1396 г.)", en: "Fall under Ottoman Rule (1396 AD)" },
    content: { bg: "България губи независимостта си и попада под Османската империя. Следват почти 500 години чужда власт.", en: "Bulgaria loses its independence and falls under the Ottoman Empire. Almost 500 years of foreign rule follow." },
  },
  {
    title: { bg: "Априлското въстание (1876 г.)", en: "April Uprising (1876 AD)" },
    content: { bg: "Българите въстават срещу османската власт, за да си върнат свободата. Макар потушено, въстанието привлича вниманието на Европа.", en: "Bulgarians revolt against Ottoman rule to regain their freedom. Although suppressed, the uprising attracts Europe's attention." },
  },
  {
    title: { bg: "Освобождението на България (1878 г.)", en: "Liberation of Bulgaria (1878 AD)" },
    content: { bg: "След Руско-турската война България получава автономия. Това е началото на възстановяването на държавата.", en: "After the Russo-Turkish War, Bulgaria gains autonomy. This marks the beginning of the restoration of the state." },
  },
  {
    title: { bg: "Съединението на България (1885 г.)", en: "Unification of Bulgaria (1885 AD)" },
    content: { bg: "Княжество България и Източна Румелия се обединяват. Съединението утвърждава националното единство.", en: "The Principality of Bulgaria and Eastern Rumelia unite. The unification affirms national unity." },
  },
  {
    title: { bg: "Обявяване на независимостта (1908 г.)", en: "Declaration of Independence (1908 AD)" },
    content: { bg: "България официално обявява, че е напълно независима държава. Княз Фердинанд става цар на България.", en: "Bulgaria officially declares that it is a fully independent state. Prince Ferdinand becomes Tsar of Bulgaria." },
  },
];

export const geographyCards: Flashcard[] = [
  {
    title: { bg: "Разнообразен релеф", en: "Diverse Terrain" },
    content: { bg: "България има едни от най-разнообразните релефи в Европа. Само в рамките на страната има планини, равнини, море, реки и пещери.", en: "Bulgaria has one of the most diverse terrains in Europe. Within the country alone, there are mountains, plains, sea, rivers and caves." },
  },
  {
    title: { bg: "Рила - най-високата планина", en: "Rila - the Highest Mountain" },
    content: { bg: "Рила е най-високата планина на Балканите. Връх Мусала е 2925 м и е най-висок в целия полуостров.", en: "Rila is the highest mountain in the Balkans. Musala Peak is 2925 m and is the highest in the entire peninsula." },
  },
  {
    title: { bg: "Река Дунав", en: "Danube River" },
    content: { bg: "Дунав е най-дългата река, която минава покрай България. Той образува естествената северна граница на страната.", en: "The Danube is the longest river that passes by Bulgaria. It forms the natural northern border of the country." },
  },
  {
    title: { bg: "Черно море", en: "Black Sea" },
    content: { bg: "Черно море е част от територията на България на изток. По крайбрежието има важни градове като Варна и Бургас.", en: "The Black Sea is part of Bulgaria's territory to the east. Along the coast are important cities like Varna and Burgas." },
  },
  {
    title: { bg: "Пещера Магурата", en: "Magura Cave" },
    content: { bg: "Пещера Магурата съдържа древни рисунки. Те са на повече от 8000 години и показват сцени от живота на хората.", en: "Magura Cave contains ancient drawings. They are more than 8000 years old and show scenes from people's lives." },
  },
  {
    title: { bg: "Долината на розите", en: "Valley of Roses" },
    content: { bg: "Долината на розите е световно известна. Там се добива розово масло, което се използва в най-скъпите парфюми.", en: "The Valley of Roses is world famous. Rose oil is produced there, which is used in the most expensive perfumes." },
  },
  {
    title: { bg: "Родопите", en: "Rhodope Mountains" },
    content: { bg: "Родопите са една от най-старите планини в Европа. Те са свързани с много легенди, включително тази за Орфей.", en: "The Rhodopes are one of the oldest mountains in Europe. They are associated with many legends, including that of Orpheus." },
  },
  {
    title: { bg: "Белоградчишките скали", en: "Belogradchik Rocks" },
    content: { bg: "Белоградчишките скали са природен феномен. Огромни скални форми с причудливи форми, създадени от природата.", en: "The Belogradchik Rocks are a natural phenomenon. Huge rock formations with bizarre shapes, created by nature." },
  },
  {
    title: { bg: "Минерални извори", en: "Mineral Springs" },
    content: { bg: "България има над 600 минерални извора. Това прави страната една от най-богатите на минерални води в Европа.", en: "Bulgaria has over 600 mineral springs. This makes the country one of the richest in mineral waters in Europe." },
  },
  {
    title: { bg: "Седемте рилски езера", en: "Seven Rila Lakes" },
    content: { bg: "Седемте рилски езера са сред най-посещаваните природни забележителности. Те се намират високо в планината и са подредени едно над друго като стълба.", en: "The Seven Rila Lakes are among the most visited natural landmarks. They are located high in the mountain and are arranged one above the other like a ladder." },
  },
];

export const generalFactsCards: Flashcard[] = [
  {
    title: { bg: "Винарство", en: "Winemaking" },
    content: { bg: "България е дом на едни от най-старите обработвани вина в Европа. Винарството по нашите земи съществува от над 3000 години.", en: "Bulgaria is home to some of the oldest cultivated wines in Europe. Winemaking in our lands has existed for over 3000 years." },
  },
  {
    title: { bg: "Пирин - обект на ЮНЕСКО", en: "Pirin - UNESCO Site" },
    content: { bg: "Пирин е под закрилата на ЮНЕСКО. Планината е известна с редки растения, ледникови езера и диви животни.", en: "Pirin is under UNESCO protection. The mountain is known for rare plants, glacial lakes and wild animals." },
  },
  {
    title: { bg: "Провадия-Солницата", en: "Provadia-Solnitsata" },
    content: { bg: "България има една от най-старите солници в света – Провадия-Солницата. Там е открито праисторическо солно градче, по-старо от египетските пирамиди.", en: "Bulgaria has one of the oldest salt mines in the world – Provadia-Solnitsata. A prehistoric salt town was discovered there, older than the Egyptian pyramids." },
  },
  {
    title: { bg: "Български език", en: "Bulgarian Language" },
    content: { bg: "Българският език е сред най-старите писмени славянски езици. Има свои уникални граматични особености като членуването.", en: "Bulgarian is among the oldest written Slavic languages. It has unique grammatical features such as the definite article." },
  },
  {
    title: { bg: "Пещера Духлата", en: "Duhlata Cave" },
    content: { bg: "В България се намира най-дългата пещера на Балканите – Духлата. Тя има над 18 километра сложни тунели и подземни канали.", en: "Bulgaria is home to the longest cave in the Balkans – Duhlata. It has over 18 kilometers of complex tunnels and underground channels." },
  },
  {
    title: { bg: "Климатични зони", en: "Climate Zones" },
    content: { bg: "България разполага с шест климатични зони въпреки малката си площ. Това прави страната подходяща за различни култури, планини и морски туризъм.", en: "Bulgaria has six climate zones despite its small area. This makes the country suitable for various crops, mountain and sea tourism." },
  },
  {
    title: { bg: "Мадарският конник", en: "Madara Rider" },
    content: { bg: "Мадарският конник е единствен по рода си скален релеф в Европа. Той е издълбан високо в скалата още през VIII век.", en: "The Madara Rider is a unique rock relief in Europe. It was carved high in the rock back in the 8th century." },
  },
  {
    title: { bg: "Пловдив", en: "Plovdiv" },
    content: { bg: "Пловдив е един от най-старите постоянно населени градове в света. Хора живеят там от поне 8000 години.", en: "Plovdiv is one of the oldest continuously inhabited cities in the world. People have lived there for at least 8000 years." },
  },
  {
    title: { bg: "Лавандула", en: "Lavender" },
    content: { bg: "България е сред водещите страни в производството на лавандула. През последните години често изпреварва дори Франция.", en: "Bulgaria is among the leading countries in lavender production. In recent years, it often surpasses even France." },
  },
  {
    title: { bg: "Римски театър в Пловдив", en: "Roman Theatre in Plovdiv" },
    content: { bg: "В България се намира един от най-добре запазените римски театри – този в Пловдив. Днес в него все още се провеждат концерти и спектакли.", en: "Bulgaria is home to one of the best-preserved Roman theatres – the one in Plovdiv. Today, concerts and performances are still held there." },
  },
];

export const flashcardCategories: FlashcardCategory[] = [
  {
    id: 'history',
    titleKey: 'historyFlashcards',
    descriptionKey: 'historyFlashcardsDescription',
    cards: historyCards,
  },
  {
    id: 'geography',
    titleKey: 'geographyFlashcards',
    descriptionKey: 'geographyFlashcardsDescription',
    cards: geographyCards,
  },
  {
    id: 'general',
    titleKey: 'generalFlashcards',
    descriptionKey: 'generalFlashcardsDescription',
    cards: generalFactsCards,
  },
];
