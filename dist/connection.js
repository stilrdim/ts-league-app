import axios from "axios";
import { Agent } from "https";
import { authenticate, createWebSocketConnection, } from "league-connect";
import { CONFIG, STATES } from "./config/constants.js";
import { handleChampSelect } from "./gameflowHandler.js";
import { poll } from "./league.js";
import { handleLobby } from "./gameflowHandler.js";
const { AUTO_SELECT_RUNES, AUTO_QUEUE_UP } = CONFIG;
export let leagueRequest;
let ws;
let sleep = async (secs) => new Promise((r) => setTimeout(r, secs * 1000));
export const connectToLeagueClient = async () => {
    const credentials = await authenticate({ awaitConnection: true });
    const httpsAgent = new Agent({ rejectUnauthorized: false });
    leagueRequest = axios.create({
        baseURL: `https://127.0.0.1:${credentials.port}`,
        httpsAgent,
        headers: {
            Authorization: `Basic ${Buffer.from(`riot:${credentials.password}`).toString("base64")}`,
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
    const { data: phase } = await leagueRequest.get("/lol-gameflow/v1/gameflow-phase");
    STATES.clientState = phase;
    console.log("Initial state: ", STATES.clientState);
    await subscribeToWebSocketEvents();
};
const subscribeToWebSocketEvents = async () => {
    // Initialize state
    await poll();
    // Handle Client states
    ws.subscribe("/lol-gameflow/v1/gameflow-phase", async (state) => {
        if (!state)
            return; // Empty
        if (STATES.clientState === state)
            return; // No change
        console.log(`\n[STATE] ${STATES.clientState} -> ${state}`);
        STATES.clientState = state;
        await poll();
    });
    // Handle ChampSelect
    if (AUTO_SELECT_RUNES)
        ws.subscribe("/lol-champ-select/v1/session", async (event) => {
            if (!event)
                return;
            await handleChampSelect(event);
        });
    // Handle Lobby
    if (AUTO_QUEUE_UP) {
        ws.subscribe("/lol-lobby/v2/lobby", async (event) => {
            console.log("[Lobby Update]");
            if (!event)
                return;
            if (STATES.clientState !== "Lobby")
                return;
            await handleLobby(event);
        });
    }
};
