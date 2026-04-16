// src/types.ts
var SUPPORTED_LANGUAGES = ["original", "de", "en", "it", "fr", "es"];
var ORIGINAL_LANGUAGES = [
  "de",
  // German
  "en",
  // English
  "fr",
  // French
  "es",
  // Spanish
  "it",
  // Italian
  "la",
  // Latin
  "el",
  // Greek (ancient & modern)
  "zh",
  // Chinese
  "sa",
  // Sanskrit
  "ar",
  // Arabic
  "fa",
  // Persian
  "ja",
  // Japanese
  "ru",
  // Russian
  "pt",
  // Portuguese
  "nl",
  // Dutch
  "da",
  // Danish
  "hi",
  // Hindi
  "bn"
  // Bengali
];

// src/quotes.ts
var QUOTES = [
  // ============================================
  // MOTIVATION
  // ============================================
  {
    id: "mot-1",
    text: {
      original: "The only way to do great work is to love what you do.",
      de: "Der einzige Weg, gro\xDFartige Arbeit zu leisten, ist zu lieben, was man tut.",
      en: "The only way to do great work is to love what you do.",
      it: "L'unico modo per fare un ottimo lavoro \xE8 amare quello che fai.",
      fr: "La seule fa\xE7on de faire du bon travail est d'aimer ce que vous faites.",
      es: "La \xFAnica forma de hacer un gran trabajo es amar lo que haces."
    },
    author: "Steve Jobs",
    category: "motivation",
    originalLanguage: "en",
    source: "Stanford Commencement Speech",
    year: 2005,
    tags: ["arbeit", "leidenschaft", "erfolg"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Unternehmer (1955-2011), Mitgr\xFCnder von Apple Inc.",
      en: "American entrepreneur (1955-2011), co-founder of Apple Inc."
    }
  },
  {
    id: "mot-2",
    text: {
      original: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      de: "Erfolg ist nicht endg\xFCltig, Misserfolg ist nicht fatal: Was z\xE4hlt, ist der Mut weiterzumachen.",
      en: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      it: "Il successo non \xE8 definitivo, il fallimento non \xE8 fatale: ci\xF2 che conta \xE8 il coraggio di continuare.",
      fr: "Le succ\xE8s n'est pas d\xE9finitif, l'\xE9chec n'est pas fatal : c'est le courage de continuer qui compte.",
      es: "El \xE9xito no es definitivo, el fracaso no es fatal: lo que cuenta es el coraje de continuar."
    },
    author: "Winston Churchill",
    category: "motivation",
    originalLanguage: "en",
    source: "Zugeschrieben",
    year: 1941,
    tags: ["erfolg", "misserfolg", "mut", "durchhalteverm\xF6gen"],
    verified: true,
    authorBio: {
      de: "Britischer Staatsmann (1874-1965), Premierminister w\xE4hrend des Zweiten Weltkriegs.",
      en: "British statesman (1874-1965), Prime Minister during World War II."
    }
  },
  {
    id: "mot-3",
    text: {
      original: "The future belongs to those who believe in the beauty of their dreams.",
      de: "Die Zukunft geh\xF6rt denen, die an die Sch\xF6nheit ihrer Tr\xE4ume glauben.",
      en: "The future belongs to those who believe in the beauty of their dreams.",
      it: "Il futuro appartiene a coloro che credono nella bellezza dei propri sogni.",
      fr: "L'avenir appartient \xE0 ceux qui croient en la beaut\xE9 de leurs r\xEAves.",
      es: "El futuro pertenece a quienes creen en la belleza de sus sue\xF1os."
    },
    author: "Eleanor Roosevelt",
    category: "motivation",
    originalLanguage: "en",
    year: 1961,
    tags: ["zukunft", "tr\xE4ume", "glaube"],
    verified: true,
    authorBio: {
      de: "US-amerikanische Menschenrechtsaktivistin (1884-1962), First Lady der USA.",
      en: "American human rights activist (1884-1962), First Lady of the United States."
    }
  },
  {
    id: "mot-4",
    text: {
      original: "It's never too late to be what you might have been.",
      de: "Es ist nie zu sp\xE4t, das zu werden, was man h\xE4tte sein k\xF6nnen.",
      en: "It's never too late to be what you might have been.",
      it: "Non \xE8 mai troppo tardi per essere ci\xF2 che avresti potuto essere.",
      fr: "Il n'est jamais trop tard pour \xEAtre ce que vous auriez pu \xEAtre.",
      es: "Nunca es demasiado tarde para ser lo que podr\xEDas haber sido."
    },
    author: "George Eliot",
    category: "motivation",
    originalLanguage: "en",
    year: 1870,
    tags: ["ver\xE4nderung", "potenzial", "neuanfang"],
    verified: true,
    authorBio: {
      de: "Englische Schriftstellerin (1819-1880), b\xFCrgerlicher Name Mary Ann Evans.",
      en: "English novelist (1819-1880), pen name of Mary Ann Evans."
    }
  },
  {
    id: "mot-5",
    text: {
      original: "Give every day the chance to become the most beautiful day of your life.",
      de: "Gib jedem Tag die Chance, der sch\xF6nste deines Lebens zu werden.",
      en: "Give every day the chance to become the most beautiful day of your life.",
      it: "Dai a ogni giorno la possibilit\xE0 di diventare il pi\xF9 bello della tua vita.",
      fr: "Donne \xE0 chaque jour la chance de devenir le plus beau jour de ta vie.",
      es: "Dale a cada d\xEDa la oportunidad de convertirse en el m\xE1s hermoso de tu vida."
    },
    author: "Mark Twain",
    category: "motivation",
    originalLanguage: "en",
    year: 1890,
    tags: ["tag", "leben", "optimismus"],
    verified: false,
    authorBio: {
      de: "US-amerikanischer Schriftsteller (1835-1910), bekannt f\xFCr Tom Sawyer und Huckleberry Finn.",
      en: "American writer (1835-1910), known for Tom Sawyer and Huckleberry Finn."
    }
  },
  {
    id: "mot-6",
    text: {
      original: "\u1F08\u03C1\u03C7\u1F74 \u1F25\u03BC\u03B9\u03C3\u03C5 \u03C0\u03B1\u03BD\u03C4\u03CC\u03C2.",
      de: "Der Anfang ist die H\xE4lfte des Ganzen.",
      en: "The beginning is half of the whole.",
      it: "L'inizio \xE8 la met\xE0 del tutto.",
      fr: "Le commencement est la moiti\xE9 du tout.",
      es: "El comienzo es la mitad del todo."
    },
    author: "Aristoteles",
    category: "motivation",
    originalLanguage: "el",
    source: "Politik",
    year: -350,
    tags: ["anfang", "handeln", "philosophie"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph (384-322 v. Chr.), Universalgelehrter der Antike.",
      en: "Ancient Greek philosopher (384-322 BC), polymath of antiquity."
    }
  },
  {
    id: "mot-7",
    text: {
      original: "Do something today that your future self will thank you for.",
      de: "Tue heute etwas, wof\xFCr dein zuk\xFCnftiges Ich dir danken wird.",
      en: "Do something today that your future self will thank you for.",
      it: "Fai qualcosa oggi di cui il tuo futuro io ti ringrazier\xE0.",
      fr: "Fais quelque chose aujourd'hui dont ton futur toi te remerciera.",
      es: "Haz algo hoy por lo que tu yo futuro te lo agradecer\xE1."
    },
    author: "Sean Patrick Flanery",
    category: "motivation",
    originalLanguage: "en",
    year: 2012,
    tags: ["zukunft", "handeln", "selbstverbesserung"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Schauspieler (*1965), bekannt aus The Boondock Saints.",
      en: "American actor (*1965), known for The Boondock Saints."
    }
  },
  {
    id: "mot-8",
    text: {
      original: "\u79CD\u4E00\u68F5\u6811\u6700\u597D\u7684\u65F6\u95F4\u662F\u4E8C\u5341\u5E74\u524D\uFF0C\u5176\u6B21\u662F\u73B0\u5728\u3002",
      de: "Der beste Zeitpunkt einen Baum zu pflanzen war vor 20 Jahren. Der zweitbeste ist jetzt.",
      en: "The best time to plant a tree was 20 years ago. The second best time is now.",
      it: "Il momento migliore per piantare un albero era 20 anni fa. Il secondo momento migliore \xE8 adesso.",
      fr: "Le meilleur moment pour planter un arbre \xE9tait il y a 20 ans. Le deuxi\xE8me meilleur moment est maintenant.",
      es: "El mejor momento para plantar un \xE1rbol fue hace 20 a\xF1os. El segundo mejor momento es ahora."
    },
    author: "Chinesisches Sprichwort",
    category: "motivation",
    originalLanguage: "zh",
    tags: ["handeln", "zeit", "anfang"],
    verified: true
  },
  // ============================================
  // WEISHEIT
  // ============================================
  {
    id: "weis-1",
    text: {
      original: "\u9053\u53EF\u9053\uFF0C\u975E\u5E38\u9053\u3002",
      de: "Der Weg, der sich aussprechen l\xE4sst, ist nicht der ewige Weg.",
      en: "The way that can be spoken of is not the eternal way.",
      it: "La via che pu\xF2 essere espressa non \xE8 la via eterna.",
      fr: "La voie qui peut \xEAtre exprim\xE9e par la parole n'est pas la Voie \xE9ternelle.",
      es: "El camino que puede expresarse no es el camino eterno."
    },
    author: "Laozi",
    category: "weisheit",
    originalLanguage: "zh",
    source: "Tao Te King, Kapitel 1",
    year: -600,
    tags: ["weg", "tao", "philosophie"],
    verified: true,
    authorBio: {
      de: "Chinesischer Philosoph (6. Jh. v. Chr.), Begr\xFCnder des Taoismus.",
      en: "Chinese philosopher (6th century BC), founder of Taoism."
    }
  },
  {
    id: "weis-2",
    text: {
      original: "Wer k\xE4mpft, kann verlieren. Wer nicht k\xE4mpft, hat schon verloren.",
      de: "Wer k\xE4mpft, kann verlieren. Wer nicht k\xE4mpft, hat schon verloren.",
      en: "He who fights may lose. He who does not fight has already lost.",
      it: "Chi lotta pu\xF2 perdere. Chi non lotta ha gi\xE0 perso.",
      fr: "Qui se bat peut perdre. Qui ne se bat pas a d\xE9j\xE0 perdu.",
      es: "Quien lucha puede perder. Quien no lucha ya ha perdido."
    },
    author: "Bertolt Brecht",
    category: "weisheit",
    originalLanguage: "de",
    source: "Die Mutter",
    year: 1932,
    tags: ["kampf", "mut", "handeln"],
    verified: true,
    authorBio: {
      de: "Deutscher Dramatiker und Lyriker (1898-1956), Begr\xFCnder des epischen Theaters.",
      en: "German playwright and poet (1898-1956), founder of epic theatre."
    }
  },
  {
    id: "weis-3",
    text: {
      original: "On ne voit bien qu'avec le c\u0153ur. L'essentiel est invisible pour les yeux.",
      de: "Man sieht nur mit dem Herzen gut. Das Wesentliche ist f\xFCr die Augen unsichtbar.",
      en: "One sees clearly only with the heart. The essential is invisible to the eyes.",
      it: "Si vede bene solo con il cuore. L'essenziale \xE8 invisibile agli occhi.",
      fr: "On ne voit bien qu'avec le c\u0153ur. L'essentiel est invisible pour les yeux.",
      es: "Solo se ve bien con el coraz\xF3n. Lo esencial es invisible a los ojos."
    },
    author: "Antoine de Saint-Exup\xE9ry",
    category: "weisheit",
    originalLanguage: "fr",
    source: "Der kleine Prinz (Le Petit Prince)",
    year: 1943,
    tags: ["herz", "sehen", "wesentlich"],
    verified: true,
    authorBio: {
      de: 'Franz\xF6sischer Schriftsteller und Pilot (1900-1944), Autor von "Der kleine Prinz".',
      en: 'French writer and aviator (1900-1944), author of "The Little Prince".'
    }
  },
  {
    id: "weis-4",
    text: {
      original: "Non quia difficilia sunt non audemus, sed quia non audemus difficilia sunt.",
      de: "Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.",
      en: "It is not because things are difficult that we do not dare, but because we do not dare that things are difficult.",
      it: "Non \xE8 perch\xE9 le cose sono difficili che non osiamo, ma perch\xE9 non osiamo che sono difficili.",
      fr: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.",
      es: "No es porque las cosas sean dif\xEDciles que no nos atrevemos, sino porque no nos atrevemos que son dif\xEDciles."
    },
    author: "Seneca",
    category: "weisheit",
    originalLanguage: "la",
    source: "Epistulae morales ad Lucilium, Brief 104",
    year: 65,
    tags: ["mut", "wagnis", "schwierigkeit"],
    verified: true,
    authorBio: {
      de: "R\xF6mischer Philosoph und Staatsmann (ca. 4 v. Chr. - 65 n. Chr.).",
      en: "Roman philosopher and statesman (c. 4 BC - 65 AD)."
    }
  },
  {
    id: "weis-5",
    text: {
      original: "Scientia potentia est.",
      de: "Wissen ist Macht.",
      en: "Knowledge is power.",
      it: "La conoscenza \xE8 potere.",
      fr: "Le savoir est le pouvoir.",
      es: "El conocimiento es poder."
    },
    author: "Francis Bacon",
    category: "weisheit",
    originalLanguage: "la",
    source: "Meditationes Sacrae",
    year: 1597,
    tags: ["wissen", "macht", "bildung"],
    verified: true,
    authorBio: {
      de: "Englischer Philosoph und Staatsmann (1561-1626), Begr\xFCnder des Empirismus.",
      en: "English philosopher and statesman (1561-1626), founder of empiricism."
    }
  },
  {
    id: "weis-6",
    text: {
      original: "\u1F13\u03BD \u03BF\u1F36\u03B4\u03B1 \u1F45\u03C4\u03B9 \u03BF\u1F50\u03B4\u1F72\u03BD \u03BF\u1F36\u03B4\u03B1.",
      de: "Ich wei\xDF, dass ich nichts wei\xDF.",
      en: "I know that I know nothing.",
      it: "So di non sapere.",
      fr: "Je sais que je ne sais rien.",
      es: "Solo s\xE9 que no s\xE9 nada."
    },
    author: "Sokrates",
    category: "weisheit",
    originalLanguage: "el",
    source: "\xDCberliefert durch Platon, Apologie des Sokrates",
    year: -399,
    tags: ["wissen", "demut", "philosophie"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph (469-399 v. Chr.), Begr\xFCnder der abendl\xE4ndischen Philosophie.",
      en: "Greek philosopher (469-399 BC), founder of Western philosophy."
    }
  },
  {
    id: "weis-7",
    text: {
      original: "\u03C4\u1F70 \u03C0\u03AC\u03BD\u03C4\u03B1 \u1FE5\u03B5\u1FD6.",
      de: "Alles flie\xDFt.",
      en: "Everything flows.",
      it: "Tutto scorre.",
      fr: "Tout coule.",
      es: "Todo fluye."
    },
    author: "Heraklit",
    category: "weisheit",
    originalLanguage: "el",
    source: "Fragmente",
    year: -500,
    tags: ["ver\xE4nderung", "leben", "philosophie"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph aus Ephesos (ca. 535-475 v. Chr.).",
      en: "Greek philosopher from Ephesus (c. 535-475 BC)."
    }
  },
  {
    id: "weis-8",
    text: {
      original: "Handle nur nach derjenigen Maxime, durch die du zugleich wollen kannst, dass sie ein allgemeines Gesetz werde.",
      de: "Handle nur nach derjenigen Maxime, durch die du zugleich wollen kannst, dass sie ein allgemeines Gesetz werde.",
      en: "Act only according to that maxim by which you can at the same time will that it should become a universal law.",
      it: "Agisci solo secondo quella massima che puoi al contempo volere che diventi una legge universale.",
      fr: "Agis seulement selon la maxime gr\xE2ce \xE0 laquelle tu peux vouloir en m\xEAme temps qu'elle devienne une loi universelle.",
      es: "Obra solo seg\xFAn aquella m\xE1xima por la cual puedas querer que al mismo tiempo se convierta en ley universal."
    },
    author: "Immanuel Kant",
    category: "weisheit",
    originalLanguage: "de",
    source: "Grundlegung zur Metaphysik der Sitten",
    year: 1785,
    tags: ["ethik", "moral", "philosophie", "kategorischer imperativ"],
    verified: true,
    authorBio: {
      de: "Deutscher Philosoph der Aufkl\xE4rung (1724-1804).",
      en: "German philosopher of the Enlightenment (1724-1804)."
    }
  },
  {
    id: "weis-9",
    text: {
      original: "\u5DF1\u6240\u4E0D\u6B32\uFF0C\u52FF\u65BD\u65BC\u4EBA\u3002",
      de: "Was du nicht willst, dass man dir tu, das f\xFCg auch keinem anderen zu.",
      en: "Do not do to others what you do not want done to yourself.",
      it: "Non fare agli altri ci\xF2 che non vorresti fosse fatto a te.",
      fr: "Ne fais pas aux autres ce que tu ne voudrais pas qu'on te fasse.",
      es: "No hagas a otros lo que no quieras que te hagan a ti."
    },
    author: "Konfuzius",
    category: "weisheit",
    originalLanguage: "zh",
    source: "Analekten (Lunyu), Kapitel 15",
    year: -500,
    tags: ["ethik", "goldene regel", "philosophie"],
    verified: true,
    authorBio: {
      de: "Chinesischer Philosoph (551-479 v. Chr.), Begr\xFCnder des Konfuzianismus.",
      en: "Chinese philosopher (551-479 BC), founder of Confucianism."
    }
  },
  // ============================================
  // LIEBE
  // ============================================
  {
    id: "liebe-1",
    text: {
      original: "Where there is love there is life.",
      de: "Wo Liebe ist, da ist auch Leben.",
      en: "Where there is love there is life.",
      it: "Dove c'\xE8 amore c'\xE8 vita.",
      fr: "L\xE0 o\xF9 il y a de l'amour, il y a de la vie.",
      es: "Donde hay amor hay vida."
    },
    author: "Mahatma Gandhi",
    category: "liebe",
    originalLanguage: "en",
    year: 1925,
    tags: ["liebe", "leben"],
    verified: true,
    authorBio: {
      de: "Indischer Unabh\xE4ngigkeitsk\xE4mpfer und geistiger F\xFChrer (1869-1948).",
      en: "Indian independence activist and spiritual leader (1869-1948)."
    }
  },
  {
    id: "liebe-2",
    text: {
      original: "Die Liebe allein versteht das Geheimnis, andere zu beschenken und dabei selbst reich zu werden.",
      de: "Die Liebe allein versteht das Geheimnis, andere zu beschenken und dabei selbst reich zu werden.",
      en: "Love alone understands the secret of giving to others and becoming rich oneself.",
      it: "Solo l'amore comprende il segreto di donare agli altri e arricchirsi.",
      fr: "Seul l'amour comprend le secret d'offrir aux autres et de s'enrichir soi-m\xEAme.",
      es: "Solo el amor entiende el secreto de dar a los dem\xE1s y enriquecerse uno mismo."
    },
    author: "Clemens Brentano",
    category: "liebe",
    originalLanguage: "de",
    year: 1810,
    tags: ["liebe", "geben", "reichtum"],
    verified: true,
    authorBio: {
      de: "Deutscher Dichter der Romantik (1778-1842).",
      en: "German poet of the Romantic era (1778-1842)."
    }
  },
  {
    id: "liebe-3",
    text: {
      original: "Il n'y a qu'un bonheur dans la vie, c'est d'aimer et d'\xEAtre aim\xE9.",
      de: "Es gibt nur ein Gl\xFCck in diesem Leben: zu lieben und geliebt zu werden.",
      en: "There is only one happiness in this life: to love and be loved.",
      it: "C'\xE8 solo una felicit\xE0 nella vita: amare ed essere amati.",
      fr: "Il n'y a qu'un bonheur dans la vie, c'est d'aimer et d'\xEAtre aim\xE9.",
      es: "Solo hay una felicidad en la vida: amar y ser amado."
    },
    author: "George Sand",
    category: "liebe",
    originalLanguage: "fr",
    source: "Brief an Lina Calamatta",
    year: 1862,
    tags: ["liebe", "gl\xFCck"],
    verified: true,
    authorBio: {
      de: "Franz\xF6sische Schriftstellerin der Romantik (1804-1876), b\xFCrgerlicher Name Amantine Aurore Dupin.",
      en: "French Romantic era novelist (1804-1876), born Amantine Aurore Dupin."
    }
  },
  {
    id: "liebe-4",
    text: {
      original: "Liebe ist das einzige, was w\xE4chst, wenn wir es verschwenden.",
      de: "Liebe ist das einzige, was w\xE4chst, wenn wir es verschwenden.",
      en: "Love is the only thing that grows when we waste it.",
      it: "L'amore \xE8 l'unica cosa che cresce quando la sprechiamo.",
      fr: "L'amour est la seule chose qui grandit quand on la gaspille.",
      es: "El amor es lo \xFAnico que crece cuando lo derrochamos."
    },
    author: "Ricarda Huch",
    category: "liebe",
    originalLanguage: "de",
    year: 1920,
    tags: ["liebe", "wachstum"],
    verified: true,
    authorBio: {
      de: "Deutsche Dichterin, Philosophin und Historikerin (1864-1947).",
      en: "German poet, philosopher, and historian (1864-1947)."
    }
  },
  {
    id: "liebe-5",
    text: {
      original: "La plus grande chose du monde, c'est de savoir \xEAtre \xE0 soi.",
      de: "Die gr\xF6\xDFte Sache der Welt ist es, zu wissen, wie man sich selbst geh\xF6rt.",
      en: "The greatest thing in the world is to know how to belong to oneself.",
      it: "La cosa pi\xF9 grande del mondo \xE8 sapere come appartenere a se stessi.",
      fr: "La plus grande chose du monde, c'est de savoir \xEAtre \xE0 soi.",
      es: "La cosa m\xE1s grande del mundo es saber c\xF3mo pertenecerse a uno mismo."
    },
    author: "Michel de Montaigne",
    category: "liebe",
    originalLanguage: "fr",
    source: "Essais, Buch I, Kapitel 39",
    year: 1580,
    tags: ["selbstliebe", "identit\xE4t"],
    verified: true,
    authorBio: {
      de: "Franz\xF6sischer Philosoph und Begr\xFCnder der Essayistik (1533-1592).",
      en: "French philosopher and founder of the essay form (1533-1592)."
    }
  },
  {
    id: "liebe-6",
    text: {
      original: "Amare non \xE8 guardarsi l'un l'altro, ma guardare insieme nella stessa direzione.",
      de: "Lieben, das hei\xDFt nicht, einander anschauen, sondern gemeinsam in die gleiche Richtung blicken.",
      en: "Love does not consist in gazing at each other, but in looking outward together in the same direction.",
      it: "Amare non \xE8 guardarsi l'un l'altro, ma guardare insieme nella stessa direzione.",
      fr: "Aimer, ce n'est pas se regarder l'un l'autre, c'est regarder ensemble dans la m\xEAme direction.",
      es: "Amar no es mirarse el uno al otro, sino mirar juntos en la misma direcci\xF3n."
    },
    author: "Antoine de Saint-Exup\xE9ry",
    category: "liebe",
    originalLanguage: "fr",
    source: "Terre des hommes",
    year: 1939,
    tags: ["liebe", "partnerschaft", "gemeinsam"],
    verified: true,
    authorBio: {
      de: "Franz\xF6sischer Schriftsteller und Pilot (1900-1944).",
      en: "French writer and aviator (1900-1944)."
    }
  },
  // ============================================
  // LEBEN
  // ============================================
  {
    id: "leben-1",
    text: {
      original: "Life is like riding a bicycle. To keep your balance, you must keep moving.",
      de: "Das Leben ist wie Fahrrad fahren. Um die Balance zu halten, musst du in Bewegung bleiben.",
      en: "Life is like riding a bicycle. To keep your balance, you must keep moving.",
      it: "La vita \xE8 come andare in bicicletta. Per mantenere l'equilibrio devi muoverti.",
      fr: "La vie, c'est comme une bicyclette. Il faut avancer pour ne pas perdre l'\xE9quilibre.",
      es: "La vida es como andar en bicicleta. Para mantener el equilibrio, debes seguir movi\xE9ndote."
    },
    author: "Albert Einstein",
    category: "leben",
    originalLanguage: "en",
    source: "Brief an seinen Sohn Eduard",
    year: 1930,
    tags: ["leben", "balance", "bewegung"],
    verified: true,
    authorBio: {
      de: "Deutsch-amerikanischer Physiker (1879-1955), Nobelpreistr\xE4ger.",
      en: "German-American physicist (1879-1955), Nobel laureate."
    }
  },
  {
    id: "leben-2",
    text: {
      original: "Life is what happens when you're busy making other plans.",
      de: "Leben ist das, was passiert, w\xE4hrend du damit besch\xE4ftigt bist, andere Pl\xE4ne zu machen.",
      en: "Life is what happens when you're busy making other plans.",
      it: "La vita \xE8 quello che ti succede mentre sei impegnato a fare altri progetti.",
      fr: "La vie est ce qui arrive pendant que vous \xEAtes occup\xE9 \xE0 faire d'autres projets.",
      es: "La vida es lo que pasa mientras est\xE1s ocupado haciendo otros planes."
    },
    author: "John Lennon",
    category: "leben",
    originalLanguage: "en",
    source: "Beautiful Boy (Darling Boy)",
    year: 1980,
    tags: ["leben", "pl\xE4ne", "gegenwart"],
    verified: true,
    authorBio: {
      de: "Britischer Musiker (1940-1980), Mitbegr\xFCnder der Beatles.",
      en: "British musician (1940-1980), co-founder of the Beatles."
    }
  },
  {
    id: "leben-3",
    text: {
      original: "Das Leben ist zu kurz f\xFCr sp\xE4ter.",
      de: "Das Leben ist zu kurz f\xFCr sp\xE4ter.",
      en: "Life is too short for later.",
      it: "La vita \xE8 troppo breve per il dopo.",
      fr: "La vie est trop courte pour plus tard.",
      es: "La vida es demasiado corta para despu\xE9s."
    },
    author: "Alexandra Reinwarth",
    category: "leben",
    originalLanguage: "de",
    source: "Buchtitel",
    year: 2017,
    tags: ["leben", "zeit", "gegenwart"],
    verified: true,
    authorBio: {
      de: "Deutsche Autorin und Journalistin (*1972).",
      en: "German author and journalist (*1972)."
    }
  },
  {
    id: "leben-4",
    text: {
      original: "\u1F69\u03C2 \u1F10\u03C3\u03C7\u03AC\u03C4\u03B7\u03BD \u1F11\u03BA\u03AC\u03C3\u03C4\u03B7\u03BD \u1F21\u03BC\u03AD\u03C1\u03B1\u03BD \u03B2\u03AF\u03BF\u03C5 \u03B4\u03B9\u03B5\u03BE\u03AC\u03B3\u03B5\u03B9\u03BD.",
      de: "Lebe jeden Tag, als w\xE4re es dein letzter.",
      en: "Live every day as if it were your last.",
      it: "Vivi ogni giorno come se fosse l'ultimo.",
      fr: "Vis chaque jour comme si c'\xE9tait le dernier.",
      es: "Vive cada d\xEDa como si fuera el \xFAltimo."
    },
    author: "Marcus Aurelius",
    category: "leben",
    originalLanguage: "el",
    source: "Selbstbetrachtungen (\u03A4\u1F70 \u03B5\u1F30\u03C2 \u1F11\u03B1\u03C5\u03C4\u03CC\u03BD), Buch VII",
    year: 175,
    tags: ["leben", "tag", "gegenwart", "stoizismus"],
    verified: true,
    authorBio: {
      de: "R\xF6mischer Kaiser (121-180 n. Chr.) und stoischer Philosoph.",
      en: "Roman Emperor (121-180 AD) and Stoic philosopher."
    }
  },
  {
    id: "leben-5",
    text: {
      original: "Livet er ikke et problem, der skal l\xF8ses, men en virkelighed, der skal opleves.",
      de: "Das Leben ist kein Problem, das gel\xF6st werden muss, sondern eine Wirklichkeit, die erfahren werden will.",
      en: "Life is not a problem to be solved, but a reality to be experienced.",
      it: "La vita non \xE8 un problema da risolvere, ma una realt\xE0 da vivere.",
      fr: "La vie n'est pas un probl\xE8me \xE0 r\xE9soudre, mais une r\xE9alit\xE9 \xE0 vivre.",
      es: "La vida no es un problema a resolver, sino una realidad a experimentar."
    },
    author: "S\xF8ren Kierkegaard",
    category: "leben",
    originalLanguage: "da",
    year: 1843,
    tags: ["leben", "erfahrung", "philosophie", "existenzialismus"],
    verified: true,
    authorBio: {
      de: "D\xE4nischer Philosoph (1813-1855), Begr\xFCnder des Existentialismus.",
      en: "Danish philosopher (1813-1855), founder of existentialism."
    }
  },
  {
    id: "leben-6",
    text: {
      original: "Wer sein Leben so einrichtet, dass er niemals auf die Nase fallen kann, der kann nur auf dem Bauch kriechen.",
      de: "Wer sein Leben so einrichtet, dass er niemals auf die Nase fallen kann, der kann nur auf dem Bauch kriechen.",
      en: "He who arranges his life so that he can never fall on his face can only crawl on his belly.",
      it: "Chi organizza la sua vita in modo da non cadere mai sul naso pu\xF2 solo strisciare sulla pancia.",
      fr: "Celui qui organise sa vie de fa\xE7on \xE0 ne jamais tomber sur le nez ne peut que ramper sur le ventre.",
      es: "Quien organiza su vida para nunca caer de cara solo puede arrastrarse sobre el vientre."
    },
    author: "Heinz Riesenhuber",
    category: "leben",
    originalLanguage: "de",
    year: 1990,
    tags: ["leben", "risiko", "mut"],
    verified: true,
    authorBio: {
      de: "Deutscher Politiker (CDU, *1935), ehemaliger Bundesminister f\xFCr Forschung.",
      en: "German politician (CDU, *1935), former Federal Minister of Research."
    }
  },
  {
    id: "leben-7",
    text: {
      original: "Carpe diem, quam minimum credula postero.",
      de: "Genie\xDFe den Tag und vertraue m\xF6glichst wenig auf den folgenden.",
      en: "Seize the day, putting as little trust as possible in the future.",
      it: "Cogli il giorno, confidando il meno possibile nel domani.",
      fr: "Cueille le jour pr\xE9sent sans te soucier du lendemain.",
      es: "Aprovecha el d\xEDa, confiando lo menos posible en el ma\xF1ana."
    },
    author: "Horaz",
    category: "leben",
    originalLanguage: "la",
    source: "Oden, Buch I, Ode 11",
    year: -23,
    tags: ["leben", "gegenwart", "carpe diem"],
    verified: true,
    authorBio: {
      de: "R\xF6mischer Dichter (65-8 v. Chr.).",
      en: "Roman poet (65-8 BC)."
    }
  },
  // ============================================
  // ERFOLG
  // ============================================
  {
    id: "erfolg-1",
    text: {
      original: "Coming together is a beginning, staying together is progress, and working together is success.",
      de: "Zusammenkommen ist ein Beginn, Zusammenbleiben ist ein Fortschritt, Zusammenarbeiten ist ein Erfolg.",
      en: "Coming together is a beginning, staying together is progress, and working together is success.",
      it: "Riunirsi \xE8 un inizio, restare insieme \xE8 un progresso, lavorare insieme \xE8 un successo.",
      fr: "Se r\xE9unir est un d\xE9but, rester ensemble est un progr\xE8s, travailler ensemble est un succ\xE8s.",
      es: "Reunirse es un comienzo, mantenerse juntos es un progreso, trabajar juntos es un \xE9xito."
    },
    author: "Henry Ford",
    category: "erfolg",
    originalLanguage: "en",
    year: 1920,
    tags: ["erfolg", "teamwork", "zusammenarbeit"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Industrieller (1863-1947), Gr\xFCnder der Ford Motor Company.",
      en: "American industrialist (1863-1947), founder of Ford Motor Company."
    }
  },
  {
    id: "erfolg-2",
    text: {
      original: "The price of success is hard work, dedication to the job at hand, and the determination that whether we win or lose, we have applied the best of ourselves to the task at hand.",
      de: "Der Preis des Erfolges ist Hingabe, harte Arbeit und unabl\xE4ssiger Einsatz f\xFCr das, was man erreichen will.",
      en: "The price of success is hard work, dedication to the job at hand, and the determination that whether we win or lose, we have applied the best of ourselves.",
      it: "Il prezzo del successo \xE8 il duro lavoro, la dedizione al compito da svolgere e la determinazione.",
      fr: "Le prix du succ\xE8s est le travail acharn\xE9, le d\xE9vouement au travail \xE0 accomplir et la d\xE9termination.",
      es: "El precio del \xE9xito es el trabajo duro, la dedicaci\xF3n a la tarea en cuesti\xF3n y la determinaci\xF3n."
    },
    author: "Vince Lombardi",
    category: "erfolg",
    originalLanguage: "en",
    year: 1960,
    tags: ["erfolg", "arbeit", "hingabe"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Football-Trainer (1913-1970), Legende der NFL.",
      en: "American football coach (1913-1970), NFL legend."
    }
  },
  {
    id: "erfolg-3",
    text: {
      original: "I have not failed. I've just found 10,000 ways that won't work.",
      de: "Ich habe nicht versagt. Ich habe nur 10.000 Wege gefunden, die nicht funktionieren.",
      en: "I have not failed. I've just found 10,000 ways that won't work.",
      it: "Non ho fallito. Ho solo trovato 10.000 modi che non funzionano.",
      fr: "Je n'ai pas \xE9chou\xE9. J'ai juste trouv\xE9 10 000 fa\xE7ons qui ne fonctionnent pas.",
      es: "No he fracasado. Solo he encontrado 10.000 formas que no funcionan."
    },
    author: "Thomas Edison",
    category: "erfolg",
    originalLanguage: "en",
    year: 1878,
    tags: ["erfolg", "scheitern", "ausdauer", "innovation"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Erfinder und Unternehmer (1847-1931).",
      en: "American inventor and businessman (1847-1931)."
    }
  },
  {
    id: "erfolg-4",
    text: {
      original: "Erfolg hat drei Buchstaben: TUN.",
      de: "Erfolg hat drei Buchstaben: TUN.",
      en: "Success has three letters: DO.",
      it: "Il successo ha tre lettere: FARE.",
      fr: "Le succ\xE8s a trois lettres : AGIR.",
      es: "El \xE9xito tiene tres letras: HAZ."
    },
    author: "Johann Wolfgang von Goethe",
    category: "erfolg",
    originalLanguage: "de",
    year: 1810,
    tags: ["erfolg", "handeln"],
    verified: false,
    authorBio: {
      de: "Deutscher Dichter und Naturforscher (1749-1832).",
      en: "German poet and naturalist (1749-1832)."
    }
  },
  {
    id: "erfolg-5",
    text: {
      original: "Es ist nicht genug, zu wissen, man muss auch anwenden; es ist nicht genug, zu wollen, man muss auch tun.",
      de: "Es ist nicht genug, zu wissen, man muss auch anwenden; es ist nicht genug, zu wollen, man muss auch tun.",
      en: "It is not enough to know, one must also apply; it is not enough to want, one must also do.",
      it: "Non basta sapere, bisogna anche applicare; non basta volere, bisogna anche fare.",
      fr: "Il ne suffit pas de savoir, il faut aussi appliquer ; il ne suffit pas de vouloir, il faut aussi agir.",
      es: "No basta saber, se debe tambi\xE9n aplicar; no basta querer, se debe tambi\xE9n hacer."
    },
    author: "Johann Wolfgang von Goethe",
    category: "erfolg",
    originalLanguage: "de",
    source: "Wilhelm Meisters Wanderjahre",
    year: 1821,
    tags: ["erfolg", "handeln", "wissen"],
    verified: true,
    authorBio: {
      de: "Deutscher Dichter und Naturforscher (1749-1832).",
      en: "German poet and naturalist (1749-1832)."
    }
  },
  {
    id: "erfolg-6",
    text: {
      original: "The only place where success comes before work is in the dictionary.",
      de: "Der einzige Ort, an dem Erfolg vor der Arbeit kommt, ist im W\xF6rterbuch.",
      en: "The only place where success comes before work is in the dictionary.",
      it: "L'unico posto dove il successo viene prima del lavoro \xE8 nel dizionario.",
      fr: "Le seul endroit o\xF9 le succ\xE8s vient avant le travail est dans le dictionnaire.",
      es: "El \xFAnico lugar donde el \xE9xito viene antes que el trabajo es en el diccionario."
    },
    author: "Vidal Sassoon",
    category: "erfolg",
    originalLanguage: "en",
    year: 1970,
    tags: ["erfolg", "arbeit"],
    verified: true,
    authorBio: {
      de: "Britischer Friseur und Unternehmer (1928-2012).",
      en: "British hairdresser and businessman (1928-2012)."
    }
  },
  // ============================================
  // GLÜCK
  // ============================================
  {
    id: "glueck-1",
    text: {
      original: "Das Gl\xFCck ist das einzige, das sich verdoppelt, wenn man es teilt.",
      de: "Gl\xFCck ist das Einzige, das sich verdoppelt, wenn man es teilt.",
      en: "Happiness is the only thing that doubles when you share it.",
      it: "La felicit\xE0 \xE8 l'unica cosa che raddoppia quando la condividi.",
      fr: "Le bonheur est la seule chose qui double quand on le partage.",
      es: "La felicidad es lo \xFAnico que se duplica cuando se comparte."
    },
    author: "Albert Schweitzer",
    category: "glueck",
    originalLanguage: "de",
    year: 1950,
    tags: ["gl\xFCck", "teilen"],
    verified: true,
    authorBio: {
      de: "Deutsch-franz\xF6sischer Arzt, Theologe und Friedensnobelpreistr\xE4ger (1875-1965).",
      en: "German-French physician, theologian, and Nobel Peace Prize laureate (1875-1965)."
    }
  },
  {
    id: "glueck-2",
    text: {
      original: "\u0938\u0941\u0916\u0902 \u0928 \u0932\u092D\u094D\u092F\u0924\u0947 \u0938\u0941\u0916\u0947\u0928\u0964",
      de: "Es gibt keinen Weg zum Gl\xFCck. Gl\xFCcklich sein ist der Weg.",
      en: "There is no path to happiness. Happiness is the path.",
      it: "Non esiste un percorso verso la felicit\xE0. La felicit\xE0 \xE8 il percorso.",
      fr: "Il n'y a pas de chemin vers le bonheur. Le bonheur est le chemin.",
      es: "No hay un camino hacia la felicidad. La felicidad es el camino."
    },
    author: "Buddha",
    category: "glueck",
    originalLanguage: "sa",
    year: -500,
    tags: ["gl\xFCck", "weg", "leben", "buddhismus"],
    verified: true,
    authorBio: {
      de: "Begr\xFCnder des Buddhismus (ca. 563-483 v. Chr.).",
      en: "Founder of Buddhism (c. 563-483 BC)."
    }
  },
  {
    id: "glueck-3",
    text: {
      original: "It is not happy people who are thankful. It is thankful people who are happy.",
      de: "Nicht die Gl\xFCcklichen sind dankbar. Es sind die Dankbaren, die gl\xFCcklich sind.",
      en: "It is not happy people who are thankful. It is thankful people who are happy.",
      it: "Non sono le persone felici ad essere grate. Sono le persone grate ad essere felici.",
      fr: "Ce ne sont pas les gens heureux qui sont reconnaissants. Ce sont les gens reconnaissants qui sont heureux.",
      es: "No son las personas felices las que son agradecidas. Son las personas agradecidas las que son felices."
    },
    author: "Francis Bacon",
    category: "glueck",
    originalLanguage: "en",
    year: 1600,
    tags: ["gl\xFCck", "dankbarkeit"],
    verified: false,
    authorBio: {
      de: "Englischer Philosoph und Staatsmann (1561-1626).",
      en: "English philosopher and statesman (1561-1626)."
    }
  },
  {
    id: "glueck-4",
    text: {
      original: "Sammenligning er enden p\xE5 lykke og begyndelsen p\xE5 utilfredshed.",
      de: "Das Vergleichen ist das Ende des Gl\xFCcks und der Anfang der Unzufriedenheit.",
      en: "Comparison is the end of happiness and the beginning of discontent.",
      it: "Il confronto \xE8 la fine della felicit\xE0 e l'inizio dell'insoddisfazione.",
      fr: "La comparaison est la fin du bonheur et le d\xE9but de l'insatisfaction.",
      es: "La comparaci\xF3n es el fin de la felicidad y el comienzo de la insatisfacci\xF3n."
    },
    author: "S\xF8ren Kierkegaard",
    category: "glueck",
    originalLanguage: "da",
    year: 1847,
    tags: ["gl\xFCck", "vergleich", "zufriedenheit"],
    verified: true,
    authorBio: {
      de: "D\xE4nischer Philosoph (1813-1855).",
      en: "Danish philosopher (1813-1855)."
    }
  },
  {
    id: "glueck-5",
    text: {
      original: "Gl\xFCck entsteht oft durch Aufmerksamkeit in kleinen Dingen, Ungl\xFCck oft durch Vernachl\xE4ssigung kleiner Dinge.",
      de: "Gl\xFCck entsteht oft durch Aufmerksamkeit in kleinen Dingen, Ungl\xFCck oft durch Vernachl\xE4ssigung kleiner Dinge.",
      en: "Happiness often comes from attention to small things, unhappiness often from neglecting small things.",
      it: "La felicit\xE0 nasce spesso dall'attenzione alle piccole cose, l'infelicit\xE0 spesso dalla trascuratezza delle piccole cose.",
      fr: "Le bonheur vient souvent de l'attention aux petites choses, le malheur souvent de la n\xE9gligence des petites choses.",
      es: "La felicidad a menudo proviene de la atenci\xF3n a las peque\xF1as cosas, la infelicidad a menudo del descuido de las peque\xF1as cosas."
    },
    author: "Wilhelm Busch",
    category: "glueck",
    originalLanguage: "de",
    year: 1875,
    tags: ["gl\xFCck", "aufmerksamkeit", "details"],
    verified: true,
    authorBio: {
      de: "Deutscher Dichter, Zeichner und Maler (1832-1908).",
      en: "German poet, illustrator, and painter (1832-1908)."
    }
  },
  {
    id: "glueck-6",
    text: {
      original: "\u0395\u1F50\u03B4\u03B1\u03B9\u03BC\u03BF\u03BD\u03AF\u03B1 \u1F10\u03C3\u03C4\u1F76\u03BD \u1F10\u03BD\u03AD\u03C1\u03B3\u03B5\u03B9\u03B1 \u03C8\u03C5\u03C7\u1FC6\u03C2 \u03BA\u03B1\u03C4\u1FBD \u1F00\u03C1\u03B5\u03C4\u1F74\u03BD \u03C4\u03B5\u03BB\u03B5\u03AF\u03B1\u03BD.",
      de: "Gl\xFCckseligkeit ist eine T\xE4tigkeit der Seele gem\xE4\xDF vollkommener Tugend.",
      en: "Happiness is an activity of the soul in accordance with complete virtue.",
      it: "La felicit\xE0 \xE8 un'attivit\xE0 dell'anima in accordo con la virt\xF9 perfetta.",
      fr: "Le bonheur est une activit\xE9 de l'\xE2me conforme \xE0 la vertu parfaite.",
      es: "La felicidad es una actividad del alma de acuerdo con la virtud perfecta."
    },
    author: "Aristoteles",
    category: "glueck",
    originalLanguage: "el",
    source: "Nikomachische Ethik, Buch I",
    year: -340,
    tags: ["gl\xFCck", "tugend", "seele", "philosophie"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph (384-322 v. Chr.).",
      en: "Greek philosopher (384-322 BC)."
    }
  },
  // ============================================
  // FREUNDSCHAFT
  // ============================================
  {
    id: "freund-1",
    text: {
      original: "A friend is one that knows you as you are, understands where you have been, accepts what you have become, and still, gently allows you to grow.",
      de: "Ein Freund ist jemand, der dich kennt wie du bist, versteht wo du warst, akzeptiert was aus dir geworden ist, und dir dennoch erlaubt zu wachsen.",
      en: "A friend is one that knows you as you are, understands where you have been, accepts what you have become, and still, gently allows you to grow.",
      it: "Un amico \xE8 qualcuno che ti conosce per quello che sei, capisce dove sei stato, accetta ci\xF2 che sei diventato, e ti permette ancora di crescere.",
      fr: "Un ami est quelqu'un qui te conna\xEEt tel que tu es, comprend o\xF9 tu as \xE9t\xE9, accepte ce que tu es devenu, et te permet encore de grandir.",
      es: "Un amigo es alguien que te conoce como eres, entiende d\xF3nde has estado, acepta en lo que te has convertido, y a\xFAn as\xED te permite crecer."
    },
    author: "William Shakespeare",
    category: "freundschaft",
    originalLanguage: "en",
    year: 1600,
    tags: ["freundschaft", "wachstum", "akzeptanz"],
    verified: false,
    authorBio: {
      de: "Englischer Dramatiker und Dichter (1564-1616).",
      en: "English playwright and poet (1564-1616)."
    }
  },
  {
    id: "freund-2",
    text: {
      original: "\u03A6\u03B9\u03BB\u03AF\u03B1 \u03C8\u03C5\u03C7\u1F74 \u03B4\u03CD\u03BF \u03C3\u03CE\u03BC\u03B1\u03C3\u03B9\u03BD \u1F10\u03BD\u03BF\u03B9\u03BA\u03BF\u1FE6\u03C3\u03B1.",
      de: "Freundschaft ist eine Seele in zwei K\xF6rpern.",
      en: "Friendship is one soul dwelling in two bodies.",
      it: "L'amicizia \xE8 un'anima che abita in due corpi.",
      fr: "L'amiti\xE9 est une \xE2me habitant deux corps.",
      es: "La amistad es un alma que habita en dos cuerpos."
    },
    author: "Aristoteles",
    category: "freundschaft",
    originalLanguage: "el",
    source: "\xDCberliefert durch Diogenes Laertios",
    year: -340,
    tags: ["freundschaft", "seele", "verbindung"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph (384-322 v. Chr.).",
      en: "Greek philosopher (384-322 BC)."
    }
  },
  {
    id: "freund-3",
    text: {
      original: "A friend is a person with whom I may be sincere. Before him I may think aloud.",
      de: "Ein Freund ist ein Mensch, vor dem ich aufrichtig sein kann. Vor ihm kann ich laut denken.",
      en: "A friend is a person with whom I may be sincere. Before him I may think aloud.",
      it: "Un amico \xE8 una persona con cui posso essere sincero. Davanti a lui posso pensare ad alta voce.",
      fr: "Un ami est une personne avec qui je peux \xEAtre sinc\xE8re. Devant lui, je peux penser tout haut.",
      es: "Un amigo es una persona con quien puedo ser sincero. Ante \xE9l puedo pensar en voz alta."
    },
    author: "Ralph Waldo Emerson",
    category: "freundschaft",
    originalLanguage: "en",
    source: "Essays: First Series - Friendship",
    year: 1841,
    tags: ["freundschaft", "ehrlichkeit", "vertrauen"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Philosoph und Schriftsteller (1803-1882).",
      en: "American philosopher and writer (1803-1882)."
    }
  },
  {
    id: "freund-4",
    text: {
      original: "\u1F21 \u03C6\u03B9\u03BB\u03AF\u03B1 \u03C4\u1FF6\u03BD \u1F00\u03BD\u03B1\u03B3\u03BA\u03B1\u03B9\u03BF\u03C4\u03AC\u03C4\u03C9\u03BD \u03B5\u1F30\u03C2 \u03C4\u1F78\u03BD \u03B2\u03AF\u03BF\u03BD.",
      de: "Die Freundschaft geh\xF6rt zum Notwendigsten in unserem Leben.",
      en: "Friendship is one of the most necessary things in life.",
      it: "L'amicizia \xE8 una delle cose pi\xF9 necessarie nella vita.",
      fr: "L'amiti\xE9 est l'une des choses les plus n\xE9cessaires dans la vie.",
      es: "La amistad es una de las cosas m\xE1s necesarias en la vida."
    },
    author: "Aristoteles",
    category: "freundschaft",
    originalLanguage: "el",
    source: "Nikomachische Ethik, Buch VIII",
    year: -340,
    tags: ["freundschaft", "leben", "notwendigkeit"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph (384-322 v. Chr.).",
      en: "Greek philosopher (384-322 BC)."
    }
  },
  {
    id: "freund-5",
    text: {
      original: "Amicus certus in re incerta cernitur.",
      de: "Den wahren Freund erkennt man in der Not.",
      en: "A true friend is recognized in uncertain times.",
      it: "Un vero amico si riconosce nei momenti difficili.",
      fr: "C'est dans l'adversit\xE9 qu'on reconna\xEEt ses vrais amis.",
      es: "En la adversidad se conoce al verdadero amigo."
    },
    author: "Cicero",
    category: "freundschaft",
    originalLanguage: "la",
    source: "De amicitia",
    year: -44,
    tags: ["freundschaft", "not", "treue"],
    verified: true,
    authorBio: {
      de: "R\xF6mischer Staatsmann, Redner und Philosoph (106-43 v. Chr.).",
      en: "Roman statesman, orator, and philosopher (106-43 BC)."
    }
  },
  // ============================================
  // MUT
  // ============================================
  {
    id: "mut-1",
    text: {
      original: "\u0398\u03AC\u03C1\u03C3\u03BF\u03C2 \u03BC\u1F72\u03BD \u1F14\u03C1\u03B3\u03BF\u03C5 \u1F00\u03C1\u03C7\u03AE, \u03C4\u03CD\u03C7\u03B7 \u03B4\u1F72 \u03C4\u03AD\u03BB\u03BF\u03C5\u03C2 \u03BA\u03C5\u03C1\u03AF\u03B1.",
      de: "Mut steht am Anfang des Handelns, Gl\xFCck am Ende.",
      en: "Courage stands at the beginning of action, fortune at the end.",
      it: "Il coraggio sta all'inizio dell'azione, la fortuna alla fine.",
      fr: "Le courage est au d\xE9but de l'action, la chance \xE0 la fin.",
      es: "El coraje est\xE1 al comienzo de la acci\xF3n, la suerte al final."
    },
    author: "Demokrit",
    category: "mut",
    originalLanguage: "el",
    source: "Fragmente",
    year: -400,
    tags: ["mut", "handeln", "gl\xFCck"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph (ca. 460-370 v. Chr.), Begr\xFCnder der Atomistik.",
      en: "Greek philosopher (c. 460-370 BC), founder of atomism."
    }
  },
  {
    id: "mut-2",
    text: {
      original: "Wer wagt, gewinnt.",
      de: "Wer wagt, gewinnt.",
      en: "Who dares, wins.",
      it: "Chi osa, vince.",
      fr: "Qui ose, gagne.",
      es: "Quien se atreve, gana."
    },
    author: "Deutsches Sprichwort",
    category: "mut",
    originalLanguage: "de",
    tags: ["mut", "wagnis", "erfolg"],
    verified: true
  },
  {
    id: "mut-3",
    text: {
      original: "Courage is resistance to fear, mastery of fear, not absence of fear.",
      de: "Mut ist Widerstand gegen die Angst, Beherrschung der Angst \u2013 nicht Abwesenheit von Angst.",
      en: "Courage is resistance to fear, mastery of fear, not absence of fear.",
      it: "Il coraggio \xE8 resistenza alla paura, dominio della paura, non assenza di paura.",
      fr: "Le courage est la r\xE9sistance \xE0 la peur, la ma\xEEtrise de la peur, pas l'absence de peur.",
      es: "El coraje es resistencia al miedo, dominio del miedo, no ausencia de miedo."
    },
    author: "Mark Twain",
    category: "mut",
    originalLanguage: "en",
    source: "Pudd'nhead Wilson",
    year: 1894,
    tags: ["mut", "angst", "beherrschung"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Schriftsteller (1835-1910).",
      en: "American writer (1835-1910)."
    }
  },
  {
    id: "mut-4",
    text: {
      original: "Courage is not the absence of fear, but rather the judgment that something else is more important than fear.",
      de: "Mut ist nicht die Abwesenheit von Angst, sondern die Erkenntnis, dass etwas anderes wichtiger ist als Angst.",
      en: "Courage is not the absence of fear, but rather the judgment that something else is more important than fear.",
      it: "Il coraggio non \xE8 l'assenza di paura, ma piuttosto il giudizio che qualcos'altro \xE8 pi\xF9 importante della paura.",
      fr: "Le courage n'est pas l'absence de peur, mais plut\xF4t le jugement que quelque chose d'autre est plus important que la peur.",
      es: "El coraje no es la ausencia de miedo, sino m\xE1s bien el juicio de que algo m\xE1s es m\xE1s importante que el miedo."
    },
    author: "Ambrose Redmoon",
    category: "mut",
    originalLanguage: "en",
    source: "No Peaceful Warriors!",
    year: 1991,
    tags: ["mut", "angst", "priorit\xE4ten"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Schriftsteller und Rockband-Manager (1933-1996).",
      en: "American writer and rock band manager (1933-1996)."
    }
  },
  {
    id: "mut-5",
    text: {
      original: "In the middle of difficulty lies opportunity.",
      de: "Inmitten der Schwierigkeit liegt die M\xF6glichkeit.",
      en: "In the middle of difficulty lies opportunity.",
      it: "Nel mezzo della difficolt\xE0 giace l'opportunit\xE0.",
      fr: "Au milieu de la difficult\xE9 se trouve l'opportunit\xE9.",
      es: "En medio de la dificultad yace la oportunidad."
    },
    author: "Albert Einstein",
    category: "mut",
    originalLanguage: "en",
    year: 1939,
    tags: ["mut", "schwierigkeit", "chance"],
    verified: true,
    authorBio: {
      de: "Deutsch-amerikanischer Physiker (1879-1955).",
      en: "German-American physicist (1879-1955)."
    }
  },
  {
    id: "mut-6",
    text: {
      original: "Audentes fortuna iuvat.",
      de: "Das Gl\xFCck beg\xFCnstigt die Mutigen.",
      en: "Fortune favors the bold.",
      it: "La fortuna aiuta gli audaci.",
      fr: "La fortune sourit aux audacieux.",
      es: "La fortuna favorece a los audaces."
    },
    author: "Vergil",
    category: "mut",
    originalLanguage: "la",
    source: "Aeneis, Buch X",
    year: -19,
    tags: ["mut", "gl\xFCck", "wagnis"],
    verified: true,
    authorBio: {
      de: "R\xF6mischer Dichter (70-19 v. Chr.).",
      en: "Roman poet (70-19 BC)."
    }
  },
  // ============================================
  // HOFFNUNG
  // ============================================
  {
    id: "hoff-1",
    text: {
      original: "\u0986\u09B6\u09BE \u098F\u0995\u099F\u09BF \u09AA\u09BE\u0996\u09BF \u09AF\u09BE \u0985\u09A8\u09CD\u09A7\u0995\u09BE\u09B0 \u09B0\u09BE\u09A4\u09C7\u0993 \u0997\u09BE\u09A8 \u0995\u09B0\u09C7\u0964",
      de: "Hoffnung ist ein Vogel, der singt, wenn die Nacht noch dunkel ist.",
      en: "Hope is a bird that sings when the night is still dark.",
      it: "La speranza \xE8 un uccello che canta quando la notte \xE8 ancora buia.",
      fr: "L'espoir est un oiseau qui chante quand la nuit est encore sombre.",
      es: "La esperanza es un p\xE1jaro que canta cuando la noche a\xFAn est\xE1 oscura."
    },
    author: "Rabindranath Tagore",
    category: "hoffnung",
    originalLanguage: "bn",
    year: 1910,
    tags: ["hoffnung", "dunkelheit", "licht"],
    verified: true,
    authorBio: {
      de: "Indischer Dichter (1861-1941), Nobelpreistr\xE4ger f\xFCr Literatur 1913.",
      en: "Indian poet (1861-1941), Nobel laureate in Literature 1913."
    }
  },
  {
    id: "hoff-2",
    text: {
      original: "Nach dem Regen scheint die Sonne.",
      de: "Nach jedem Sturm scheint auch wieder die Sonne.",
      en: "After every storm, the sun shines again.",
      it: "Dopo ogni tempesta, il sole torna a splendere.",
      fr: "Apr\xE8s chaque temp\xEAte, le soleil brille \xE0 nouveau.",
      es: "Despu\xE9s de cada tormenta, el sol vuelve a brillar."
    },
    author: "Deutsches Sprichwort",
    category: "hoffnung",
    originalLanguage: "de",
    tags: ["hoffnung", "sturm", "sonne"],
    verified: true
  },
  {
    id: "hoff-3",
    text: {
      original: "Auch aus Steinen, die einem in den Weg gelegt werden, kann man Sch\xF6nes bauen.",
      de: "Auch aus Steinen, die einem in den Weg gelegt werden, kann man Sch\xF6nes bauen.",
      en: "Even from the stones placed in your path, you can build something beautiful.",
      it: "Anche dalle pietre che ti mettono sulla strada, puoi costruire qualcosa di bello.",
      fr: "M\xEAme des pierres plac\xE9es sur ton chemin, tu peux construire quelque chose de beau.",
      es: "Incluso de las piedras que te ponen en el camino, puedes construir algo hermoso."
    },
    author: "Johann Wolfgang von Goethe",
    category: "hoffnung",
    originalLanguage: "de",
    year: 1810,
    tags: ["hoffnung", "hindernisse", "kreativit\xE4t"],
    verified: true,
    authorBio: {
      de: "Deutscher Dichter und Naturforscher (1749-1832).",
      en: "German poet and naturalist (1749-1832)."
    }
  },
  {
    id: "hoff-4",
    text: {
      original: "Hope is being able to see that there is light despite all of the darkness.",
      de: "Hoffnung bedeutet, das Licht zu sehen, obwohl alles dunkel ist.",
      en: "Hope is being able to see that there is light despite all of the darkness.",
      it: "La speranza \xE8 essere in grado di vedere che c'\xE8 luce nonostante tutta l'oscurit\xE0.",
      fr: "L'espoir, c'est \xEAtre capable de voir qu'il y a de la lumi\xE8re malgr\xE9 toute l'obscurit\xE9.",
      es: "La esperanza es ser capaz de ver que hay luz a pesar de toda la oscuridad."
    },
    author: "Desmond Tutu",
    category: "hoffnung",
    originalLanguage: "en",
    year: 1984,
    tags: ["hoffnung", "licht", "dunkelheit"],
    verified: true,
    authorBio: {
      de: "S\xFCdafrikanischer Erzbischof und Friedensnobelpreistr\xE4ger (1931-2021).",
      en: "South African archbishop and Nobel Peace Prize laureate (1931-2021)."
    }
  },
  {
    id: "hoff-5",
    text: {
      original: "Dum spiro, spero.",
      de: "Solange ich atme, hoffe ich.",
      en: "While I breathe, I hope.",
      it: "Finch\xE9 respiro, spero.",
      fr: "Tant que je respire, j'esp\xE8re.",
      es: "Mientras respiro, espero."
    },
    author: "Cicero",
    category: "hoffnung",
    originalLanguage: "la",
    source: "Epistulae ad Atticum",
    year: -43,
    tags: ["hoffnung", "leben", "ausdauer"],
    verified: true,
    authorBio: {
      de: "R\xF6mischer Staatsmann und Philosoph (106-43 v. Chr.).",
      en: "Roman statesman and philosopher (106-43 BC)."
    }
  },
  // ============================================
  // NATUR
  // ============================================
  {
    id: "natur-1",
    text: {
      original: "Die Natur ist das einzige Buch, das auf allen Bl\xE4ttern gro\xDFen Gehalt bietet.",
      de: "Die Natur ist das einzige Buch, das auf allen Bl\xE4ttern gro\xDFen Gehalt bietet.",
      en: "Nature is the only book that offers great content on every page.",
      it: "La natura \xE8 l'unico libro che offre un grande contenuto in ogni pagina.",
      fr: "La nature est le seul livre qui offre un grand contenu \xE0 chaque page.",
      es: "La naturaleza es el \xFAnico libro que ofrece un gran contenido en cada p\xE1gina."
    },
    author: "Johann Wolfgang von Goethe",
    category: "natur",
    originalLanguage: "de",
    year: 1820,
    tags: ["natur", "buch", "weisheit"],
    verified: true,
    authorBio: {
      de: "Deutscher Dichter und Naturforscher (1749-1832).",
      en: "German poet and naturalist (1749-1832)."
    }
  },
  {
    id: "natur-2",
    text: {
      original: "Look deep into nature, and then you will understand everything better.",
      de: "Schau tief in die Natur, und dann wirst du alles besser verstehen.",
      en: "Look deep into nature, and then you will understand everything better.",
      it: "Guarda in profondit\xE0 nella natura, e poi capirai tutto meglio.",
      fr: "Regarde profond\xE9ment dans la nature, et alors tu comprendras tout mieux.",
      es: "Mira profundamente en la naturaleza, y entonces entender\xE1s todo mejor."
    },
    author: "Albert Einstein",
    category: "natur",
    originalLanguage: "en",
    year: 1930,
    tags: ["natur", "verstehen", "weisheit"],
    verified: true,
    authorBio: {
      de: "Deutsch-amerikanischer Physiker (1879-1955).",
      en: "German-American physicist (1879-1955)."
    }
  },
  {
    id: "natur-3",
    text: {
      original: "Natura non facit saltus.",
      de: "Die Natur macht keine Spr\xFCnge.",
      en: "Nature does not make jumps.",
      it: "La natura non fa salti.",
      fr: "La nature ne fait pas de sauts.",
      es: "La naturaleza no da saltos."
    },
    author: "Carl von Linn\xE9",
    category: "natur",
    originalLanguage: "la",
    source: "Philosophia Botanica",
    year: 1751,
    tags: ["natur", "evolution", "kontinuit\xE4t"],
    verified: true,
    authorBio: {
      de: "Schwedischer Naturforscher (1707-1778), Begr\xFCnder der modernen Taxonomie.",
      en: "Swedish naturalist (1707-1778), founder of modern taxonomy."
    }
  },
  {
    id: "natur-4",
    text: {
      original: "Forget not that the earth delights to feel your bare feet and the winds long to play with your hair.",
      de: "Vergiss nicht, dass die Erde sich freut, deine nackten F\xFC\xDFe zu f\xFChlen, und die Winde sich danach sehnen, mit deinem Haar zu spielen.",
      en: "Forget not that the earth delights to feel your bare feet and the winds long to play with your hair.",
      it: "Non dimenticare che la terra si rallegra di sentire i tuoi piedi nudi e i venti desiderano giocare con i tuoi capelli.",
      fr: "N'oublie pas que la terre se r\xE9jouit de sentir tes pieds nus et que les vents aspirent \xE0 jouer avec tes cheveux.",
      es: "No olvides que la tierra se deleita en sentir tus pies descalzos y los vientos anhelan jugar con tu cabello."
    },
    author: "Khalil Gibran",
    category: "natur",
    originalLanguage: "en",
    source: "The Prophet",
    year: 1923,
    tags: ["natur", "freiheit", "verbindung"],
    verified: true,
    authorBio: {
      de: "Libanesisch-amerikanischer Dichter und Philosoph (1883-1931).",
      en: "Lebanese-American poet and philosopher (1883-1931)."
    }
  },
  {
    id: "natur-5",
    text: {
      original: "In every walk with nature, one receives far more than he seeks.",
      de: "Bei jedem Spaziergang mit der Natur erh\xE4lt man weit mehr, als man sucht.",
      en: "In every walk with nature, one receives far more than he seeks.",
      it: "In ogni passeggiata con la natura, si riceve molto pi\xF9 di quanto si cerca.",
      fr: "Dans chaque promenade avec la nature, on re\xE7oit bien plus que ce qu'on cherche.",
      es: "En cada paseo con la naturaleza, uno recibe mucho m\xE1s de lo que busca."
    },
    author: "John Muir",
    category: "natur",
    originalLanguage: "en",
    year: 1890,
    tags: ["natur", "spaziergang", "geschenk"],
    verified: true,
    authorBio: {
      de: "Schottisch-amerikanischer Naturforscher und Umweltsch\xFCtzer (1838-1914).",
      en: "Scottish-American naturalist and conservationist (1838-1914)."
    }
  },
  {
    id: "natur-6",
    text: {
      original: "\u03A6\u03CD\u03C3\u03B9\u03C2 \u03BA\u03C1\u03CD\u03C0\u03C4\u03B5\u03C3\u03B8\u03B1\u03B9 \u03C6\u03B9\u03BB\u03B5\u1FD6.",
      de: "Die Natur liebt es, sich zu verbergen.",
      en: "Nature loves to hide.",
      it: "La natura ama nascondersi.",
      fr: "La nature aime se cacher.",
      es: "La naturaleza ama ocultarse."
    },
    author: "Heraklit",
    category: "natur",
    originalLanguage: "el",
    source: "Fragment 123",
    year: -500,
    tags: ["natur", "geheimnis", "philosophie"],
    verified: true,
    authorBio: {
      de: "Griechischer Philosoph aus Ephesos (ca. 535-475 v. Chr.).",
      en: "Greek philosopher from Ephesus (c. 535-475 BC)."
    }
  },
  // ============================================
  // HUMOR
  // ============================================
  {
    id: "humor-1",
    text: {
      original: "Be yourself; everyone else is already taken.",
      de: "Sei du selbst; alle anderen sind bereits vergeben.",
      en: "Be yourself; everyone else is already taken.",
      it: "Sii te stesso; tutti gli altri sono gi\xE0 occupati.",
      fr: "Sois toi-m\xEAme ; tous les autres sont d\xE9j\xE0 pris.",
      es: "S\xE9 t\xFA mismo; todos los dem\xE1s ya est\xE1n ocupados."
    },
    author: "Oscar Wilde",
    category: "humor",
    originalLanguage: "en",
    tags: ["humor", "identit\xE4t", "selbst"],
    verified: true,
    authorBio: {
      de: "Irischer Schriftsteller und Dramatiker (1854-1900).",
      en: "Irish writer and playwright (1854-1900)."
    }
  },
  {
    id: "humor-2",
    text: {
      original: "I have not failed. I've just found 10,000 ways that won't work.",
      de: "Ich habe nicht versagt. Ich habe nur 10.000 Wege gefunden, die nicht funktionieren.",
      en: "I have not failed. I've just found 10,000 ways that won't work.",
      it: "Non ho fallito. Ho solo trovato 10.000 modi che non funzionano.",
      fr: "Je n'ai pas \xE9chou\xE9. J'ai juste trouv\xE9 10 000 fa\xE7ons qui ne fonctionnent pas.",
      es: "No he fracasado. Solo he encontrado 10.000 formas que no funcionan."
    },
    author: "Thomas Edison",
    category: "humor",
    originalLanguage: "en",
    tags: ["humor", "ausdauer", "erfindung"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Erfinder und Unternehmer (1847-1931).",
      en: "American inventor and businessman (1847-1931)."
    }
  },
  {
    id: "humor-3",
    text: {
      original: "I can resist everything except temptation.",
      de: "Ich kann allem widerstehen, nur nicht der Versuchung.",
      en: "I can resist everything except temptation.",
      it: "Posso resistere a tutto tranne che alla tentazione.",
      fr: "Je peux r\xE9sister \xE0 tout, sauf \xE0 la tentation.",
      es: "Puedo resistir todo, excepto la tentaci\xF3n."
    },
    author: "Oscar Wilde",
    category: "humor",
    originalLanguage: "en",
    source: "Lady Windermere's Fan",
    year: 1892,
    tags: ["humor", "versuchung", "ironie"],
    verified: true
  },
  {
    id: "humor-4",
    text: {
      original: "Zwei Dinge sind unendlich, das Universum und die menschliche Dummheit, aber bei dem Universum bin ich mir noch nicht ganz sicher.",
      de: "Zwei Dinge sind unendlich, das Universum und die menschliche Dummheit, aber bei dem Universum bin ich mir noch nicht ganz sicher.",
      en: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
      it: "Due cose sono infinite: l'universo e la stupidit\xE0 umana; e non sono sicuro dell'universo.",
      fr: "Deux choses sont infinies : l'univers et la b\xEAtise humaine ; et je ne suis pas s\xFBr de l'univers.",
      es: "Dos cosas son infinitas: el universo y la estupidez humana; y no estoy seguro del universo."
    },
    author: "Albert Einstein",
    category: "humor",
    originalLanguage: "de",
    tags: ["humor", "intelligenz", "universum"],
    verified: false,
    authorBio: {
      de: "Deutsch-schweizerisch-amerikanischer Physiker (1879-1955), Nobelpreistr\xE4ger.",
      en: "German-Swiss-American physicist (1879-1955), Nobel laureate."
    }
  },
  {
    id: "humor-5",
    text: {
      original: "In der K\xFCrze liegt die W\xFCrze.",
      de: "In der K\xFCrze liegt die W\xFCrze.",
      en: "Brevity is the soul of wit.",
      it: "La brevit\xE0 \xE8 l'anima dell'arguzia.",
      fr: "La bri\xE8vet\xE9 est l'\xE2me de l'esprit.",
      es: "La brevedad es el alma del ingenio."
    },
    author: "William Shakespeare",
    category: "humor",
    originalLanguage: "en",
    source: "Hamlet",
    year: 1601,
    tags: ["humor", "k\xFCrze", "sprache"],
    verified: true,
    authorBio: {
      de: "Englischer Dramatiker und Dichter (1564-1616).",
      en: "English playwright and poet (1564-1616)."
    }
  },
  // ============================================
  // WISSENSCHAFT
  // ============================================
  {
    id: "wiss-1",
    text: {
      original: "Imagination is more important than knowledge.",
      de: "Vorstellungskraft ist wichtiger als Wissen.",
      en: "Imagination is more important than knowledge.",
      it: "L'immaginazione \xE8 pi\xF9 importante della conoscenza.",
      fr: "L'imagination est plus importante que le savoir.",
      es: "La imaginaci\xF3n es m\xE1s importante que el conocimiento."
    },
    author: "Albert Einstein",
    category: "wissenschaft",
    originalLanguage: "en",
    source: "Interview, Saturday Evening Post",
    year: 1929,
    tags: ["wissenschaft", "phantasie", "wissen"],
    verified: true,
    authorBio: {
      de: "Deutsch-schweizerisch-amerikanischer Physiker (1879-1955), Nobelpreistr\xE4ger.",
      en: "German-Swiss-American physicist (1879-1955), Nobel laureate."
    }
  },
  {
    id: "wiss-2",
    text: {
      original: "Nothing in life is to be feared, it is only to be understood.",
      de: "Nichts im Leben muss gef\xFCrchtet werden, es muss nur verstanden werden.",
      en: "Nothing in life is to be feared, it is only to be understood.",
      it: "Nulla nella vita va temuto, dev'essere soltanto compreso.",
      fr: "Dans la vie, rien n'est \xE0 craindre, tout est \xE0 comprendre.",
      es: "Nada en la vida debe ser temido, solamente comprendido."
    },
    author: "Marie Curie",
    category: "wissenschaft",
    originalLanguage: "fr",
    tags: ["wissenschaft", "mut", "verst\xE4ndnis"],
    verified: true,
    authorBio: {
      de: "Polnisch-franz\xF6sische Physikerin und Chemikerin (1867-1934), zweifache Nobelpreistr\xE4gerin.",
      en: "Polish-French physicist and chemist (1867-1934), two-time Nobel laureate."
    }
  },
  {
    id: "wiss-3",
    text: {
      original: "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
      de: "Das Wichtigste ist, nicht aufzuh\xF6ren zu fragen. Neugier hat ihre eigene Daseinsberechtigung.",
      en: "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
      it: "La cosa importante \xE8 non smettere di fare domande. La curiosit\xE0 ha la sua ragione di esistere.",
      fr: "L'important est de ne pas cesser de questionner. La curiosit\xE9 a sa propre raison d'exister.",
      es: "Lo importante es no dejar de hacerse preguntas. La curiosidad tiene su propia raz\xF3n de existir."
    },
    author: "Albert Einstein",
    category: "wissenschaft",
    originalLanguage: "en",
    source: "LIFE Magazine",
    year: 1955,
    tags: ["wissenschaft", "neugier", "fragen"],
    verified: true
  },
  {
    id: "wiss-4",
    text: {
      original: "Somewhere, something incredible is waiting to be known.",
      de: "Irgendwo wartet etwas Unglaubliches darauf, entdeckt zu werden.",
      en: "Somewhere, something incredible is waiting to be known.",
      it: "Da qualche parte, qualcosa di incredibile attende di essere scoperto.",
      fr: "Quelque part, quelque chose d'incroyable attend d'\xEAtre d\xE9couvert.",
      es: "En alg\xFAn lugar, algo incre\xEDble est\xE1 esperando ser descubierto."
    },
    author: "Carl Sagan",
    category: "wissenschaft",
    originalLanguage: "en",
    tags: ["wissenschaft", "entdeckung", "kosmos"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Astrophysiker und Wissenschaftskommunikator (1934-1996).",
      en: "American astrophysicist and science communicator (1934-1996)."
    }
  },
  {
    id: "wiss-5",
    text: {
      original: "One, remember to look up at the stars and not down at your feet.",
      de: "Erstens: Denkt daran, zu den Sternen aufzublicken und nicht auf eure F\xFC\xDFe.",
      en: "One, remember to look up at the stars and not down at your feet.",
      it: "Primo: ricordatevi di guardare le stelle e non i vostri piedi.",
      fr: "Premi\xE8rement, n'oubliez pas de regarder les \xE9toiles et non vos pieds.",
      es: "Primero: recuerden mirar las estrellas y no sus pies."
    },
    author: "Stephen Hawking",
    category: "wissenschaft",
    originalLanguage: "en",
    tags: ["wissenschaft", "sterne", "perspektive"],
    verified: true,
    authorBio: {
      de: "Britischer Physiker und Kosmologe (1942-2018).",
      en: "British physicist and cosmologist (1942-2018)."
    }
  },
  // ============================================
  // KUNST
  // ============================================
  {
    id: "kunst-1",
    text: {
      original: "Every child is an artist. The problem is how to remain an artist once we grow up.",
      de: "Jedes Kind ist ein K\xFCnstler. Das Problem ist, ein K\xFCnstler zu bleiben, wenn man erwachsen wird.",
      en: "Every child is an artist. The problem is how to remain an artist once we grow up.",
      it: "Ogni bambino \xE8 un artista. Il problema \xE8 come rimanere un artista quando si cresce.",
      fr: "Chaque enfant est un artiste. Le probl\xE8me est de rester un artiste en grandissant.",
      es: "Todo ni\xF1o es un artista. El problema es c\xF3mo seguir siendo artista cuando se crece."
    },
    author: "Pablo Picasso",
    category: "kunst",
    originalLanguage: "es",
    tags: ["kunst", "kreativit\xE4t", "kindheit"],
    verified: true,
    authorBio: {
      de: "Spanischer Maler und Bildhauer (1881-1973), Mitbegr\xFCnder des Kubismus.",
      en: "Spanish painter and sculptor (1881-1973), co-founder of Cubism."
    }
  },
  {
    id: "kunst-2",
    text: {
      original: "Art is not what you see, but what you make others see.",
      de: "Kunst ist nicht das, was du siehst, sondern das, was du andere sehen l\xE4sst.",
      en: "Art is not what you see, but what you make others see.",
      it: "L'arte non \xE8 ci\xF2 che vedi, ma ci\xF2 che fai vedere agli altri.",
      fr: "L'art, ce n'est pas ce que vous voyez, mais ce que vous faites voir aux autres.",
      es: "El arte no es lo que ves, sino lo que haces ver a los dem\xE1s."
    },
    author: "Edgar Degas",
    category: "kunst",
    originalLanguage: "fr",
    tags: ["kunst", "wahrnehmung", "perspektive"],
    verified: true,
    authorBio: {
      de: "Franz\xF6sischer Maler und Bildhauer (1834-1917), Impressionist.",
      en: "French painter and sculptor (1834-1917), Impressionist."
    }
  },
  {
    id: "kunst-3",
    text: {
      original: "Die Kunst ist eine Vermittlerin des Unaussprechlichen.",
      de: "Die Kunst ist eine Vermittlerin des Unaussprechlichen.",
      en: "Art is a mediator of the inexpressible.",
      it: "L'arte \xE8 una mediatrice dell'inesprimibile.",
      fr: "L'art est un m\xE9diateur de l'inexprimable.",
      es: "El arte es un mediador de lo inexpresable."
    },
    author: "Johann Wolfgang von Goethe",
    category: "kunst",
    originalLanguage: "de",
    source: "Maximen und Reflexionen",
    tags: ["kunst", "sprache", "ausdruck"],
    verified: true,
    authorBio: {
      de: "Deutscher Dichter und Naturforscher (1749-1832).",
      en: "German poet and naturalist (1749-1832)."
    }
  },
  {
    id: "kunst-4",
    text: {
      original: "I dream my painting and I paint my dream.",
      de: "Ich tr\xE4ume mein Gem\xE4lde und male meinen Traum.",
      en: "I dream my painting and I paint my dream.",
      it: "Sogno il mio dipinto e dipingo il mio sogno.",
      fr: "Je r\xEAve ma peinture et je peins mon r\xEAve.",
      es: "Sue\xF1o mi pintura y pinto mi sue\xF1o."
    },
    author: "Vincent van Gogh",
    category: "kunst",
    originalLanguage: "nl",
    tags: ["kunst", "traum", "malerei"],
    verified: true,
    authorBio: {
      de: "Niederl\xE4ndischer Maler (1853-1890), Wegbereiter der modernen Kunst.",
      en: "Dutch painter (1853-1890), pioneer of modern art."
    }
  },
  {
    id: "kunst-5",
    text: {
      original: "Creativity takes courage.",
      de: "Kreativit\xE4t erfordert Mut.",
      en: "Creativity takes courage.",
      it: "La creativit\xE0 richiede coraggio.",
      fr: "La cr\xE9ativit\xE9 demande du courage.",
      es: "La creatividad requiere coraje."
    },
    author: "Henri Matisse",
    category: "kunst",
    originalLanguage: "fr",
    tags: ["kunst", "mut", "kreativit\xE4t"],
    verified: true,
    authorBio: {
      de: "Franz\xF6sischer Maler (1869-1954), Wegbereiter des Fauvismus.",
      en: "French painter (1869-1954), pioneer of Fauvism."
    }
  },
  // ============================================
  // ZEITGENÖSSISCH (across categories)
  // ============================================
  {
    id: "zeit-1",
    text: {
      original: "Your time is limited, so don't waste it living someone else's life.",
      de: "Deine Zeit ist begrenzt, also verschwende sie nicht damit, das Leben eines anderen zu leben.",
      en: "Your time is limited, so don't waste it living someone else's life.",
      it: "Il tuo tempo \xE8 limitato, quindi non sprecarlo vivendo la vita di qualcun altro.",
      fr: "Votre temps est limit\xE9, ne le gaspillez pas en vivant la vie de quelqu'un d'autre.",
      es: "Tu tiempo es limitado, no lo desperdicies viviendo la vida de otra persona."
    },
    author: "Steve Jobs",
    category: "leben",
    originalLanguage: "en",
    source: "Stanford Commencement Speech",
    year: 2005,
    tags: ["leben", "zeit", "authentizit\xE4t"],
    verified: true
  },
  {
    id: "zeit-2",
    text: {
      original: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
      de: "Ich habe gelernt, dass Menschen vergessen, was du gesagt hast, vergessen, was du getan hast, aber nie vergessen, wie du sie f\xFChlen lie\xDFest.",
      en: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
      it: "Ho imparato che le persone dimenticheranno ci\xF2 che hai detto, ci\xF2 che hai fatto, ma non dimenticheranno mai come le hai fatte sentire.",
      fr: "J'ai appris que les gens oublieront ce que vous avez dit, ce que vous avez fait, mais jamais ce que vous leur avez fait ressentir.",
      es: "He aprendido que la gente olvidar\xE1 lo que dijiste, lo que hiciste, pero nunca olvidar\xE1 c\xF3mo les hiciste sentir."
    },
    author: "Maya Angelou",
    category: "weisheit",
    originalLanguage: "en",
    tags: ["weisheit", "empathie", "gef\xFChl"],
    verified: true,
    authorBio: {
      de: "US-amerikanische Schriftstellerin und B\xFCrgerrechtsaktivistin (1928-2014).",
      en: "American writer and civil rights activist (1928-2014)."
    }
  },
  {
    id: "zeit-3",
    text: {
      original: "Education is the most powerful weapon which you can use to change the world.",
      de: "Bildung ist die m\xE4chtigste Waffe, die du nutzen kannst, um die Welt zu ver\xE4ndern.",
      en: "Education is the most powerful weapon which you can use to change the world.",
      it: "L'istruzione \xE8 l'arma pi\xF9 potente che puoi usare per cambiare il mondo.",
      fr: "L'\xE9ducation est l'arme la plus puissante qu'on puisse utiliser pour changer le monde.",
      es: "La educaci\xF3n es el arma m\xE1s poderosa que puedes usar para cambiar el mundo."
    },
    author: "Nelson Mandela",
    category: "weisheit",
    originalLanguage: "en",
    year: 2003,
    tags: ["bildung", "ver\xE4nderung", "welt"],
    verified: true,
    authorBio: {
      de: "S\xFCdafrikanischer Freiheitsk\xE4mpfer und Staatspr\xE4sident (1918-2013), Nobelpreistr\xE4ger.",
      en: "South African freedom fighter and president (1918-2013), Nobel laureate."
    }
  },
  {
    id: "zeit-4",
    text: {
      original: "Stay hungry, stay foolish.",
      de: "Bleibt hungrig, bleibt verr\xFCckt.",
      en: "Stay hungry, stay foolish.",
      it: "Siate affamati, siate folli.",
      fr: "Restez affam\xE9s, restez fous.",
      es: "Sigan hambrientos, sigan alocados."
    },
    author: "Steve Jobs",
    category: "motivation",
    originalLanguage: "en",
    source: "Stanford Commencement Speech",
    year: 2005,
    tags: ["motivation", "neugier", "leidenschaft"],
    verified: true
  },
  {
    id: "zeit-5",
    text: {
      original: "No one can make you feel inferior without your consent.",
      de: "Niemand kann dir ohne dein Einverst\xE4ndnis das Gef\xFChl geben, minderwertig zu sein.",
      en: "No one can make you feel inferior without your consent.",
      it: "Nessuno pu\xF2 farti sentire inferiore senza il tuo consenso.",
      fr: "Personne ne peut vous faire sentir inf\xE9rieur sans votre consentement.",
      es: "Nadie puede hacerte sentir inferior sin tu consentimiento."
    },
    author: "Eleanor Roosevelt",
    category: "mut",
    originalLanguage: "en",
    tags: ["mut", "selbstwert", "st\xE4rke"],
    verified: true,
    authorBio: {
      de: "US-amerikanische Menschenrechtsaktivistin und First Lady (1884-1962).",
      en: "American human rights activist and First Lady (1884-1962)."
    }
  },
  {
    id: "zeit-6",
    text: {
      original: "It is during our darkest moments that we must focus to see the light.",
      de: "In unseren dunkelsten Momenten m\xFCssen wir uns darauf konzentrieren, das Licht zu sehen.",
      en: "It is during our darkest moments that we must focus to see the light.",
      it: "\xC8 nei nostri momenti pi\xF9 bui che dobbiamo concentrarci per vedere la luce.",
      fr: "C'est dans nos moments les plus sombres que nous devons nous concentrer pour voir la lumi\xE8re.",
      es: "Es en nuestros momentos m\xE1s oscuros que debemos concentrarnos para ver la luz."
    },
    author: "Aristoteles",
    category: "hoffnung",
    originalLanguage: "el",
    tags: ["hoffnung", "st\xE4rke", "licht"],
    verified: false
  },
  {
    id: "zeit-7",
    text: {
      original: "The only impossible journey is the one you never begin.",
      de: "Die einzige unm\xF6gliche Reise ist die, die du nie beginnst.",
      en: "The only impossible journey is the one you never begin.",
      it: "L'unico viaggio impossibile \xE8 quello che non inizi mai.",
      fr: "Le seul voyage impossible est celui que vous ne commencez jamais.",
      es: "El \xFAnico viaje imposible es el que nunca comienzas."
    },
    author: "Tony Robbins",
    category: "motivation",
    originalLanguage: "en",
    tags: ["motivation", "anfang", "reise"],
    verified: true,
    authorBio: {
      de: "US-amerikanischer Motivationsredner und Autor (*1960).",
      en: "American motivational speaker and author (b. 1960)."
    }
  },
  {
    id: "zeit-8",
    text: {
      original: "Think like a queen. A queen is not afraid to fail.",
      de: "Denke wie eine K\xF6nigin. Eine K\xF6nigin hat keine Angst zu scheitern.",
      en: "Think like a queen. A queen is not afraid to fail.",
      it: "Pensa come una regina. Una regina non ha paura di fallire.",
      fr: "Pense comme une reine. Une reine n'a pas peur d'\xE9chouer.",
      es: "Piensa como una reina. Una reina no tiene miedo de fracasar."
    },
    author: "Oprah Winfrey",
    category: "mut",
    originalLanguage: "en",
    tags: ["mut", "selbstvertrauen", "frauen"],
    verified: true,
    authorBio: {
      de: "US-amerikanische Talkshow-Moderatorin und Unternehmerin (*1954).",
      en: "American talk show host and entrepreneur (b. 1954)."
    }
  }
];
var QUOTE_COUNT = QUOTES.length;

