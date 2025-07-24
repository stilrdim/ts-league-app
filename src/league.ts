import { isAxiosError } from "axios";
import {
  CLIENT,
  connectToLeagueClient,
  leagueRequest,
  ws,
} from "./connection.js";
import {
  handleLeveling,
  __dirname,
  hasReachedMaxLevel,
} from "./leveler_module.js";
import {
  ChampSelectSession,
  GameFlowSession,
  ClientState,
} from "./types/index.js";
import { CONFIG, FLAGS, STATE_VARS } from "./config/constants.js";
import {
  handleAcceptQueue,
  handleBackToLobby,
  handleChampSelect,
  handleHonorPlayers,
  handleInAnActiveGame,
  handleInQueue,
  handleLobby,
} from "./gameflowHandler.js";

const {
  AUTO_ACCEPT_QUEUE,
  AUTO_HONOR_FRIENDS,
  AUTO_INVITE_FRIENDS,
  AUTO_LEVEL_ABILITIES,
  AUTO_QUEUE_UP,
  POLLING_INTERVAL_IN_SECONDS,
  SKIP_ENDGAME_SCREEN,
} = CONFIG;

// Create Client
await connectToLeagueClient();

// #region Handle States

// Handle State changes (gameflow-phase)
ws.subscribe(
  "/lol-gameflow/v1/gameflow-phase",
  async (state: ClientState | null) => {
    if (!state) return; // Empty
    if (CLIENT.state === state) return; // No change
    console.log(`[STATE] ${CLIENT.state} -> ${state}`);
    CLIENT.state = state;
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

// #endregion Handle States

// #region Polling

const poll = async () => {
  try {
    switch (CLIENT.state) {
      case "ChampSelect":
        if (FLAGS.isGameAccepted) FLAGS.isGameAccepted = false;
        break;

      case "InProgress":
        await handleInAnActiveGame();

        if (AUTO_LEVEL_ABILITIES && !hasReachedMaxLevel) await handleLeveling();

        // Keep checking our level for changes
        setTimeout(poll, POLLING_INTERVAL_IN_SECONDS * 1000);
        break;

      case "PreEndOfGame":
        if (AUTO_HONOR_FRIENDS && !FLAGS.honorTriggered)
          await handleHonorPlayers();
        break;

      case "EndOfGame":
        if (SKIP_ENDGAME_SCREEN) await handleBackToLobby();
        FLAGS.isInGame = false;

        break;

      case "Lobby":
        const { data: gameflow } = await leagueRequest.get<GameFlowSession>(
          "/lol-gameflow/v1/session"
        );
        // Reset necessary flags to avoid useless requests
        if (FLAGS.playAgainTriggered) FLAGS.playAgainTriggered = false;
        if (FLAGS.honorTriggered) FLAGS.honorTriggered = false;
        if (AUTO_QUEUE_UP) await handleLobby(gameflow, AUTO_INVITE_FRIENDS);

        // Poll again until we are no longer in lobby
        setTimeout(poll, POLLING_INTERVAL_IN_SECONDS * 1000);
        break;

      case "Matchmaking":
        await handleInQueue();
        // Make sure we auto-accept the next game if previous didn't progress to ChampSelect
        if (FLAGS.isGameAccepted) FLAGS.isGameAccepted = false;

        // Only execute once
        if (FLAGS.isInLobby) FLAGS.isInLobby = false;

        break;

      case "ReadyCheck":
        if (AUTO_ACCEPT_QUEUE) await handleAcceptQueue();
        break;

      default:
        if (FLAGS.isInChampSelect) {
          FLAGS.isInChampSelect = false;
          STATE_VARS.lastChampId = null;
        }
        break;
    }
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        // Probably in League's Home screen
        if (FLAGS.isInLobby) FLAGS.isInLobby = false;
        if (FLAGS.isInGame) FLAGS.isInGame = false; // Might need it for custom games or practice tool
      } else {
        console.error("Can't connect to League Client\n", error.code);
      }
    } else {
      console.error("Unknown error: ", error);
    }
  }
};

// Poll once on startup
await poll();
// #endregion Polling
