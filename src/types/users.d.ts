import { GameMode } from "./index.js";

export interface LobbyResponse {
  canStartActivity: boolean;
  gameConfig: {
    allowablePremadeSizes: number[];
    customLobbyName: string;
    customMutatorName: string;
    customRewardsDisabledReasons: string[];
    customSpectatorPolicy: string;
    customSpectators: any[];
    customTeam100: any[];
    customTeam200: any[];
    gameMode: GameMode;
    isCustom: boolean;
    isLobbyFull: boolean;
    isTeamBuilderManaged: boolean;
    mapId: number;
    maxHumanPlayers: number;
    maxLobbySize: number;
    maxLobbySpectatorCount: number;
    maxTeamSize: number;
    numPlayersPerTeam: number;
    numberOfTeamsInLobby: number;
    pickType: string;
    premadeSizeAllowed: boolean;
    queueId: number;
    shouldForceScarcePositionSelection: boolean;
    showPositionSelector: boolean;
    showQuickPlaySlotSelection: boolean;
  };
  invitations: Invitation[];
  localMember: LobbyMember;
  members: LobbyMember[];
  mucJwtDto: {
    channelClaim: string;
    domain: string;
    jwt: string;
    targetRegion: string;
  };
  multiUserChatId: string;
  multiUserChatPassword: string;
  partyId: string;
  partyType: string;
  popularChampions: any[];
  restrictions: any[];
  scarcePositions: any[];
  warnings: any[];
}

export interface Invitation {
  invitationId: string;
  invitationType: string;
  state: "Accepted" | "OnHold" | "Declined" | "Pending";
  timestamp: string;
  toSummonerId: number;
  toSummonerName: string;
}

export interface LobbyMember {
  allowedChangeActivity: boolean;
  allowedInviteOthers: boolean;
  allowedKickOthers: boolean;
  allowedStartActivity: boolean;
  allowedToggleInvite: boolean;
  autoFillEligible: boolean;
  autoFillProtectedForPromos: boolean;
  autoFillProtectedForRemedy: boolean;
  autoFillProtectedForSoloing: boolean;
  autoFillProtectedForStreaking: boolean;
  botChampionId: number;
  botDifficulty: string;
  botId: string;
  botPosition: string;
  botUuid: string;
  firstPositionPreference: string;
  intraSubteamPosition: null;
  isBot: boolean;
  isLeader: boolean;
  isSpectator: boolean;
  memberData: any;
  playerSlots: any[];
  puuid: string;
  ready: boolean;
  secondPositionPreference: string;
  showGhostedBanner: boolean;
  strawberryMapId: null;
  subteamIndex: null;
  summonerIconId: number;
  summonerId: number;
  summonerInternalName: string;
  summonerLevel: number;
  summonerName: string;
  teamId: number;
}

export interface FriendlistFriend {
  summonerId: number;
  gameName: string;
  availability: string | "online" | "offline" | "mobile" | "dnd";
  // Only the necessary props
}

export interface CloseFriends {
  Jasmy: CloseFriendInfo;
  babyclaps: CloseFriendInfo;
  bopped: CloseFriendInfo;
  Ghettoven: CloseFriendInfo;
  Farewell: CloseFriendInfo;
  Ecci: CloseFriendInfo;
  Twelve: CloseFriendInfo;
  maidcafe: CloseFriendInfo;
  Kittzie: CloseFriendInfo;
  Onixy: CloseFriendInfo;
  Magdora: CloseFriendInfo;
}

export interface CloseFriendInfo {
  name: string;
  actualName: string;
  summonerId: number;
}

export interface ChampSelectPlayer {
  cellId: number;
  championId: number;
  // Only the necessary props
}

export interface ChampSelectSession {
  localPlayerCellId: number;
  myTeam: ChampSelectPlayer[];
  // Only the necessary props
}

export interface ChampInfo {
  name: string;
}
