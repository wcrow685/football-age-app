export const translations = {
  en: {
    // Header
    title: "How Many Football Players\nAre Older Than Me?",
    subtitle: "Find out how you compare in age to today's top active football players across the world's biggest leagues.",

    // Input
    enterBirthDate: "Enter Your Birth Date",
    day: "Day",
    month: "Month",
    year: "Year",
    compareBtn: "Compare Me →",
    serverWaking: "Server is waking up, please wait a moment...",
    hint: (total) => `Based on ${total} active players from Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Süper Lig, Saudi Pro League & MLS (2025-26 season).`,
    orCompareFamous: "Or compare with a famous player",

    // Months
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],

    // Big result
    olderThanYou: "active football players are older than",
    you: "you",
    outOf: (total) => `out of ${total} players in our database`,

    // Stat cards
    yourAge: "Your Age",
    yearsOld: "years old",
    olderThanYouLabel: "Older Than You",
    ofPlayers: (pct) => `${pct}% of players`,
    youngerThanYou: "Younger Than You",
    youreOlderThan: "You're Older Than",
    ofAllPlayers: "of all players",

    // Player list
    playersOlderTitle: (n) => `Players Older Than You (${n})`,
    sortedOldest: "Sorted from oldest to youngest",
    all: "All",
    noPlayersLeague: "No players older than you in this league.",
    showAll: (n) => `Show all ${n} players ↓`,

    // Table headers
    colPlayer: "Player",
    colClub: "Club",
    colLeague: "League",
    colNationality: "Nationality",
    colAge: "Age",
    colBorn: "Born",

    // Birthday section
    sameBirthdayTitle: "Same Birthday as You 🎂",
    sameBirthdayDesc: "Players born on the same day & month — any year",
    noBirthday: "No players share your birthday.",

    // Charts
    olderByLeague: "Older Players by League",
    olderByLeagueDesc: "Number of players older than you in each league",
    topNationalities: "Top Nationalities — Older Players",
    topNationalitiesDesc: "Which countries have the most players older than you",
    ageDistTitle: "Age Distribution of All Players",
    ageDistDesc: (total, age) => `Where you stand among all ${total} players — the green line marks your age (${age})`,
    youLabel: "You",
    playersLabel: "Players",
    ageLabel: (n) => `Age ${n}`,

    // League table
    leagueBreakdown: "Full League Breakdown",
    leagueCol: "League",
    olderCol: "Older than you",
    shareCol: "Share",

    // Reset
    tryAnother: "Try Another Date",

    // Share
    shareResult: "Share your result",
    shareOnX: "Share on X",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    shareText: (older, total, famousPlayer) =>
      famousPlayer
        ? `${famousPlayer} is older than ${older} out of ${total} active professional footballers! ⚽ How do you compare?`
        : `I'm older than ${older} out of ${total} active professional footballers! ⚽ How do you compare?`,

    // Footer
    footer: "Data from ESPN · 2025-26 season · For entertainment purposes only.",
  },

  tr: {
    // Header
    title: "Kaç Futbolcu\nBenden Daha Yaşlı?",
    subtitle: "Dünyanın en büyük liglerindeki aktif profesyonel futbolcularla yaşını karşılaştır.",

    // Input
    enterBirthDate: "Doğum Tarihini Gir",
    day: "Gün",
    month: "Ay",
    year: "Yıl",
    compareBtn: "Karşılaştır →",
    serverWaking: "Sunucu uyanıyor, lütfen bekle...",
    hint: (total) => `Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Süper Lig, Suudi Pro Ligi ve MLS'den ${total} aktif oyuncuya göre (2025-26 sezonu).`,
    orCompareFamous: "Ya da ünlü bir oyuncuyla karşılaştır",

    // Months
    months: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],

    // Big result
    olderThanYou: "futbolcu senden daha yaşlı",
    you: "",
    outOf: (total) => `veritabanımızdaki ${total} oyuncu içinden`,

    // Stat cards
    yourAge: "Yaşın",
    yearsOld: "yaşında",
    olderThanYouLabel: "Senden Yaşlı",
    ofPlayers: (pct) => `oyuncuların %${pct}'i`,
    youngerThanYou: "Senden Genç",
    youreOlderThan: "Sen Daha Büyüksün",
    ofAllPlayers: "tüm oyunculardan",

    // Player list
    playersOlderTitle: (n) => `Senden Yaşlı Oyuncular (${n})`,
    sortedOldest: "En yaşlıdan en gence",
    all: "Tümü",
    noPlayersLeague: "Bu ligde senden yaşlı oyuncu yok.",
    showAll: (n) => `Tüm ${n} oyuncuyu göster ↓`,

    // Table headers
    colPlayer: "Oyuncu",
    colClub: "Kulüp",
    colLeague: "Lig",
    colNationality: "Uyruk",
    colAge: "Yaş",
    colBorn: "Doğum",

    // Birthday section
    sameBirthdayTitle: "Seninle Aynı Doğum Günü 🎂",
    sameBirthdayDesc: "Aynı gün ve ay doğan oyuncular — farklı yıllar",
    noBirthday: "Doğum gününü paylaşan oyuncu bulunamadı.",

    // Charts
    olderByLeague: "Lige Göre Senden Yaşlı Oyuncular",
    olderByLeagueDesc: "Her ligde senden kaç oyuncu daha yaşlı",
    topNationalities: "En Fazla Yaşlı Oyuncu — Milliyete Göre",
    topNationalitiesDesc: "Hangi ülkede senden en fazla yaşlı oyuncu var",
    ageDistTitle: "Tüm Oyuncuların Yaş Dağılımı",
    ageDistDesc: (total, age) => `Tüm ${total} oyuncu arasındaki yerin — yeşil çizgi senin yaşını (${age}) gösteriyor`,
    youLabel: "Sen",
    playersLabel: "Oyuncu",
    ageLabel: (n) => `${n} Yaş`,

    // League table
    leagueBreakdown: "Lig Bazında Tam Döküm",
    leagueCol: "Lig",
    olderCol: "Senden Yaşlı",
    shareCol: "Oran",

    // Reset
    tryAnother: "Başka Tarih Dene",

    // Share
    shareResult: "Sonucunu paylaş",
    shareOnX: "X'te Paylaş",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    shareText: (older, total, famousPlayer) =>
      famousPlayer
        ? `${famousPlayer}, ${total} aktif profesyonel futbolcudan ${older} tanesinden yaşlı! ⚽ Ya sen?`
        : `${total} aktif profesyonel futbolcudan ${older} tanesinden daha yaşlıyım! ⚽ Ya sen?`,

    // Footer
    footer: "Veriler ESPN'den · 2025-26 sezonu · Yalnızca eğlence amaçlıdır.",
  },
};
