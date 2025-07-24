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
  | "EndOfGame";

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
