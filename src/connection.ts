import {
  authenticate,
  createWebSocketConnection,
  LeagueWebSocket,
} from "league-connect";
import axios, { AxiosInstance } from "axios";
import { Agent } from "https";
import { ClientState } from "./types/general.js";

export let leagueRequest: AxiosInstance;
export let ws: LeagueWebSocket;

// Client state with getter and setter
export const CLIENT = {
  state: "None" as ClientState,
};

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
    console.warn("WebSocket closed. Attempting to reconnect in 5s...");
    setTimeout(connectToLeagueClient, 5000);
  });

  ws.on("error", (err) => {
    console.error("Websocket error: ", err);
  });

  console.log("Connected to League Client on port " + credentials.port);

  console.log("WebSocket connected on " + ws.url);

  const { data: phase } = await leagueRequest.get(
    "/lol-gameflow/v1/gameflow-phase"
  );

  CLIENT.state = phase;

  console.log("Initial state: ", CLIENT.state);
};
