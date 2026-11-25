// Questions for the photo game ("Познай мястото"): one photo per question,
// in this order: places, then people, then traditions and symbols.
//
// Photos live in public/images/photo-quiz/ and are named after the question number:
// 01.jpg, 02.jpg … 27.jpg. Until a photo is added the game shows a numbered
// placeholder in its place, so the game is fully playable without them.
//
// Each question has:
//  - answer:  the name shown as the correct answer;
//  - accepts: other spellings and short forms that also count as correct when
//             the answer is typed (capitals, articles such as -ът/-ят, quotes
//             and small typos are already forgiven by the checker);
//  - wrong:   three wrong options, used with the answer for the а/б/в/г version.

export interface PhotoQuestion {
  id: string;
  image: string;
  question: { bg: string; en: string };
  answer: { bg: string; en: string };
  accepts: { bg: string[]; en: string[] };
  wrong: { bg: [string, string, string]; en: [string, string, string] };
}

const LANDMARK = { bg: 'Коя е тази забележителност?', en: 'What is this landmark?' };
const MONASTERY = { bg: 'Кой е този манастир?', en: 'Which monastery is this?' };
const FORTRESS = { bg: 'Коя е тази крепост?', en: 'Which fortress is this?' };
const NATURE = { bg: 'Кое е това природно чудо?', en: 'Which natural wonder is this?' };
const MONUMENT = { bg: 'Кой е този паметник?', en: 'Which monument is this?' };
const BRIDGE = { bg: 'Кой е този мост?', en: 'Which bridge is this?' };
const PERSON = { bg: 'Кой е този човек?', en: 'Who is this?' };

type Entry = Omit<PhotoQuestion, 'id' | 'image'>;

