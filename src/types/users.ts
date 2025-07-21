export interface Party {
  gameConfig: {
    isCustom: boolean;
    isLobbyFull: boolean;
    mapId: number;
    maxHumanPlayers: number;
    pickType: string;
    queueId: number;
    showPositionSelector: boolean;
  };
  localMember: {
    summonerId: number;
    puuid: string;
    summonerName: string;
    isLeader: boolean;
    ready: boolean;
    teamId: number;
  };
  members: PartyMember[];
  canStartActivity: boolean;
}

export interface PartyMember {
  summonerId: number;
  puuid: string;
  summonerName: string;
  ready: boolean;
  isLeader: boolean;
  teamId: number;
  // Only the necessary props
}

export interface Friend {
  summonerId: number;
  gameName: string;
  availability: string | "online" | "offline" | "mobile" | "dnd";
  // Only the necessary props
}

export interface CloseFriend {
  name: string;
  actualName: string;
  id: number;
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
