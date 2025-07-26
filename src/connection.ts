import {
  authenticate,
  createWebSocketConnection,
  LeagueWebSocket,
} from "league-connect";
import axios, { AxiosInstance } from "axios";
import { Agent } from "https";
import { ClientState } from "./types/general.js";
import { CONFIG, STATES } from "./config/constants.js";
import { poll } from "./league.js";
import { handleChampSelect } from "./gameflowHandler.js";
import { ChampSelectSession } from "./types/users.js";

export let leagueRequest: AxiosInstance;
let ws: LeagueWebSocket;
let sleep = async (secs: number): Promise<void> =>
  new Promise((r) => setTimeout(r, secs * 1000));
// Client state with getter and setter

export const connectToLeagueClient = async () => {
  const credentials = await authenticate({ awaitConnection: true });

  const httpsAgent = new Agent({ rejectUnauthorized: false });

  leagueRequest = axios.create({
    baseURL: `https://127.0.0.1:${credentials.port}`,
    httpsAgent,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `riot:${credentials.password}`
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
    "/lol-gameflow/v1/gameflow-phase"
  );

  STATES.clientState = phase;

  console.log("Initial state: ", STATES.clientState);

  await subscribeToWebSocketEvents();
};

const subscribeToWebSocketEvents = async () => {
  // Wait 2 sec to avoid vanguard flagging on reconnect
  await sleep(2);

  // Initialize state
  await poll();

  ws.subscribe(
    "/lol-gameflow/v1/gameflow-phase",
    async (state: ClientState | null) => {
      if (!state) return; // Empty
      if (STATES.clientState === state) return; // No change
      console.log(`[STATE] ${STATES.clientState} -> ${state}`);
      STATES.clientState = state;
      await poll();
    }
  );

  // Handle ChampSelect
  if (CONFIG.AUTO_SELECT_RUNES)
    ws.subscribe(
      "/lol-champ-select/v1/session",
      async (event: ChampSelectSession | null) => {
        if (!event) return;

        await handleChampSelect(event);
      }
    );
};
