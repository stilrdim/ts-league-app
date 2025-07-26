import { GameMode } from "./general.js";

export interface ChampPreference {
  name: string;
  prio: string;
  skillSwaps?: string[];
  mode?: string;
  prefType?: string;
}

export interface AllGameData {
  activePlayer: ActivePlayer;
  allPlayers: AllPlayer[];
  events: Events;
  gameData: GameData;
}

export interface ActivePlayer {
  abilities: Record<SkillKey, Ability>;
  championStats: ChampionStats;
  currentGold: number;
  fullRunes: FullRunes;
  level: number;
  riotId: string;
  summonerName: string;
  team: string;
}

export interface Ability {
  id: string;
  rawDescription: string;
  rawDisplayName: string;
}

export interface ChampionStats {
  abilityHaste: number;
  abilityPower: number;
  armor: number;
  armorPenetrationFlat: number;
  armorPenetrationPercent: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  bonusArmorPenetrationPercent: number;
  bonusMagicPenetrationPercent: number;
  cooldownReduction: number;
  critChance: number;
  critDamage: number;
  currentHealth: number;
  healthRegenRate: number;
  lifeSteal: number;
  magicLethality: number;
  magicPenetrationFlat: number;
  magicPenetrationPercent: number;
  magicResist: number;
  maxHealth: number;
  moveSpeed: number;
  physicalLethality: number;
  resourceMax: number;
  resourceRegenRate: number;
  resourceType: string;
  resourceValue: number;
  spellVamp: number;
  tenacity: number;
}

export interface FullRunes {
  generalRunes: Rune[];
  keystone: Rune;
  primaryRuneTree: string;
  secondaryRuneTree: string;
}

export interface Rune {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
}

export interface AllPlayer {
  championName: string;
  isBot: boolean;
  isDead: boolean;
  items: Item[];
  level: number;
  position: string;
  rawChampionName: string;
  respawnTimer: number;
  riotId: string;
  runes: Runes;
  scores: Scores;
  skinID: number;
  summonerName: string;
  summonerId: string;
  summonerSpells: SummonerSpells;
  team: string;
}

export interface Item {
  canUse: boolean;
  consumable: boolean;
  count: number;
  displayName: string;
  itemID: number;
  price: number;
  rawDescription: string;
  rawDisplayName: string;
  slot: number;
}

export interface Runes {
  generalRunes: Rune[];
  keystone: Rune;
  primaryRuneTree: string;
  secondaryRuneTree: string;
}

export interface Scores {
  assists: number;
  creepScore: number;
  deaths: number;
  kills: number;
  wardScore: number;
}

export interface SummonerSpells {
  summonerSpellOne: Spell;
  summonerSpellTwo: Spell;
}

export interface Spell {
  displayName: string;
  rawDescription: string;
  rawDisplayName: string;
}

export interface Events {
  Events: GameEvent[];
}

export interface GameEvent {
  EventID: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  VictimName?: string;
  Assisters?: string[];
  TurretKilled?: string;
  InhibKilled?: string;
  GoldGranted?: number;
}

export interface GameData {
  gameMode: GameMode;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
}

export type SkillKey = "Q" | "W" | "E" | "R";
