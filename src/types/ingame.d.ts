export interface ChampPreference {
  name: string;
  prio: string;
  skillSwaps?: string[];
  mode?: string;
  prefType?: string;
}

export interface AllGameData {
  activePlayer: ActivePlayer;
  allPlayers: Player[];
  gameData: GameData;
  events: GameEvents;
  // ... can include other props depending on version, but these are main
}

export interface ActivePlayer {
  summonerName: string;
  summonerId: string;
  riotId: string;
  puuid: string;
  team: number;
  championName: string;
  championId: number;
  skinID: number;
  currentGold: number;
  level: number;
  position: string;

  // In-game stats
  kills: number;
  deaths: number;
  assists: number;
  cs: number; // creep score
  wardScore: number;
  items: number[]; // item IDs
  summonerSpells: SummonerSpell[];
  perks: PerkInfo;
}

export interface Player {
  summonerName: string;
  summonerId: string;
  riotId: string;
  puuid: string;
  team: number;
  championName: string;
  championId: number;
  skinID: number;
  level: number;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  wardScore: number;
  items: number[];
  summonerSpells: SummonerSpell[];
  perks: PerkInfo;
  // Possibly more fields like rawChampionStats, rune stats, etc.
}

export interface GameData {
  map: MapInfo;
  gameTime: number; // seconds since game start
  gameMode: string;
  gameState: string;
}

export interface MapInfo {
  mapId: number;
  mapName: string;
}

export interface GameEvents {
  // event array or keyed event lists; varies by API version
}

export interface SummonerSpell {
  id: number;
  name: string;
  cooldown: number;
}

export interface PerkInfo {
  keystone: number; // keystone perk id
  primaryStyle: number;
  secondaryStyle: number;
  shards: number[];
}

export type SkillKey = "Q" | "W" | "E" | "R";