// src/categories.ts
var CATEGORIES = [
  "motivation",
  "weisheit",
  "liebe",
  "leben",
  "erfolg",
  "glueck",
  "freundschaft",
  "mut",
  "hoffnung",
  "natur",
  "humor",
  "wissenschaft",
  "kunst"
];
var CATEGORY_LABELS = {
  motivation: "Motivation",
  weisheit: "Weisheit",
  liebe: "Liebe",
  leben: "Leben",
  erfolg: "Erfolg",
  glueck: "Gl\xFCck",
  freundschaft: "Freundschaft",
  mut: "Mut",
  hoffnung: "Hoffnung",
  natur: "Natur",
  humor: "Humor",
  wissenschaft: "Wissenschaft",
  kunst: "Kunst"
};
var THEME_DECKS = [
  {
    id: "stoizismus",
    label: "Stoizismus",
    description: "Gelassenheit und innere St\xE4rke",
    authors: ["Marcus Aurelius", "Seneca", "Epiktet"]
  },
  {
    id: "feminismus",
    label: "Feminismus",
    description: "Gleichberechtigung und Selbstbestimmung",
    authors: ["Simone de Beauvoir", "Virginia Woolf", "Maya Angelou", "Marie Curie", "Frida Kahlo"]
  },
  {
    id: "unternehmertum",
    label: "Unternehmertum",
    description: "Innovation und Durchhalteverm\xF6gen",
    authors: ["Steve Jobs", "Henry Ford", "Thomas Edison", "Walt Disney"]
  },
  {
    id: "philosophie",
    label: "Philosophie",
    description: "Die gro\xDFen Fragen des Lebens",
    authors: [
      "Sokrates",
      "Platon",
      "Aristoteles",
      "Immanuel Kant",
      "Friedrich Nietzsche",
      "Konfuzius",
      "Laozi"
    ]
  },
  {
    id: "literatur",
    label: "Literatur",
    description: "Worte der gro\xDFen Dichter und Schriftsteller",
    authors: [
      "Johann Wolfgang von Goethe",
      "Oscar Wilde",
      "Mark Twain",
      "William Shakespeare",
      "Rainer Maria Rilke"
    ]
  }
];
function getCategoryLabel(category) {
  return CATEGORY_LABELS[category];
}
function isValidCategory(value) {
  return CATEGORIES.includes(value);
}

