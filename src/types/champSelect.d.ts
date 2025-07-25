export interface ChampSelectSession {
  actions: Action[][];
  allowBattleBoost: boolean;
  allowDuplicatePicks: boolean;
  allowLockedEvents: boolean;
  allowRerolling: boolean;
  allowSkinSelection: boolean;
  allowSubsetChampionPicks: boolean;
  bans: {
    myTeamBans: number[];
    numBans: number;
    theirTeamBans: number[];
  };
  benchChampions: {
    championId: number;
    isPriority: boolean;
  }[];
  benchEnabled: boolean;
  boostableSkinCount: number;
  chatDetails: {
    mucJwtDto: {
      channelClaim: string;
      domain: string;
      jwt: string;
      targetRegion: string;
    };
    multiUserChatId: string;
    multiUserChatPassword: string;
  };
  counter: number;
  gameId: number;
  hasSimultaneousBans: boolean;
  hasSimultaneousPicks: boolean;
  id: string;
  isCustomGame: boolean;
  isLegacyChampSelect: boolean;
  isSpectating: boolean;
  localPlayerCellId: number;
  lockedEventIndex: number;
  myTeam: ChampSelectPlayer[];
  theirTeam: ChampSelectPlayer[];
  pickOrderSwaps: any[]; // you can refine this if needed
  positionSwaps: any[];
  queueId: number;
  rerollsRemaining: number;
  showQuitButton: boolean;
  skipChampionSelect: boolean;
  timer: {
    adjustedTimeLeftInPhase: number;
    internalNowInEpochMs: number;
    isInfinite: boolean;
    phase: string;
    totalTimeInPhase: number;
  };
  trades: any[]; // refine if needed
}

export interface ChampSelectPlayer {
  assignedPosition: string;
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  internalName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  pickMode: number;
  pickTurn: number;
  playerAlias: string;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
  wardSkinId: number;
}

export interface Action {
  actorCellId: number;
  championId: number;
  completed: boolean;
  duration: number;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  pickTurn: number;
  type: "pick" | "ban";
}
export type ChampSelectActionType = "ban" | "pick" | "trade" | "hover";
