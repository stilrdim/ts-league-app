export interface ChampionRuneRecEntry {
  championId: number;
  isOverride: boolean;
  runeRecommendations: RuneRecommendation[];
}

interface RuneRecommendation {
  position: string; // e.g. "NONE", "TOP"
  mapId: number; // 12 = Howling Abyss
  isDefaultPosition: boolean;
  minSummonerLevel: number;
  perkIds: number[]; // list of perk IDs
  primaryPerkStyleId: number;
  secondaryPerkStyleId: number;
  summonerSpellIds: number[]; // list of summoner spell IDs
  recommendationId: string; // e.g. "2025-07-16.000001"
}

export interface RunePagePayload {
  id?: number;
  name: string;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[];
  current: boolean;
}

export interface RunePage {
  autoModifiedSelections: any[]; // not detailed in your data, so use any[] or define if known
  current: boolean;
  id: number;
  isActive: boolean;
  isDeletable: boolean;
  isEditable: boolean;
  isRecommendationOverride: boolean;
  isTemporary: boolean;
  isValid: boolean;
  lastModified: number;
  name: string;
  order: number;
  pageKeystone: Perk;
  primaryStyleIconPath: string;
  primaryStyleId: number;
  primaryStyleName: string;
  quickPlayChampionIds: number[];
  recommendationChampionId: number;
  recommendationIndex: number;
  runeRecommendationId: string;
  secondaryStyleIconPath: string;
  secondaryStyleName: string;
  selectedPerkIds: number[];
  subStyleId: number;
  tooltipBgPath: string;
  uiPerks: Perk[];
}

export interface Perk {
  iconPath: string;
  id: number;
  name: string;
  slotType: string; // e.g. "kKeyStone", "kMixedRegularSplashable", "kStatMod"
  styleId: number;
}
