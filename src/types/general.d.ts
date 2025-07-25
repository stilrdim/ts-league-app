export interface GameFlowSession {
  phase: ClientState;
  gameData: {
    gameId: number;
    queue: {
      id: number;
      gameMode: string;
      gameTypeConfigId: number;
      name: string;
    };
    teamOne: GameflowPlayer[];
    teamTwo: GameflowPlayer[];
  };

  // Present during Champ Select
  gameClient?: {
    serverIp: string;
    serverPort: number;
    observerServerIp: string;
    observerServerPort: number;
    running: boolean;
    visible: boolean;
    processName: string;
    commandLine: string;
  };
}

export type ClientState =
  | "None"
  | "Lobby"
  | "Matchmaking"
  | "ReadyCheck"
  | "ChampSelect"
  | "GameStart"
  | "InProgress"
  | "Reconnect"
  | "WaitingForStats"
  | "PreEndOfGame"
  | "EndOfGame"
  | "Disconnected"; // Custom added for reconnection logic

type GameflowPlayer = {
  summonerId: number;
  accountId: number;
  puuid: string;
  summonerName: string;
  teamId: number;
  botPlayer: boolean;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  selectedPosition: string;
};

export interface ReadyCheck {
  state: "Invalid" | "InProgress" | "EveryoneReady" | "ReadyCheckEnded";
  playerResponse: "None" | "Accepted" | "Declined";
  timer: number;
  acceptance?: {
    hasAccepted: boolean;
    playerResponses: ("Accepted" | "Declined" | "None")[];
  };
}

export type GameMode =
  | "CLASSIC"
  | "ARAM"
  | "PRACTICETOOL"
  | "TUTORIAL"
  | "URF"
  | "ONEFORALL"
  | "NEXUSBLITZ"
  | "ULTBOOK";

export type QueueType =
  | "NORMAL"
  | "RANKED_SOLO_5x5"
  | "RANKED_FLEX_SR"
  | "ARAM"
  | "CLASH"
  | "OTHER";

export type SpectatorPolicy =
  | "AllAllowed"
  | "LobbyAllowed"
  | "FriendsAllowed"
  | "NotAllowed";

export type ItemCategory =
  | "Boots"
  | "Jungle"
  | "Lantern"
  | "Starting"
  | "Basic"
  | "Epic"
  | "Legendary"
  | "Mythic"
  | "Consumable";

export type LobbyMemberState = "NotReady" | "Ready" | "InGame" | "Afk";
