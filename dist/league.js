import { HttpStatusCode, isAxiosError } from "axios";
import { connectToLeagueClient, leagueRequest } from "./connection.js";
import { handleLeveling, hasReachedMaxLevel, } from "./leveler_module.js";
import { CONFIG, FLAGS, STATES } from "./config/constants.js";
import { handleAcceptQueue, handleBackToLobby, handleHonorPlayers, handleInAnActiveGame, handleInQueue, handleLobby, } from "./gameflowHandler.js";
const { AUTO_ACCEPT_QUEUE, AUTO_HONOR_FRIENDS, AUTO_INVITE_FRIENDS, AUTO_LEVEL_ABILITIES, AUTO_QUEUE_UP, POLLING_INTERVAL_IN_SECONDS, SKIP_ENDGAME_SCREEN, } = CONFIG;
// Create Client
await connectToLeagueClient();
// #region Polling
export async function poll() {
    try {
        switch (STATES.clientState) {
            case "ChampSelect":
                if (FLAGS.isGameAccepted)
                    FLAGS.isGameAccepted = false;
                break;
            case "InProgress":
                await handleInAnActiveGame();
                if (AUTO_LEVEL_ABILITIES && !hasReachedMaxLevel)
                    await handleLeveling();
                // Keep checking our level for changes
                setTimeout(poll, POLLING_INTERVAL_IN_SECONDS * 1000);
                break;
            case "PreEndOfGame":
                if (AUTO_HONOR_FRIENDS && !FLAGS.honorTriggered)
                    await handleHonorPlayers();
                break;
            case "EndOfGame":
                if (SKIP_ENDGAME_SCREEN)
                    await handleBackToLobby();
                FLAGS.isInGame = false;
                break;
            case "Lobby":
                const { data: gameflow } = await leagueRequest.get("/lol-gameflow/v1/session");
                // Reset necessary flags to avoid useless requests
                if (FLAGS.playAgainTriggered)
                    FLAGS.playAgainTriggered = false;
                if (FLAGS.honorTriggered)
                    FLAGS.honorTriggered = false;
                if (AUTO_QUEUE_UP)
                    await handleLobby(gameflow, AUTO_INVITE_FRIENDS);
                // Poll again until we are no longer in lobby
                setTimeout(poll, POLLING_INTERVAL_IN_SECONDS * 1000);
                break;
            case "Matchmaking":
                await handleInQueue();
                // Make sure we auto-accept the next game if previous didn't progress to ChampSelect
                if (FLAGS.isGameAccepted)
                    FLAGS.isGameAccepted = false;
                // Only execute once
                if (FLAGS.isInLobby)
                    FLAGS.isInLobby = false;
                break;
            case "ReadyCheck":
                if (AUTO_ACCEPT_QUEUE)
                    await handleAcceptQueue();
                break;
            default:
                if (FLAGS.isInChampSelect) {
                    FLAGS.isInChampSelect = false;
                    STATES.lastChampId = null;
                }
                break;
        }
    }
    catch (error) {
        if (isAxiosError(error)) {
            if (error.response?.status === HttpStatusCode.NotFound) {
                // Probably in League's Home screen
                if (FLAGS.isInLobby)
                    FLAGS.isInLobby = false;
                if (FLAGS.isInGame)
                    FLAGS.isInGame = false; // Might need it for custom games or practice tool
            }
            else {
                console.error("Can't connect to League Client\n", error.code);
            }
        }
        else {
            console.error("Unknown error: ", error);
        }
    }
}
// Poll once on startup
await poll();
// #endregion Polling
