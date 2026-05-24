import axios, { AxiosInstance } from "axios";
import { Agent } from "https";
import {
  authenticate,
  createWebSocketConnection,
  LeagueWebSocket,
} from "league-connect";
import { CONFIG, FLAGS, STATES } from "./config/constants.js";
import { handleChampSelect } from "./gameflowHandler.js";
import { poll } from "./league.js";
import {
  ChampSelectSession,
  ClientState,
  LobbyResponse,
} from "./types/index.js";
import { handleLobby } from "./gameflowHandler.js";

const { AUTO_SELECT_RUNES, AUTO_QUEUE_UP } = CONFIG;

export let leagueRequest: AxiosInstance;
let ws: LeagueWebSocket;
export const sleep = async (secs: number): Promise<void> =>
  new Promise((r) => setTimeout(r, secs * 1000));

export const connectToLeagueClient = async (): Promise<void> => {
  const credentials = await authenticate({ awaitConnection: true });

  const httpsAgent = new Agent({ rejectUnauthorized: false });

  leagueRequest = axios.create({
    baseURL: `https://127.0.0.1:${credentials.port}`,
    httpsAgent,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `riot:${credentials.password}`,
      ).toString("base64")}`,
    },
  });

  ws = await createWebSocketConnection({
    authenticationOptions: { awaitConnection: true },
  });

  ws.on("close", async () => {
    console.warn("WebSocket closed. Attempting to reconnect in 30s...");
    setTimeout(async () => {
      await connectToLeagueClient();
    }, 30000);
  });

  ws.on("error", (err) => {
    console.error("Websocket error: ", err);
  });

  console.log("Connected to League Client on port " + credentials.port);

  console.log("WebSocket connected on " + ws.url);

  await sleep(2);

  const { data: phase } = await leagueRequest.get(
    "/lol-gameflow/v1/gameflow-phase",
  );

  STATES.clientState = phase;

  console.log("Initial state: ", STATES.clientState);

  await subscribeToWebSocketEvents();
};

const subscribeToWebSocketEvents = async (): Promise<void> => {
  // Initialize state
  await poll();

  // Handle Client states
  ws.subscribe(
    "/lol-gameflow/v1/gameflow-phase",
    async (state: ClientState | null) => {
      if (!state) return; // Empty
      if (STATES.clientState === state) return; // No change
      console.log(`\n[STATE] ${STATES.clientState} -> ${state}`);
      STATES.clientState = state;
      await poll();
    },
  );

  // Handle ChampSelect
  if (AUTO_SELECT_RUNES)
    ws.subscribe(
      "/lol-champ-select/v1/session",
      async (event: ChampSelectSession | null) => {
        if (!event) return;

        await handleChampSelect(event);
      },
    );

  // Handle Lobby
  if (AUTO_QUEUE_UP) {
    ws.subscribe("/lol-lobby/v2/lobby", async (event: LobbyResponse | null) => {
      console.log("[Lobby Update]");
      if (!event) return;
      if (STATES.clientState !== "Lobby") return;

      FLAGS.isLobbyFull = event.gameConfig.isLobbyFull;
      FLAGS.isPartyLeader = event.localMember.isLeader;
      FLAGS.canStartGame = event.canStartActivity;

      await handleLobby(event);
    });
  }
};
