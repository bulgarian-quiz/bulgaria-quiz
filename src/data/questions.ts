export interface Question {
  question: { bg: string; en: string };
  options: { bg: string[]; en: string[] };
  correctIndex: number;
}

export interface RegionData {
  name: { bg: string; en: string };
  questions: Question[];
}

export const regionsData: Record<string, RegionData> = {
  blagoevgrad: {
    name: { bg: "Благоевград", en: "Blagoevgrad" },
    questions: [
      {
        question: { bg: "Коя е най-високата планина в областта?", en: "Which is the highest mountain in the region?" },
        options: { bg: ["Рила", "Пирин", "Родопи"], en: ["Rila", "Pirin", "Rhodopes"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Кой град е административен център на областта?", en: "Which city is the administrative center of the region?" },
        options: { bg: ["Банско", "Благоевград", "Сандански"], en: ["Bansko", "Blagoevgrad", "Sandanski"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кое е известно ски курортно селище в областта?", en: "Which is a famous ski resort in the region?" },
        options: { bg: ["Банско", "Боровец", "Пампорово"], en: ["Bansko", "Borovets", "Pamporovo"] },
        correctIndex: 0,
      },
    ],
  },
  burgas: {
    name: { bg: "Бургас", en: "Burgas" },
    questions: [
      {
        question: { bg: "Кое море граничи с област Бургас?", en: "Which sea borders the Burgas region?" },
        options: { bg: ["Егейско море", "Черно море", "Мраморно море"], en: ["Aegean Sea", "Black Sea", "Sea of Marmara"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой е най-големият остров в България, разположен в областта?", en: "Which is the largest island in Bulgaria, located in the region?" },
        options: { bg: ["Св. Анастасия", "Св. Иван", "Св. Кирик"], en: ["St. Anastasia", "St. Ivan", "St. Kirik"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой популярен курорт се намира в областта?", en: "Which popular resort is located in the region?" },
        options: { bg: ["Златни пясъци", "Слънчев бряг", "Албена"], en: ["Golden Sands", "Sunny Beach", "Albena"] },
        correctIndex: 1,
      },
    ],
  },
  varna: {
    name: { bg: "Варна", en: "Varna" },
    questions: [
      {
        question: { bg: "Как се нарича Варна?", en: "What is Varna called?" },
        options: { bg: ["Столицата на розите", "Морската столица", "Градът на тепетата"], en: ["The Rose Capital", "The Sea Capital", "The City of Hills"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой известен курорт се намира северно от Варна?", en: "Which famous resort is located north of Varna?" },
        options: { bg: ["Златни пясъци", "Слънчев бряг", "Приморско"], en: ["Golden Sands", "Sunny Beach", "Primorsko"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Какво древно съкровище е открито край Варна?", en: "What ancient treasure was discovered near Varna?" },
        options: { bg: ["Панагюрско съкровище", "Варненско златно съкровище", "Рогозенско съкровище"], en: ["Panagyurishte Treasure", "Varna Gold Treasure", "Rogozen Treasure"] },
        correctIndex: 1,
      },
    ],
  },
  velikoTarnovo: {
    name: { bg: "Велико Търново", en: "Veliko Tarnovo" },
    questions: [
      {
        question: { bg: "Коя крепост се намира във Велико Търново?", en: "Which fortress is located in Veliko Tarnovo?" },
        options: { bg: ["Царевец", "Баба Вида", "Белоградчишка крепост"], en: ["Tsarevets", "Baba Vida", "Belogradchik Fortress"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Столица на коя българска държава е бил градът?", en: "Capital of which Bulgarian state was the city?" },
        options: { bg: ["Първото българско царство", "Второто българско царство", "Третото българско царство"], en: ["First Bulgarian Empire", "Second Bulgarian Empire", "Third Bulgarian Empire"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Коя река минава през Велико Търново?", en: "Which river passes through Veliko Tarnovo?" },
        options: { bg: ["Дунав", "Марица", "Янтра"], en: ["Danube", "Maritsa", "Yantra"] },
        correctIndex: 2,
      },
    ],
  },
  vidin: {
    name: { bg: "Видин", en: "Vidin" },
    questions: [
      {
        question: { bg: "Коя средновековна крепост се намира във Видин?", en: "Which medieval fortress is located in Vidin?" },
        options: { bg: ["Царевец", "Баба Вида", "Червен"], en: ["Tsarevets", "Baba Vida", "Cherven"] },
        correctIndex: 1,
      },
      {
        question: { bg: "С коя държава граничи област Видин?", en: "Which country does Vidin region border?" },
        options: { bg: ["Румъния", "Сърбия", "И двете"], en: ["Romania", "Serbia", "Both"] },
        correctIndex: 2,
      },
      {
        question: { bg: "Коя река минава покрай Видин?", en: "Which river passes by Vidin?" },
        options: { bg: ["Дунав", "Марица", "Искър"], en: ["Danube", "Maritsa", "Iskar"] },
        correctIndex: 0,
      },
    ],
  },
  vratsa: {
    name: { bg: "Враца", en: "Vratsa" },
    questions: [
      {
        question: { bg: "Кой природен феномен се намира край Враца?", en: "Which natural phenomenon is located near Vratsa?" },
        options: { bg: ["Чудните мостове", "Врачански Балкан", "Белоградчишки скали"], en: ["Wonderful Bridges", "Vratsa Balkan", "Belogradchik Rocks"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Коя пещера се намира в областта?", en: "Which cave is located in the region?" },
        options: { bg: ["Леденика", "Магурата", "Снежанка"], en: ["Ledenika", "Magura", "Snezhanka"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Кой природен обект във Врачанския Балкан е известен като най-високия отвесен скален масив в България?", en: "Which natural site in Vratsa Balkan is known as the highest vertical rock massif in Bulgaria?" },
        options: { bg: ["Мадарският конник", "Вратцата", "Белоградчишките скали"], en: ["Madara Rider", "Vratsata", "Belogradchik Rocks"] },
        correctIndex: 1,
      },
    ],
  },
  gabrovo: {
    name: { bg: "Габрово", en: "Gabrovo" },
    questions: [
      {
        question: { bg: "С какво е известен Габрово?", en: "What is Gabrovo famous for?" },
        options: { bg: ["Розопроизводство", "Хумор и сатира", "Винопроизводство"], en: ["Rose production", "Humor and satire", "Wine production"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой архитектурно-етнографски комплекс се намира в областта?", en: "Which architectural-ethnographic complex is in the region?" },
        options: { bg: ["Етъра", "Копривщица", "Жеравна"], en: ["Etar", "Koprivshtitsa", "Zheravna"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Какъв музей има в Габрово?", en: "What kind of museum is in Gabrovo?" },
        options: { bg: ["Музей на виното", "Дом на хумора и сатирата", "Исторически музей"], en: ["Wine Museum", "House of Humor and Satire", "History Museum"] },
        correctIndex: 1,
      },
    ],
  },
  dobrich: {
    name: { bg: "Добрич", en: "Dobrich" },
    questions: [
      {
        question: { bg: "Кое от следните е скален нос и природна забележителност на Черно море в област Добрич?", en: "Which of the following is a rocky cape and natural landmark on the Black Sea in Dobrich region?" },
        options: { bg: ["Калиакра", "Златни пясъци", "Поморие"], en: ["Kaliakra", "Golden Sands", "Pomorie"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Коя равнина се намира в областта?", en: "Which plain is located in the region?" },
        options: { bg: ["Тракийска низина", "Добруджанска равнина", "Софийска котловина"], en: ["Thracian Plain", "Dobrudzha Plain", "Sofia Valley"] },
        correctIndex: 1,
      },
      {
        question: { bg: "С какво е известна Добруджа?", en: "What is Dobrudzha famous for?" },
        options: { bg: ["Планини", "Земеделие", "Минна индустрия"], en: ["Mountains", "Agriculture", "Mining Industry"] },
        correctIndex: 1,
      },
    ],
  },
  kardzhali: {
    name: { bg: "Кърджали", en: "Kardzhali" },
    questions: [
      {
        question: { bg: "В коя планина се намира по-голямата част от областта?", en: "In which mountain is most of the region located?" },
        options: { bg: ["Рила", "Родопи", "Пирин"], en: ["Rila", "Rhodopes", "Pirin"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой язовир се намира в областта?", en: "Which dam is located in the region?" },
        options: { bg: ["Искър", "Кърджали", "Батак"], en: ["Iskar", "Kardzhali", "Batak"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Какви скални образувания има в областта?", en: "What rock formations are in the region?" },
        options: { bg: ["Белоградчишки скали", "Каменни гъби", "Побити камъни"], en: ["Belogradchik Rocks", "Stone Mushrooms", "Stone Forest"] },
        correctIndex: 1,
      },
    ],
  },
  kyustendil: {
    name: { bg: "Кюстендил", en: "Kyustendil" },
    questions: [
      {
        question: { bg: "С какво е известен Кюстендил?", en: "What is Kyustendil famous for?" },
        options: { bg: ["Минерални извори", "Морски курорти", "Ски курорти"], en: ["Mineral springs", "Sea resorts", "Ski resorts"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Кой връх се намира в областта?", en: "Which peak is located in the region?" },
        options: { bg: ["Мусала", "Руен", "Ботев"], en: ["Musala", "Ruen", "Botev"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Какво производство е традиционно за региона?", en: "What production is traditional for the region?" },
        options: { bg: ["Риболов", "Овощарство", "Металургия"], en: ["Fishing", "Fruit growing", "Metallurgy"] },
        correctIndex: 1,
      },
    ],
  },
  lovech: {
    name: { bg: "Ловеч", en: "Lovech" },
    questions: [
      {
        question: { bg: "Какъв уникален мост има в Ловеч?", en: "What unique bridge is in Lovech?" },
        options: { bg: ["Каменен мост", "Покрит мост", "Въжен мост"], en: ["Stone bridge", "Covered bridge", "Rope bridge"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой национален герой е свързан с Ловеч?", en: "Which national hero is associated with Lovech?" },
        options: { bg: ["Христо Ботев", "Васил Левски", "Георги Раковски"], en: ["Hristo Botev", "Vasil Levski", "Georgi Rakovski"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Коя пещера се намира в областта?", en: "Which cave is located in the region?" },
        options: { bg: ["Деветашка пещера", "Леденика", "Магурата"], en: ["Devetashka Cave", "Ledenika", "Magura"] },
        correctIndex: 0,
      },
    ],
  },
  montana: {
    name: { bg: "Монтана", en: "Montana" },
    questions: [
      {
        question: { bg: "Какъв тип релеф преобладава там?", en: "What type of terrain predominates there?" },
        options: { bg: ["хълмове и предпланини", "тропични гори", "плажове"], en: ["hills and foothills", "tropical forests", "beaches"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Коя река минава през областта?", en: "Which river passes through the region?" },
        options: { bg: ["Огоста", "Марица", "Янтра"], en: ["Ogosta", "Maritsa", "Yantra"] },
        correctIndex: 0,
      },
      {
        question: { bg: "С коя държава граничи областта?", en: "Which country does the region border?" },
        options: { bg: ["Гърция", "Сърбия", "Сърбия и Румъния"], en: ["Greece", "Serbia", "Serbia and Romania"] },
        correctIndex: 2,
      },
    ],
  },
  pazardzhik: {
    name: { bg: "Пазарджик", en: "Pazardzhik" },
    questions: [
      {
        question: { bg: "Кой планински масив засяга част от територията на област Пазарджик?", en: "Which mountain range affects part of Pazardzhik region?" },
        options: { bg: ["Родопи", "Пирин", "Стара планина"], en: ["Rhodopes", "Pirin", "Balkan Mountains"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Кой спа курорт се намира в област Пазарджик?", en: "Which spa resort is in Pazardzhik region?" },
        options: { bg: ["Велинград", "Банско", "Златни пясъци"], en: ["Velingrad", "Bansko", "Golden Sands"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Какво древно съкровище е открито в областта?", en: "What ancient treasure was discovered in the region?" },
        options: { bg: ["Варненско съкровище", "Панагюрско съкровище", "Рогозенско съкровище"], en: ["Varna Treasure", "Panagyurishte Treasure", "Rogozen Treasure"] },
        correctIndex: 1,
      },
    ],
  },
  pernik: {
    name: { bg: "Перник", en: "Pernik" },
    questions: [
      {
        question: { bg: "С какъв фестивал е известен Перник?", en: "What festival is Pernik famous for?" },
        options: { bg: ["Фестивал на розата", "Сурва", "Празник на виното"], en: ["Rose Festival", "Surva", "Wine Festival"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Каква индустрия е била водеща в миналото?", en: "What industry was leading in the past?" },
        options: { bg: ["Текстилна", "Въгледобивна", "Хранителна"], en: ["Textile", "Coal mining", "Food"] },
        correctIndex: 1,
      },
      {
        question: { bg: "На какво разстояние е Перник от София?", en: "How far is Pernik from Sofia?" },
        options: { bg: ["Около 30 км", "Около 100 км", "Около 200 км"], en: ["About 30 km", "About 100 km", "About 200 km"] },
        correctIndex: 0,
      },
    ],
  },
  pleven: {
    name: { bg: "Плевен", en: "Pleven" },
    questions: [
      {
        question: { bg: "С коя война е свързан Плевен?", en: "Which war is Pleven associated with?" },
        options: { bg: ["Балканска война", "Руско-турска война 1877-78", "Първа световна война"], en: ["Balkan War", "Russo-Turkish War 1877-78", "World War I"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Какъв паметник има в Плевен?", en: "What monument is in Pleven?" },
        options: { bg: ["Паметник на свободата", "Панорама", "И двете"], en: ["Monument of Liberty", "Panorama", "Both"] },
        correctIndex: 2,
      },
      {
        question: { bg: "В коя част на България се намира Плевен?", en: "In which part of Bulgaria is Pleven?" },
        options: { bg: ["Южна", "Северна", "Западна"], en: ["Southern", "Northern", "Western"] },
        correctIndex: 1,
      },
    ],
  },
  plovdiv: {
    name: { bg: "Пловдив", en: "Plovdiv" },
    questions: [
      {
        question: { bg: "Колко тепета има Пловдив?", en: "How many hills does Plovdiv have?" },
        options: { bg: ["Пет", "Шест", "Седем"], en: ["Five", "Six", "Seven"] },
        correctIndex: 2,
      },
      {
        question: { bg: "Кое древно съоръжение се намира в центъра на Пловдив?", en: "What ancient structure is in the center of Plovdiv?" },
        options: { bg: ["Колизей", "Античен театър", "Пирамида"], en: ["Colosseum", "Ancient Theater", "Pyramid"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Европейска столица на културата коя година беше Пловдив?", en: "In which year was Plovdiv European Capital of Culture?" },
        options: { bg: ["2017", "2019", "2021"], en: ["2017", "2019", "2021"] },
        correctIndex: 1,
      },
    ],
  },
  razgrad: {
    name: { bg: "Разград", en: "Razgrad" },
    questions: [
      {
        question: { bg: "Кой римски град се е намирал на мястото на Разград?", en: "Which Roman city was located at Razgrad?" },
        options: { bg: ["Сердика", "Абритус", "Филипопол"], en: ["Serdica", "Abritus", "Philippopolis"] },
        correctIndex: 1,
      },
      {
        question: { bg: "В коя част на България се намира Разград?", en: "In which part of Bulgaria is Razgrad?" },
        options: { bg: ["Североизточна", "Югозападна", "Южна"], en: ["Northeastern", "Southwestern", "Southern"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Какъв тип релеф преобладава в областта?", en: "What type of terrain predominates in the region?" },
        options: { bg: ["Планински", "Равнинен", "Крайморски"], en: ["Mountainous", "Plain", "Coastal"] },
        correctIndex: 1,
      },
    ],
  },
  ruse: {
    name: { bg: "Русе", en: "Ruse" },
    questions: [
      {
        question: { bg: "На коя река се намира Русе?", en: "On which river is Ruse located?" },
        options: { bg: ["Марица", "Дунав", "Янтра"], en: ["Maritsa", "Danube", "Yantra"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Как наричат Русе заради архитектурата?", en: "What is Ruse called because of its architecture?" },
        options: { bg: ["Малката София", "Малката Виена", "Малкият Париж"], en: ["Little Sofia", "Little Vienna", "Little Paris"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой мост свързва Русе с Румъния?", en: "Which bridge connects Ruse with Romania?" },
        options: { bg: ["Мост на дружбата", "Дунав мост 2", "И двата"], en: ["Friendship Bridge", "Danube Bridge 2", "Both"] },
        correctIndex: 2,
      },
    ],
  },
  silistra: {
    name: { bg: "Силистра", en: "Silistra" },
    questions: [
      {
        question: { bg: "На коя река се намира Силистра?", en: "On which river is Silistra located?" },
        options: { bg: ["Искър", "Дунав", "Марица"], en: ["Iskar", "Danube", "Maritsa"] },
        correctIndex: 1,
      },
      {
        question: { bg: "С коя държава граничи областта?", en: "Which country does the region border?" },
        options: { bg: ["Сърбия", "Румъния", "Гърция"], en: ["Serbia", "Romania", "Greece"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Коя важна природна зона в област Силистра е част от защитените територии по Дунав и е известна с богатото си разнообразие от птици?", en: "Which important natural area in Silistra region is part of the protected Danube territories and is known for its rich bird diversity?" },
        options: { bg: ["Сребърна", "Ропотамо", "Камчия"], en: ["Srebarna", "Ropotamo", "Kamchia"] },
        correctIndex: 0,
      },
    ],
  },
  sliven: {
    name: { bg: "Сливен", en: "Sliven" },
    questions: [
      {
        question: { bg: "Коя синя скална формация се намира край Сливен?", en: "Which blue rock formation is located near Sliven?" },
        options: { bg: ["Белоградчишки скали", "Сините камъни", "Побити камъни"], en: ["Belogradchik Rocks", "Blue Stones", "Stone Forest"] },
        correctIndex: 1,
      },
      {
        question: { bg: "С какво е известен Сливен исторически?", en: "What is Sliven historically famous for?" },
        options: { bg: ["Хайдути", "Корабоплаване", "Минно дело"], en: ["Haiduks", "Shipping", "Mining"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Коя българска поетеса е родена в Сливен?", en: "Which Bulgarian poetess was born in Sliven?" },
        options: { bg: ["Елисавета Багряна", "Дора Габе", "Мара Белчева"], en: ["Elisaveta Bagryana", "Dora Gabe", "Mara Belcheva"] },
        correctIndex: 0,
      },
    ],
  },
  smolyan: {
    name: { bg: "Смолян", en: "Smolyan" },
    questions: [
      {
        question: { bg: "В коя планина се намира Смолян?", en: "In which mountain is Smolyan located?" },
        options: { bg: ["Рила", "Пирин", "Родопи"], en: ["Rila", "Pirin", "Rhodopes"] },
        correctIndex: 2,
      },
      {
        question: { bg: "Кой ски курорт се намира в областта?", en: "Which ski resort is in the region?" },
        options: { bg: ["Банско", "Боровец", "Пампорово"], en: ["Bansko", "Borovets", "Pamporovo"] },
        correctIndex: 2,
      },
      {
        question: { bg: "Какво може да се види в Смолян?", en: "What can be seen in Smolyan?" },
        options: { bg: ["Гейзери", "Чудни мостове", "Вулкани"], en: ["Geysers", "Wonderful Bridges", "Volcanoes"] },
        correctIndex: 1,
      },
    ],
  },
  sofiaCity: {
    name: { bg: "София (столица)", en: "Sofia (capital)" },
    questions: [
      {
        question: { bg: "Кой е символът на София?", en: "What is the symbol of Sofia?" },
        options: { bg: ["Статуята на света София", "Александър Невски", "Националния дворец на културата"], en: ["Statue of Saint Sofia", "Alexander Nevsky", "National Palace of Culture"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Коя планина е над София?", en: "Which mountain is above Sofia?" },
        options: { bg: ["Рила", "Витоша", "Пирин"], en: ["Rila", "Vitosha", "Pirin"] },
        correctIndex: 1,
      },
      {
        question: { bg: "От коя година София е столица на България?", en: "Since which year is Sofia the capital of Bulgaria?" },
        options: { bg: ["1879", "1878", "1885"], en: ["1879", "1878", "1885"] },
        correctIndex: 0,
      },
    ],
  },
  sofiaProvince: {
    name: { bg: "Софийска област", en: "Sofia Province" },
    questions: [
      {
        question: { bg: "Кой е най-високият връх в София-област?", en: "Which is the highest peak in Sofia Province?" },
        options: { bg: ["Черни връх", "Мусала", "Мургаш"], en: ["Cherni Vrah", "Musala", "Murgash"] },
        correctIndex: 2,
      },
      {
        question: { bg: "Кой град е административен център на София-област?", en: "Which city is the administrative center of Sofia Province?" },
        options: { bg: ["Ботевград", "София", "Елин Пелин"], en: ["Botevgrad", "Sofia", "Elin Pelin"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Коя известна природна забележителност се намира в София-област?", en: "Which famous natural landmark is in Sofia Province?" },
        options: { bg: ["Седемте рилски езера", "Искърското дефиле", "Белоградчишки скали"], en: ["Seven Rila Lakes", "Iskar Gorge", "Belogradchik Rocks"] },
        correctIndex: 1,
      },
    ],
  },
  staraZagora: {
    name: { bg: "Стара Загора", en: "Stara Zagora" },
    questions: [
      {
        question: { bg: "Как е известен градът?", en: "What is the city known as?" },
        options: { bg: ["Градът на липите", "Градът на тепетата", "Морската столица"], en: ["City of Lindens", "City of Hills", "Sea Capital"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Какво древно жилище е открито край града?", en: "What ancient dwelling was discovered near the city?" },
        options: { bg: ["Римска вила", "Неолитни жилища", "Тракийска гробница"], en: ["Roman villa", "Neolithic dwellings", "Thracian tomb"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой известен български поет е роден в областта?", en: "Which famous Bulgarian poet was born in the region?" },
        options: { bg: ["Иван Вазов", "Христо Ботев", "Пейо Яворов"], en: ["Ivan Vazov", "Hristo Botev", "Peyo Yavorov"] },
        correctIndex: 2,
      },
    ],
  },
  targovishte: {
    name: { bg: "Търговище", en: "Targovishte" },
    questions: [
      {
        question: { bg: "Какво означава името на града?", en: "What does the city name mean?" },
        options: { bg: ["Търговски център", "Крепост", "Река"], en: ["Trade center", "Fortress", "River"] },
        correctIndex: 0,
      },
      {
        question: { bg: "В коя част на България се намира?", en: "In which part of Bulgaria is it located?" },
        options: { bg: ["Югозападна", "Североизточна", "Южна централна"], en: ["Southwestern", "Northeastern", "South Central"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Какъв тип терен преобладава?", en: "What type of terrain predominates?" },
        options: { bg: ["Планински", "Хълмист и равнинен", "Крайморски"], en: ["Mountainous", "Hilly and plain", "Coastal"] },
        correctIndex: 1,
      },
    ],
  },
  haskovo: {
    name: { bg: "Хасково", en: "Haskovo" },
    questions: [
      {
        question: { bg: "Какъв паметник има в Хасково?", en: "What monument is in Haskovo?" },
        options: { bg: ["Паметник на свободата", "Монумент на Дева Мария", "Паметник на Левски"], en: ["Monument of Liberty", "Monument of Virgin Mary", "Levski Monument"] },
        correctIndex: 1,
      },
      {
        question: { bg: "С коя държава граничи областта?", en: "Which country does the region border?" },
        options: { bg: ["Румъния", "Гърция и Турция", "Сърбия"], en: ["Romania", "Greece and Turkey", "Serbia"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Кой античен град се намира в областта?", en: "Which ancient city is in the region?" },
        options: { bg: ["Сердика", "Перперикон", "Абритус"], en: ["Serdica", "Perperikon", "Abritus"] },
        correctIndex: 1,
      },
    ],
  },
  shumen: {
    name: { bg: "Шумен", en: "Shumen" },
    questions: [
      {
        question: { bg: "Какъв паметник има край Шумен?", en: "What monument is near Shumen?" },
        options: { bg: ["Паметник на свободата", "Създатели на българската държава", "Монумент на Дева Мария"], en: ["Monument of Liberty", "Creators of the Bulgarian State", "Monument of Virgin Mary"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Коя старобългарска столица се намира в областта?", en: "Which old Bulgarian capital is in the region?" },
        options: { bg: ["Плиска и Преслав", "Търново", "Охрид"], en: ["Pliska and Preslav", "Tarnovo", "Ohrid"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Какви скални образувания има край Шумен?", en: "What rock formations are near Shumen?" },
        options: { bg: ["Белоградчишки скали", "Побити камъни", "Чудни мостове"], en: ["Belogradchik Rocks", "Stone Forest", "Wonderful Bridges"] },
        correctIndex: 1,
      },
    ],
  },
  yambol: {
    name: { bg: "Ямбол", en: "Yambol" },
    questions: [
      {
        question: { bg: "Кой природен резерват се намира в Ямболска област?", en: "Which nature reserve is in Yambol region?" },
        options: { bg: ["Балабанова кория", "Сребърна", "Узунбуджак"], en: ["Balabanova Koriya", "Srebarna", "Uzunbudzhak"] },
        correctIndex: 0,
      },
      {
        question: { bg: "Коя река минава през Ямбол?", en: "Which river passes through Yambol?" },
        options: { bg: ["Марица", "Тунджа", "Янтра"], en: ["Maritsa", "Tundzha", "Yantra"] },
        correctIndex: 1,
      },
      {
        question: { bg: "Какво е характерно за част от територията на Ямболска област?", en: "What is characteristic of part of Yambol region?" },
        options: { bg: ["поляни, река Тунджа и земеделие", "високи алпийски върхове", "коралови рифове"], en: ["meadows, Tundzha river and agriculture", "high alpine peaks", "coral reefs"] },
        correctIndex: 0,
      },
    ],
  },
};