// src/utils.ts
function getRandomQuote() {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
}
function getDailyQuote(date = /* @__PURE__ */ new Date()) {
  const dateStr = date.toISOString().split("T")[0];
  const hash = hashString(dateStr);
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}
var _categoryIndex = null;
function getCategoryIndex() {
  if (!_categoryIndex) {
    _categoryIndex = /* @__PURE__ */ new Map();
    for (const cat of CATEGORIES) _categoryIndex.set(cat, []);
    for (const q of QUOTES) _categoryIndex.get(q.category)?.push(q);
  }
  return _categoryIndex;
}
function getQuotesByCategory(category) {
  return getCategoryIndex().get(category) ?? [];
}
function getRandomQuoteByCategory(category) {
  const quotes = getQuotesByCategory(category);
  if (quotes.length === 0) return null;
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}
function searchQuotes(searchText, language = "de") {
  const lowerSearch = searchText.toLowerCase();
  return QUOTES.filter((q) => {
    const text = language === "original" ? q.text.original : q.text[language];
    return text.toLowerCase().includes(lowerSearch) || q.author.toLowerCase().includes(lowerSearch);
  });
}
function getQuoteById(id) {
  return QUOTES.find((q) => q.id === id);
}
function getQuoteByIndex(index) {
  if (index < 1 || index > QUOTES.length) return null;
  return QUOTES[index - 1];
}
function getAllCategories() {
  return CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    count: QUOTES.filter((q) => q.category === category).length
  }));
}
function getCategoryByName(name) {
  const lowerName = name.toLowerCase();
  if (CATEGORIES.includes(lowerName)) {
    return lowerName;
  }
  for (const category of CATEGORIES) {
    if (category.startsWith(lowerName) || CATEGORY_LABELS[category].toLowerCase().startsWith(lowerName)) {
      return category;
    }
  }
  return null;
}
function getQuoteText(quote, language = "de") {
  if (language === "original") {
    return quote.text.original;
  }
  return quote.text[language];
}
function formatQuote(quote, language = "de") {
  const text = getQuoteText(quote, language);
  const categoryLabel = CATEGORY_LABELS[quote.category];
  return `"${text}"

\u2014 *${quote.author}*

[${categoryLabel}]`;
}
function formatQuoteWithNumber(quote, number, language = "de") {
  const text = getQuoteText(quote, language);
  const categoryLabel = CATEGORY_LABELS[quote.category];
  return `**#${number}**
"${text}"

\u2014 *${quote.author}* [${categoryLabel}]`;
}
function getTotalCount() {
  return QUOTES.length;
}
function getQuotesByTag(tag) {
  const lowerTag = tag.toLowerCase();
  return QUOTES.filter((q) => q.tags?.some((t) => t.toLowerCase() === lowerTag));
}
function getAllTags() {
  const tags = /* @__PURE__ */ new Set();
  QUOTES.forEach((q) => q.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}
var _authorIndex = null;
function getAuthorIndex() {
  if (!_authorIndex) {
    _authorIndex = /* @__PURE__ */ new Map();
    for (const q of QUOTES) {
      const key = q.author.toLowerCase();
      let arr = _authorIndex.get(key);
      if (!arr) {
        arr = [];
        _authorIndex.set(key, arr);
      }
      arr.push(q);
    }
  }
  return _authorIndex;
}
function getQuotesByAuthor(author) {
  const lowerAuthor = author.toLowerCase();
  const exact = getAuthorIndex().get(lowerAuthor);
  if (exact) return exact;
  const results = [];
  for (const [key, quotes] of getAuthorIndex()) {
    if (key.includes(lowerAuthor)) results.push(...quotes);
  }
  return results;
}
function getAllAuthors() {
  const map = /* @__PURE__ */ new Map();
  for (const q of QUOTES) {
    let info = map.get(q.author);
    if (!info) {
      info = { name: q.author, quoteCount: 0, categories: [], bio: q.authorBio };
      map.set(q.author, info);
    }
    info.quoteCount++;
    if (!info.categories.includes(q.category)) {
      info.categories.push(q.category);
    }
    if (!info.bio && q.authorBio) info.bio = q.authorBio;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.quoteCount - a.quoteCount || a.name.localeCompare(b.name)
  );
}
function getVerifiedQuotes() {
  return QUOTES.filter((q) => q.verified === true);
}
function getQuotesByYearRange(startYear, endYear) {
  return QUOTES.filter((q) => q.year !== void 0 && q.year >= startYear && q.year <= endYear);
}
function getQuotesByOriginalLanguage(language) {
  return QUOTES.filter((q) => q.originalLanguage === language);
}
function getQuotesByThemeDeck(deckId) {
  const deck = THEME_DECKS.find((d) => d.id === deckId);
  if (!deck) return [];
  const authorSet = new Set(deck.authors.map((a) => a.toLowerCase()));
  return QUOTES.filter((q) => authorSet.has(q.author.toLowerCase()));
}
function fuzzySearchQuotes(query, language = "de", threshold = 0.3) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  if (normalizedQuery.length <= 2) return searchQuotes(query, language);
  const queryBigrams = toBigrams(normalizedQuery);
  return QUOTES.filter((q) => {
    const text = language === "original" ? q.text.original : q.text[language];
    const haystack = `${text} ${q.author}`.toLowerCase();
    if (haystack.includes(normalizedQuery)) return true;
    const queryWords = normalizedQuery.split(/\s+/);
    return queryWords.every((word) => {
      if (haystack.includes(word)) return true;
      if (word.length <= 2) return false;
      const wordBigrams = toBigrams(word);
      return haystack.split(/\s+/).some((hw) => {
        if (hw.length <= 2) return false;
        return bigramSimilarity(wordBigrams, toBigrams(hw)) >= threshold;
      });
    });
  });
}
function toBigrams(s) {
  const bigrams = /* @__PURE__ */ new Set();
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.slice(i, i + 2));
  }
  return bigrams;
}
function bigramSimilarity(a, b) {
  let intersection = 0;
  for (const bigram of a) {
    if (b.has(bigram)) intersection++;
  }
  return 2 * intersection / (a.size + b.size);
}
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}
export {
  CATEGORIES,
  CATEGORY_LABELS,
  ORIGINAL_LANGUAGES,
  QUOTES,
  QUOTE_COUNT,
  SUPPORTED_LANGUAGES,
  THEME_DECKS,
  formatQuote,
  formatQuoteWithNumber,
  fuzzySearchQuotes,
  getAllAuthors,
  getAllCategories,
  getAllTags,
  getCategoryByName,
  getCategoryLabel,
  getDailyQuote,
  getQuoteById,
  getQuoteByIndex,
  getQuoteText,
  getQuotesByAuthor,
  getQuotesByCategory,
  getQuotesByOriginalLanguage,
  getQuotesByTag,
  getQuotesByThemeDeck,
  getQuotesByYearRange,
  getRandomQuote,
  getRandomQuoteByCategory,
  getTotalCount,
  getVerifiedQuotes,
  isValidCategory,
  searchQuotes
};
//# sourceMappingURL=index.js.map