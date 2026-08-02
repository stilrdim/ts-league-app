export interface GameFlowSession {
  phase: ClientState;
  gameData: {
    gameId: number;
    queue: {
      id: number;
      gameMode: GameMode;
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
  | "ULTBOOK"
  | "KIWI" // ARAM Mayhem
  | "KIWI_JADE" // ARAM Mayhem Classic-ish
  | "UNKNOWN";

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

export interface Config {
  AUTO_LEVEL_ABILITIES: boolean;
  SKIP_ENDGAME_SCREEN: boolean;
  AUTO_HONOR_FRIENDS: boolean;
  AUTO_QUEUE_UP: boolean;
  AUTO_ACCEPT_QUEUE: boolean;
  AUTO_INVITE_FRIENDS: boolean;
  AUTO_SELECT_RUNES: boolean;
  AUTO_SELECT_RECOMMENDED_RUNES: boolean;
  ONLY_FOR_ARAMS: boolean;
  POLLING_INTERVAL_IN_SECONDS: number;
  DISPLAY_RECOMMENDED_AUGMENTS_ARAM_MAYHEM: boolean;
  CONSIDER_GAME_AS_STARTED_AFTER_X_SECONDS: number;
}
