/* ═══════════════════════════════════════════
   DATOS DE LIGAS Y EQUIPOS — Temporada 2026/27
   ═══════════════════════════════════════════ */

const LEAGUES = {
  champions: {
    name: "Champions League",
    flag: "⭐",
    roundType: "cup", // jornadas de copa
    teams: {
      aek: { name: "AEK Athens", flag: "🇬🇷" },
      arsenal: { name: "Arsenal", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      astonvilla: { name: "Aston Villa", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      atletico: { name: "Atlético Madrid", flag: "🇪🇸" },
      barcelona: { name: "Barcelona", flag: "🇪🇸" },
      bayernm: { name: "Bayern München", flag: "🇩🇪" },
      bodo: { name: "Bodø/Glimt", flag: "🇳🇴" },
      dortmund: { name: "Borussia Dortmund", flag: "🇩🇪" },
      brugge: { name: "Club Brugge", flag: "🇧🇪" },
      como: { name: "Como", flag: "🇮🇹" },
      fenerbahce: { name: "Fenerbahçe", flag: "🇹🇷" },
      feyenoord: { name: "Feyenoord", flag: "🇳🇱" },
      galatasaray: { name: "Galatasaray", flag: "🇹🇷" },
      inter: { name: "Inter de Milán", flag: "🇮🇹" },
      lask: { name: "LASK", flag: "🇦🇹" },
      leipzig: { name: "RB Leipzig", flag: "🇩🇪" },
      lens: { name: "Lens", flag: "🇫🇷" },
      lille: { name: "Lille", flag: "🇫🇷" },
      liverpool: { name: "Liverpool", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      mancity: { name: "Manchester City", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      manutd: { name: "Manchester United", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      napoli: { name: "Nápoles", flag: "🇮🇹" },
      psg: { name: "PSG", flag: "🇫🇷" },
      porto: { name: "Porto", flag: "🇵🇹" },
      psv: { name: "PSV Eindhoven", flag: "🇳🇱" },
      betis: { name: "Real Betis", flag: "🇪🇸" },
      realmadrid: { name: "Real Madrid", flag: "🇪🇸" },
      roma: { name: "Roma", flag: "🇮🇹" },
      sabah: { name: "Sabah Baku", flag: "🇦🇿" },
      shakhtar: { name: "Shakhtar Donetsk", flag: "🇺🇦" },
      slavia: { name: "Slavia Praha", flag: "🇨🇿" },
      slovan: { name: "Slovan Bratislava", flag: "🇸🇰" },
      sporting: { name: "Sporting CP", flag: "🇵🇹" },
      stuttgart: { name: "Stuttgart", flag: "🇩🇪" },
      viking: { name: "Viking", flag: "🇳🇴" },
      villarreal: { name: "Villarreal", flag: "🇪🇸" }
    }
  },

  europa: {
    name: "Europa League",
    flag: "🟠",
    roundType: "cup",
    teams: {
      sunderland: { name: "Sunderland", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      crystalpalace: { name: "Crystal Palace", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      bournemouth: { name: "Bournemouth", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      realsociedad: { name: "Real Sociedad", flag: "🇪🇸" },
      celta: { name: "Celta de Vigo", flag: "🇪🇸" },
      salzburgo: { name: "Salzburgo", flag: "🇦🇹" },
      sturmgraz: { name: "Sturm Graz", flag: "🇦🇹" },
      plzen: { name: "Plzen", flag: "🇨🇿" },
      spartapraga: { name: "Sparta Praga", flag: "🇨🇿" },
      anderlecht: { name: "Anderlecht", flag: "🇧🇪" },
      royalunion: { name: "Royale Union SG", flag: "🇧🇪" },
      marsella: { name: "Marsella", flag: "🇫🇷" },
      rennais: { name: "Stade Rennais", flag: "🇫🇷" },
      lyon: { name: "Lyon", flag: "🇫🇷" },
      leverkusen: { name: "Bayer Leverkusen", flag: "🇩🇪" },
      hoffenheim: { name: "Hoffenheim", flag: "🇩🇪" },
      juventus: { name: "Juventus", flag: "🇮🇹" },
      acmilan: { name: "AC Milan", flag: "🇮🇹" },
      nijmegen: { name: "Nijmegen", flag: "🇳🇱" },
      azalkmaar: { name: "AZ Alkmaar", flag: "🇳🇱" },
      torreense: { name: "Torreense", flag: "🇵🇹" },
      levski: { name: "Levski", flag: "🇧🇬" },
      dinazagreb: { name: "Dínamo Zagreb", flag: "🇭🇷" },
      omonia: { name: "Omonia", flag: "🇨🇾" },
      oficreta: { name: "OFI Creta", flag: "🇬🇷" },
      olympiacos: { name: "Olympiacos", flag: "🇬🇷" },
      beersheva: { name: "H. Beer Sheva", flag: "🇮🇱" },
      lillestrom: { name: "Lilleström", flag: "🇳🇴" },
      jagiellonia: { name: "Jagiellonia", flag: "🇵🇱" },
      lechpoznan: { name: "Lech Poznan", flag: "🇵🇱" },
      benfica: { name: "Benfica", flag: "🇵🇹" },
      celtic: { name: "Celtic", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
      celje: { name: "Celje", flag: "🇸🇮" },
      besiktas: { name: "Beşiktaş", flag: "🇹🇷" },
      ferencvaros: { name: "Ferencvaros", flag: "🇭🇺" },
      araratarmenia: { name: "Ararat-Armenia", flag: "🇦🇲" }
    }
  },

  laliga: {
    name: "LaLiga",
    flag: "🇪🇸",
    roundType: "league",
    totalRounds: 38,
    teams: {
      barcelona: { name: "Barcelona", flag: "🇪🇸" },
      realmadrid: { name: "Real Madrid", flag: "🇪🇸" },
      alaves: { name: "Alavés", flag: "🇪🇸" },
      sevilla: { name: "Sevilla", flag: "🇪🇸" },
      betis: { name: "Real Betis", flag: "🇪🇸" },
      depocoruna: { name: "Deportivo A Coruña", flag: "🇪🇸" },
      espanyol: { name: "Espanyol", flag: "🇪🇸" },
      atletico: { name: "Atlético de Madrid", flag: "🇪🇸" },
      athletic: { name: "Athletic Club", flag: "🇪🇸" },
      racing: { name: "R. Racing Club", flag: "🇪🇸" },
      realsociedad: { name: "Real Sociedad", flag: "🇪🇸" },
      osasuna: { name: "Osasuna", flag: "🇪🇸" },
      levante: { name: "Levante", flag: "🇪🇸" },
      getafe: { name: "Getafe", flag: "🇪🇸" },
      rayo: { name: "Rayo Vallecano", flag: "🇪🇸" },
      celta: { name: "Celta de Vigo", flag: "🇪🇸" },
      villarreal: { name: "Villarreal", flag: "🇪🇸" },
      malaga: { name: "Málaga", flag: "🇪🇸" },
      elche: { name: "Elche", flag: "🇪🇸" },
      valencia: { name: "Valencia", flag: "🇪🇸" }
    }
  },

  premier: {
    name: "Premier League",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    roundType: "league",
    totalRounds: 38,
    teams: {
      arsenal: { name: "Arsenal", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      mancity: { name: "Manchester City", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      hull: { name: "Hull", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      chelsea: { name: "Chelsea", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      brentford: { name: "Brentford", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      liverpool: { name: "Liverpool", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      everton: { name: "Everton", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      ipswich: { name: "Ipswich", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      newcastle: { name: "Newcastle", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      leeds: { name: "Leeds Utd", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      nottingham: { name: "Nottingham Forest", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      brighton: { name: "Brighton", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      manutd: { name: "Manchester Utd", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      sunderland: { name: "Sunderland", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      bournemouth: { name: "Bournemouth", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      crystalpalace: { name: "Crystal Palace", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      tottenham: { name: "Tottenham", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      fulham: { name: "Fulham", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      astonvilla: { name: "Aston Villa", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      coventry: { name: "Coventry", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }
    }
  },

  seriea: {
    name: "Serie A",
    flag: "🇮🇹",
    roundType: "league",
    totalRounds: 38,
    teams: {
      lazio: { name: "Lazio", flag: "🇮🇹" },
      roma: { name: "Roma", flag: "🇮🇹" },
      inter: { name: "Inter", flag: "🇮🇹" },
      cagliari: { name: "Cagliari", flag: "🇮🇹" },
      acmilan: { name: "AC Milan", flag: "🇮🇹" },
      como: { name: "Como", flag: "🇮🇹" },
      juventus: { name: "Juventus", flag: "🇮🇹" },
      frosinone: { name: "Frosinone", flag: "🇮🇹" },
      atalanta: { name: "Atalanta", flag: "🇮🇹" },
      udinese: { name: "Udinese", flag: "🇮🇹" },
      sassuolo: { name: "Sassuolo", flag: "🇮🇹" },
      napoli: { name: "Nápoles", flag: "🇮🇹" },
      torino: { name: "Torino", flag: "🇮🇹" },
      lecce: { name: "Lecce", flag: "🇮🇹" },
      fiorentina: { name: "Fiorentina", flag: "🇮🇹" },
      bolonia: { name: "Bolonia", flag: "🇮🇹" },
      parma: { name: "Parma", flag: "🇮🇹" },
      monza: { name: "Monza", flag: "🇮🇹" },
      genoa: { name: "Genoa", flag: "🇮🇹" },
      venezia: { name: "Venezia", flag: "🇮🇹" }
    }
  },

  ligue1: {
    name: "Ligue 1",
    flag: "🇫🇷",
    roundType: "league",
    totalRounds: 34,
    teams: {
      monaco: { name: "Mónaco", flag: "🇲🇨" },
      rennais: { name: "Stade Rennais", flag: "🇫🇷" },
      parisfc: { name: "Paris FC", flag: "🇫🇷" },
      lyon: { name: "Lyon", flag: "🇫🇷" },
      lille: { name: "Lille", flag: "🇫🇷" },
      estrasburgo: { name: "Estrasburgo", flag: "🇫🇷" },
      brest: { name: "Brest", flag: "🇫🇷" },
      lorient: { name: "Lorient", flag: "🇫🇷" },
      angers: { name: "Angers", flag: "🇫🇷" },
      troyes: { name: "Troyes", flag: "🇫🇷" },
      lens: { name: "Lens", flag: "🇫🇷" },
      marsella: { name: "Marsella", flag: "🇫🇷" },
      auxerre: { name: "Auxerre", flag: "🇫🇷" },
      lemans: { name: "Le Mans", flag: "🇫🇷" },
      psg: { name: "PSG", flag: "🇫🇷" },
      lehavre: { name: "Le Havre", flag: "🇫🇷" },
      toulouse: { name: "Toulouse", flag: "🇫🇷" },
      niza: { name: "Niza", flag: "🇫🇷" }
    }
  },

  bundesliga: {
    name: "Bundesliga",
    flag: "🇩🇪",
    roundType: "league",
    totalRounds: 34,
    teams: {
      friburgo: { name: "Friburgo", flag: "🇩🇪" },
      dortmund: { name: "Borussia Dortmund", flag: "🇩🇪" },
      augsburgo: { name: "Augsburgo", flag: "🇩🇪" },
      elversberg: { name: "Elversberg", flag: "🇩🇪" },
      bayernm: { name: "Bayern München", flag: "🇩🇪" },
      leverkusen: { name: "Bayer Leverkusen", flag: "🇩🇪" },
      mainz: { name: "Mainz", flag: "🇩🇪" },
      eintracht: { name: "Eintracht Fráncfort", flag: "🇩🇪" },
      werder: { name: "Werder Bremen", flag: "🇩🇪" },
      schalke: { name: "Schalke", flag: "🇩🇪" },
      colonia: { name: "Colonia", flag: "🇩🇪" },
      leipzig: { name: "RB Leipzig", flag: "🇩🇪" },
      hoffenheim: { name: "Hoffenheim", flag: "🇩🇪" },
      stuttgart: { name: "Stuttgart", flag: "🇩🇪" },
      paderborn: { name: "Paderborn", flag: "🇩🇪" },
      unionberlin: { name: "Union Berlin", flag: "🇩🇪" },
      hamburgo: { name: "Hamburgo", flag: "🇩🇪" },
      mgladbach: { name: "Borussia M'gladbach", flag: "🇩🇪" }
    }
  }
};

/* Jornadas limpias para copas (Champions / Europa League) sin fechas estáticas */
const CUP_ROUNDS = [
  ['1', 'Jornada 1'],
  ['2', 'Jornada 2'],
  ['3', 'Jornada 3'],
  ['4', 'Jornada 4'],
  ['5', 'Jornada 5'],
  ['6', 'Jornada 6'],
  ['7', 'Jornada 7'],
  ['8', 'Jornada 8'],
  ['16avos', '16avos de final'],
  ['8avos', 'Octavos de final'],
  ['4avos', 'Cuartos de final'],
  ['SF', 'Semifinales'],
  ['Final', 'Final']
];

function getRoundsForLeague(ligaKey) {
  const liga = LEAGUES[ligaKey];
  if (!liga) return [];
  if (liga.roundType === 'cup') return CUP_ROUNDS;
  
  const rounds = [];
  for (let i = 1; i <= liga.totalRounds; i++) {
    rounds.push([String(i), `Jornada ${i}`]);
  }
  return rounds;
}

function getTeam(ligaKey, teamId) {
  return LEAGUES[ligaKey]?.teams?.[teamId] || { name: teamId, flag: '⚽' };
}
