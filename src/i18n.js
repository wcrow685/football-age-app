// Strings that depend on who is being compared live in `me` (the visitor) and
// `them(player)` (a famous player picked from the grid), so the results page
// never says "your age" when it is showing Messi's.
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
    hint: (total) => `Based on ${total} active players from Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Liga Portugal, Süper Lig, Saudi Pro League & MLS (2026-27 season).`,
    orCompareFamous: "Or compare with a famous player",

    // Months
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],

    // Numbers
    decimalSep: ".",
    percent: (v) => `${v}%`,

    // Big result
    outOf: (total) => `out of ${total} players in our database`,

    // Stat cards
    yearsOld: "years old",
    ofPlayers: (pct) => `${pct}% of players`,
    ofAllPlayers: "of all players",

    // Player list
    sortedOldest: "Sorted from youngest to oldest",
    all: "All",
    showAll: (n) => `Show all ${n} players ↓`,

    // Table headers
    colPlayer: "Player",
    colClub: "Club",
    colLeague: "League",
    colNationality: "Nationality",
    colAge: "Age",
    colBorn: "Born",

    // Birthday section
    sameBirthdayDesc: "Players born on the same day & month — any year",

    // Charts
    topNationalities: "Top Nationalities — Older Players",
    ageDistTitle: "Age Distribution of All Players",
    playersLabel: "Players",
    ageLabel: (n) => `Age ${n}`,

    // League table
    leagueBreakdown: "Full League Breakdown",
    leagueCol: "League",
    shareCol: "Share",

    // Reset
    tryAnother: "Try Another Date",

    // Share
    shareResult: "Share your result",
    shareOnX: "Share on X",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    shareText: (older, total, famous) =>
      famous
        ? `${older} out of ${total} active professional footballers are older than ${famous.name}! ⚽ How do you compare?`
        : `${older} out of ${total} active professional footballers are older than me! ⚽ How do you compare?`,

    // Footer
    footer: "Data from ESPN · 2026-27 season · For entertainment purposes only.",
    errorTimeout: "Server is taking too long to respond. Please try again in a moment.",

    me: {
      bigBefore: "active football players are older than you",
      bigName: "",
      bigAfter: "",
      age: "Your Age",
      olderLabel: "Older Than You",
      youngerLabel: "Younger Than You",
      olderThanPctLabel: "You're Older Than",
      olderTitle: (n) => `Players Older Than You (${n})`,
      noPlayersLeague: "No players older than you in this league.",
      sameBirthdayTitle: "Same Birthday as You 🎂",
      noBirthday: "No players share your birthday.",
      olderByLeague: "Older Players by League",
      olderByLeagueDesc: "Number of players older than you in each league",
      topNationalitiesDesc: "Which countries have the most players older than you",
      ageDistDesc: (total, age) => `Where you stand among all ${total} players — the green line marks your age (${age})`,
      marker: "You",
      olderCol: "Older than you",
      twinTitle: "Your closest age twin",
      twinSub: (days) => days === 0 ? "Born on the very same day as you! 🤝"
        : `Born ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ${days > 0 ? "after" : "before"} you`,
    },

    them: ({ name }) => ({
      bigBefore: "active football players are older than ",
      bigName: name,
      bigAfter: "",
      age: `${name}'s Age`,
      olderLabel: `Older Than ${name}`,
      youngerLabel: `Younger Than ${name}`,
      olderThanPctLabel: `${name} Is Older Than`,
      olderTitle: (n) => `Players Older Than ${name} (${n})`,
      noPlayersLeague: `No players older than ${name} in this league.`,
      sameBirthdayTitle: `Same Birthday as ${name} 🎂`,
      noBirthday: `No other players share ${name}'s birthday.`,
      olderByLeague: "Older Players by League",
      olderByLeagueDesc: `Number of players older than ${name} in each league`,
      topNationalitiesDesc: `Which countries have the most players older than ${name}`,
      ageDistDesc: (total, age) => `Where ${name} stands among all ${total} players — the green line marks ${name}'s age (${age})`,
      marker: name,
      olderCol: `Older than ${name}`,
      twinTitle: `${name}'s closest age twin`,
      twinSub: (days) => days === 0 ? `Born on the very same day as ${name}! 🤝`
        : `Born ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ${days > 0 ? "after" : "before"} ${name}`,
    }),
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
    hint: (total) => `Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Liga Portugal, Süper Lig, Suudi Pro Ligi ve MLS'den ${total} aktif futbolcuya göre (2026-27 sezonu).`,
    orCompareFamous: "Ya da ünlü bir futbolcuyla karşılaştır",

    // Months
    months: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],

    // Numbers
    decimalSep: ",",
    percent: (v) => `%${v}`,

    // Big result
    outOf: (total) => `veritabanımızdaki ${total} futbolcu içinden`,

    // Stat cards
    yearsOld: "yaşında",
    ofPlayers: (pct) => `tüm futbolcular içinde %${pct}`,
    ofAllPlayers: "futbolcuların oranı",

    // Player list
    sortedOldest: "En gençten en yaşlıya",
    all: "Tümü",
    showAll: (n) => `Tüm ${n} futbolcuyu göster ↓`,

    // Table headers
    colPlayer: "Futbolcu",
    colClub: "Kulüp",
    colLeague: "Lig",
    colNationality: "Uyruk",
    colAge: "Yaş",
    colBorn: "Doğum",

    // Birthday section
    sameBirthdayDesc: "Aynı gün ve ayda doğan futbolcular — yıl fark etmez",

    // Charts
    topNationalities: "Ülkelere Göre Yaşlı Futbolcular",
    ageDistTitle: "Tüm Futbolcuların Yaş Dağılımı",
    playersLabel: "Futbolcu",
    ageLabel: (n) => `${n} Yaş`,

    // League table
    leagueBreakdown: "Liglere Göre Tam Döküm",
    leagueCol: "Lig",
    shareCol: "Oran",

    // Reset
    tryAnother: "Başka Tarih Dene",

    // Share
    shareResult: "Sonucunu paylaş",
    shareOnX: "X'te Paylaş",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    shareText: (older, total, famous) =>
      famous
        ? `${total} aktif profesyonel futbolcudan ${older} tanesi ${famous.trFrom || `${famous.name} ile karşılaştırıldığında`} daha yaşlı! ⚽ Ya sen?`
        : `${total} aktif profesyonel futbolcudan ${older} tanesi benden daha yaşlı! ⚽ Ya sen?`,

    // Footer
    footer: "Veriler ESPN'den · 2026-27 sezonu · Yalnızca eğlence amaçlıdır.",
    errorTimeout: "Sunucu yanıt vermekte gecikiyor. Lütfen birazdan tekrar dene.",

    me: {
      bigBefore: "aktif futbolcu senden daha yaşlı",
      bigName: "",
      bigAfter: "",
      age: "Yaşın",
      olderLabel: "Senden Yaşlı",
      youngerLabel: "Senden Genç",
      olderThanPctLabel: "Daha Büyük Olduğun",
      olderTitle: (n) => `Senden Yaşlı Futbolcular (${n})`,
      noPlayersLeague: "Bu ligde senden yaşlı futbolcu yok.",
      sameBirthdayTitle: "Seninle Aynı Doğum Günü 🎂",
      noBirthday: "Seninle aynı gün doğan futbolcu yok.",
      olderByLeague: "Liglere Göre Senden Yaşlı Futbolcular",
      olderByLeagueDesc: "Her ligde senden kaç futbolcu daha yaşlı",
      topNationalitiesDesc: "Senden yaşlı futbolcuların en çok olduğu ülkeler",
      ageDistDesc: (total, age) => `Tüm ${total} futbolcu arasındaki yerin — yeşil çizgi senin yaşını (${age}) gösteriyor`,
      marker: "Sen",
      olderCol: "Senden Yaşlı",
      twinTitle: "En yakın yaşıtın",
      twinSub: (days) => days === 0 ? "Seninle aynı gün doğmuş! 🤝"
        : `Senden ${Math.abs(days)} gün ${days > 0 ? "sonra" : "önce"} doğmuş`,
    },

    // Turkish suffixes depend on pronunciation, so the big label uses the
    // player's hand-written ablative form (`trFrom`, e.g. "Messi'den") and the
    // remaining labels refer to the player with the pronoun "o".
    them: ({ name, trFrom }) => ({
      bigBefore: "aktif futbolcu ",
      bigName: trFrom || name,
      bigAfter: " daha yaşlı",
      age: "Yaşı",
      olderLabel: "Ondan Yaşlı",
      youngerLabel: "Ondan Genç",
      olderThanPctLabel: "Daha Büyük Olduğu",
      olderTitle: (n) => `${trFrom || name} Yaşlı Futbolcular (${n})`,
      noPlayersLeague: "Bu ligde ondan yaşlı futbolcu yok.",
      sameBirthdayTitle: `${name} ile Aynı Doğum Günü 🎂`,
      noBirthday: "Onunla aynı gün doğan başka futbolcu yok.",
      olderByLeague: "Liglere Göre Ondan Yaşlı Futbolcular",
      olderByLeagueDesc: "Her ligde ondan kaç futbolcu daha yaşlı",
      topNationalitiesDesc: "Ondan yaşlı futbolcuların en çok olduğu ülkeler",
      ageDistDesc: (total, age) => `${name}, tüm ${total} futbolcu arasında nerede? Yeşil çizgi onun yaşını (${age}) gösteriyor`,
      marker: name,
      olderCol: "Ondan Yaşlı",
      twinTitle: "En yakın yaşıtı",
      twinSub: (days) => days === 0 ? "Onunla aynı gün doğmuş! 🤝"
        : `Ondan ${Math.abs(days)} gün ${days > 0 ? "sonra" : "önce"} doğmuş`,
    }),
  },
};