const ENTRIES: Entry[] = [
  // 01
  {
    question: MONASTERY,
    answer: { bg: 'Рилски манастир', en: 'Rila Monastery' },
    accepts: { bg: ['Рилския манастир', 'Рилският манастир', 'Манастир Свети Иван Рилски'], en: ['Monastery of Saint Ivan of Rila'] },
    wrong: { bg: ['Бачковски манастир', 'Троянски манастир', 'Роженски манастир'], en: ['Bachkovo Monastery', 'Troyan Monastery', 'Rozhen Monastery'] },
  },
  // 02
  {
    question: { bg: 'Кой е този храм в София?', en: 'Which church in Sofia is this?' },
    answer: { bg: 'Храм-паметник „Св. Александър Невски“', en: 'Alexander Nevsky Cathedral' },
    accepts: { bg: ['Александър Невски', 'Катедрала Александър Невски', 'Храм Свети Александър Невски', 'Невски', 'Катедралата Невски'], en: ['St. Alexander Nevsky Cathedral', 'Alexander Nevsky', 'Nevsky Cathedral'] },
    wrong: { bg: ['Базилика „Света София“', 'Катедрала „Света Неделя“', 'Руската църква'], en: ['Hagia Sophia Basilica', 'St Nedelya Cathedral', 'Russian Church'] },
  },
  // 03
  {
    question: LANDMARK,
    answer: { bg: 'Мадарски конник', en: 'Madara Rider' },
    accepts: { bg: ['Мадарския конник', 'Мадарският конник', 'Конникът от Мадара'], en: ['Madara Horseman', 'The Madara Rider'] },
    wrong: { bg: ['Казанлъшка гробница', 'Плиска', 'Перперикон'], en: ['Thracian Tomb of Kazanlak', 'Pliska', 'Perperikon'] },
  },
  // 04
  {
    question: NATURE,
    answer: { bg: 'Белоградчишки скали', en: 'Belogradchik Rocks' },
    accepts: { bg: ['Белоградчишките скали', 'Скалите на Белоградчик', 'Белоградчишката крепост'], en: ['Belogradchik Rock Formations', 'Belogradchik Fortress'] },
    wrong: { bg: ['Мелнишки пирамиди', 'Побити камъни', 'Чудните мостове'], en: ['Melnik Earth Pyramids', 'Pobiti Kamani', 'Wonderful Bridges'] },
  },
  // 05
  {
    question: { bg: 'Кои са тези езера?', en: 'Which lakes are these?' },
    answer: { bg: 'Седемте рилски езера', en: 'Seven Rila Lakes' },
    accepts: { bg: ['Седемте езера', 'Рилските езера', '7 рилски езера', '7 езера'], en: ['The Seven Rila Lakes', '7 Rila Lakes', 'Rila Lakes'] },
    wrong: { bg: ['Смолянски езера', 'Попово езеро', 'Язовир Батак'], en: ['Smolyan Lakes', 'Popovo Lake', 'Batak Reservoir'] },
  },
  // 06
  {
    question: FORTRESS,
    answer: { bg: 'Царевец', en: 'Tsarevets' },
    accepts: { bg: ['Крепостта Царевец', 'Царевец Велико Търново', 'Хълмът Царевец'], en: ['Tsarevets Fortress'] },
    wrong: { bg: ['Баба Вида', 'Овеч', 'Асенова крепост'], en: ['Baba Vida', 'Ovech Fortress', "Asen's Fortress"] },
  },
  // 07
  {
    question: LANDMARK,
    answer: { bg: 'Античният театър в Пловдив', en: 'Ancient Theatre of Plovdiv' },
    accepts: { bg: ['Античен театър', 'Античния театър', 'Римски театър Пловдив', 'Пловдивски античен театър'], en: ['Roman Theatre of Plovdiv', 'Plovdiv Roman Theatre', 'Ancient Theatre'] },
    wrong: { bg: ['Римски стадион в Пловдив', 'Сердика', 'Нове'], en: ['Roman Stadium of Plovdiv', 'Serdica', 'Novae'] },
  },
  // 08
  {
    question: MONUMENT,
    answer: { bg: 'Паметникът на свободата (Шипка)', en: 'Shipka Monument' },
    accepts: { bg: ['Шипка', 'Паметникът на Шипка', 'Паметник на свободата', 'Връх Шипка'], en: ['Monument to Freedom', 'Shipka', 'Shipka Peak'] },
    wrong: { bg: ['Бузлуджа', 'Паметникът на Цар Освободител', 'Паметник „Альоша“'], en: ['Buzludzha', 'Monument to the Tsar Liberator', 'Alyosha Monument'] },
  },
  // 09
  {
    question: { bg: 'Кой е този град?', en: 'Which town is this?' },
    answer: { bg: 'Несебър', en: 'Nessebar' },
    accepts: { bg: ['Стария Несебър', 'Старият Несебър', 'Старият град на Несебър'], en: ['Old Nessebar', 'Nesebar', 'Ancient City of Nessebar'] },
    wrong: { bg: ['Созопол', 'Балчик', 'Поморие'], en: ['Sozopol', 'Balchik', 'Pomorie'] },
  },
  // 10
  {
    question: { bg: 'Кой е най-високият връх в България?', en: 'Which is the highest peak in Bulgaria?' },
    answer: { bg: 'Мусала', en: 'Musala' },
    accepts: { bg: ['Връх Мусала'], en: ['Musala Peak', 'Mount Musala'] },
    wrong: { bg: ['Вихрен', 'Ботев', 'Черни връх'], en: ['Vihren', 'Botev Peak', 'Cherni Vrah'] },
  },
  // 11
  {
    question: BRIDGE,
    answer: { bg: 'Дяволският мост', en: "Devil's Bridge" },
    accepts: { bg: ['Дяволски мост', 'Дяволския мост'], en: ['Devils Bridge', 'The Devil’s Bridge'] },
    wrong: { bg: ['Чудните мостове', 'Покритият мост в Ловеч', 'Мостът на Кольо Фичето в Бяла'], en: ['Wonderful Bridges', 'Covered Bridge, Lovech', "Kolyo Ficheto's Bridge, Byala"] },
  },
  // 12
  {
    question: NATURE,
    answer: { bg: 'Побитите камъни', en: 'Pobiti Kamani (Stone Forest)' },
    accepts: { bg: ['Побити камъни', 'Каменната гора'], en: ['Pobiti Kamani', 'Stone Forest', 'The Stone Desert'] },
    wrong: { bg: ['Белоградчишки скали', 'Мелнишки пирамиди', 'Каменните гъби'], en: ['Belogradchik Rocks', 'Melnik Earth Pyramids', 'Stone Mushrooms'] },
  },
  // 13
  {
    question: NATURE,
    answer: { bg: 'Мелнишките пирамиди', en: 'Melnik Earth Pyramids' },
    accepts: { bg: ['Мелнишки пирамиди', 'Пирамидите край Мелник', 'Мелник'], en: ['Melnik Pyramids', 'Melnik'] },
    wrong: { bg: ['Белоградчишки скали', 'Стобски пирамиди', 'Побити камъни'], en: ['Belogradchik Rocks', 'Stob Pyramids', 'Pobiti Kamani'] },
  },
  // 14
  {
    question: { bg: 'Коя е тази църква?', en: 'Which church is this?' },
    answer: { bg: 'Боянската църква', en: 'Boyana Church' },
    accepts: { bg: ['Боянска църква', 'Църквата в Бояна'], en: ['The Boyana Church'] },
    wrong: { bg: ['Ротонда „Св. Георги“', 'Земенски манастир', 'Църквата „Рождество Христово“ в Арбанаси'], en: ['Rotunda of St. George', 'Zemen Monastery', 'Church of the Nativity, Arbanasi'] },
  },
  // 15
  {
    question: { bg: 'Коя е тази сграда в София?', en: 'Which building in Sofia is this?' },
    answer: { bg: 'НДК (Национален дворец на културата)', en: 'NDK (National Palace of Culture)' },
    accepts: { bg: ['НДК', 'Национален дворец на културата', 'Националният дворец на културата'], en: ['NDK', 'National Palace of Culture'] },
    wrong: { bg: ['Народно събрание', 'Президентството', 'Централна минерална баня'], en: ['National Assembly', 'Presidency', 'Central Mineral Baths'] },
  },
  // 16
  {
    question: MONUMENT,
    answer: { bg: 'Паметникът на Цар Освободител', en: 'Monument to the Tsar Liberator' },
    accepts: { bg: ['Цар Освободител', 'Паметник на Цар Освободител', 'Александър Втори', 'Александър II'], en: ['Tsar Liberator Monument', 'Tsar Liberator', 'Alexander II'] },
    wrong: { bg: ['Паметникът на Васил Левски', 'Паметникът на Христо Ботев', 'Паметникът на свободата (Шипка)'], en: ['Vasil Levski Monument', 'Hristo Botev Monument', 'Shipka Monument'] },
  },
  // 17
  {
    question: { bg: 'Кой е този древен град?', en: 'Which ancient city is this?' },
    answer: { bg: 'Перперикон', en: 'Perperikon' },
    accepts: { bg: ['Скалният град Перперикон'], en: ['Perperikon rock city'] },
    wrong: { bg: ['Татул', 'Кабиле', 'Плиска'], en: ['Tatul', 'Kabile', 'Pliska'] },
  },
  // 18
  {
    question: MONUMENT,
    answer: { bg: 'Бузлуджа', en: 'Buzludzha' },
    accepts: { bg: ['Паметникът Бузлуджа', 'Връх Бузлуджа', 'Домът паметник на Бузлуджа'], en: ['Buzludzha Monument'] },
    wrong: { bg: ['Паметникът на свободата (Шипка)', 'Паметник „1300 години България“', 'Паметник „Альоша“'], en: ['Shipka Monument', '1300 Years of Bulgaria Monument', 'Alyosha Monument'] },
  },
  // 19
  {
    question: { bg: 'Коя е тази гробница?', en: 'Which tomb is this?' },
    answer: { bg: 'Казанлъшката гробница', en: 'Thracian Tomb of Kazanlak' },
    accepts: { bg: ['Казанлъшка гробница', 'Тракийска гробница Казанлък', 'Тракийската гробница в Казанлък'], en: ['Kazanlak Tomb'] },
    wrong: { bg: ['Свещарска гробница', 'Александровска гробница', 'Голяма Косматка'], en: ['Thracian Tomb of Sveshtari', 'Alexandrovo Tomb', 'Golyama Kosmatka'] },
  },
  // 20
  {
    question: PERSON,
    answer: { bg: 'Васил Левски', en: 'Vasil Levski' },
    accepts: { bg: ['Левски', 'Апостола', 'Апостолът на свободата', 'Васил Кунчев'], en: ['Levski', 'The Apostle of Freedom'] },
    wrong: { bg: ['Христо Ботев', 'Георги Раковски', 'Любен Каравелов'], en: ['Hristo Botev', 'Georgi Rakovski', 'Lyuben Karavelov'] },
  },
  // 21
  {
    question: PERSON,
    answer: { bg: 'Христо Ботев', en: 'Hristo Botev' },
    accepts: { bg: ['Ботев'], en: ['Botev', 'Christo Botev'] },
    wrong: { bg: ['Васил Левски', 'Иван Вазов', 'Христо Смирненски'], en: ['Vasil Levski', 'Ivan Vazov', 'Hristo Smirnenski'] },
  },
  // 22
  {
    question: { bg: 'Кои са тези двама братя?', en: 'Who are these two brothers?' },
    answer: { bg: 'Светите братя Кирил и Методий', en: 'Saints Cyril and Methodius' },
    accepts: { bg: ['Кирил и Методий', 'Методий и Кирил', 'Св. св. Кирил и Методий'], en: ['Cyril and Methodius', 'Methodius and Cyril'] },
    wrong: { bg: ['Климент и Наум', 'Борис и Симеон', 'Христо и Евлоги Георгиеви'], en: ['Clement and Naum', 'Boris and Simeon', 'Hristo and Evlogi Georgiev'] },
  },
  // 23
  {
    question: { bg: 'Кой хан основава България през 681 г.?', en: 'Which khan founded Bulgaria in 681?' },
    answer: { bg: 'Хан Аспарух', en: 'Khan Asparuh' },
    accepts: { bg: ['Аспарух'], en: ['Asparuh', 'Asparukh', 'Khan Asparukh'] },
    wrong: { bg: ['Хан Крум', 'Хан Кубрат', 'Хан Тервел'], en: ['Khan Krum', 'Khan Kubrat', 'Khan Tervel'] },
  },
  // 24
  {
    question: { bg: 'Как се казва този символ на пролетта?', en: 'What is this symbol of spring called?' },
    answer: { bg: 'Мартеница', en: 'Martenitsa' },
    accepts: { bg: ['Мартеници', 'Мартеницата', 'Мартенички'], en: ['Martenitsa', 'Martenitza', 'Martenitsi'] },
    wrong: { bg: ['Сурвачка', 'Писано яйце', 'Китка здравец'], en: ['Survachka', 'Painted egg', 'Bunch of geranium'] },
  },
  // 25
  {
    question: { bg: 'Как се казват тези маскирани хора?', en: 'What are these masked people called?' },
    answer: { bg: 'Кукери', en: 'Kukeri' },
    accepts: { bg: ['Кукерите', 'Кукер'], en: ['Kukeri', 'Kuker', 'Mummers'] },
    wrong: { bg: ['Нестинари', 'Лазарки', 'Коледари'], en: ['Nestinari (fire dancers)', 'Lazarki', 'Koledari (carol singers)'] },
  },
  // 26
  {
    question: { bg: 'Кое цвете е символ на България?', en: 'Which flower is a symbol of Bulgaria?' },
    answer: { bg: 'Розата (маслодайна роза)', en: 'The rose (Bulgarian oil rose)' },
    accepts: { bg: ['Роза', 'Розата', 'Маслодайна роза', 'Маслодайната роза', 'Българската роза', 'Рози'], en: ['Rose', 'Roses', 'Damask rose', 'Bulgarian rose'] },
    wrong: { bg: ['Лалето', 'Еделвайсът', 'Здравецът'], en: ['Tulip', 'Edelweiss', 'Geranium'] },
  },
  // 27
  {
    question: { bg: 'Какво животно има на герба на България?', en: "Which animal is on Bulgaria's coat of arms?" },
    answer: { bg: 'Лъв', en: 'Lion' },
    accepts: { bg: ['Лъвът', 'Лъвове', 'Златен лъв'], en: ['Lions', 'Golden lion', 'The lion'] },
    wrong: { bg: ['Орел', 'Мечка', 'Вълк'], en: ['Eagle', 'Bear', 'Wolf'] },
  },
];

// The site's base path ("/" on the live site); read safely because this file is
// also loaded by vite.config.ts, where import.meta.env does not exist.
const BASE: string = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

export const photoQuestions: PhotoQuestion[] = ENTRIES.map((entry, index) => {
  const number = String(index + 1).padStart(2, '0');
  return { id: `photo-${number}`, image: `${BASE}images/photo-quiz/${number}.jpg`, ...entry };
});

export const PHOTO_QUESTION_COUNT = photoQuestions.length;
