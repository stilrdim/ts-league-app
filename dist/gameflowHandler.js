import { HttpStatusCode, isAxiosError } from "axios";
import { CONFIG, FLAGS, HONOR, STATES } from "./config/constants.js";
import { leagueRequest } from "./connection.js";
import { tryInviteFriends } from "./inviteHandler.js";
import { initializeGame, resetLevelingFlags } from "./leveler_module.js";
// import { resetLevelingFlags } from "./leveler_module.js";
import { handleRunepage } from "./runepageHandler.js";
const { AUTO_LEVEL_ABILITIES, ONLY_FOR_ARAMS, AUTO_INVITE_FRIENDS } = CONFIG;
export const handleChampSelect = async (event) => {
    if (!FLAGS.isInChampSelect)
        FLAGS.isInChampSelect = true;
    try {
        const myCellId = event.localPlayerCellId;
        const myPick = event.myTeam.find((p) => p.cellId === myCellId);
        if (!myPick)
            return;
        const currentChampId = myPick.championId;
        if (!myPick ||
            currentChampId === STATES.lastChampId ||
            currentChampId === 0)
            return;
        console.log(`Current champion id: ${currentChampId}`);
        STATES.lastChampId = currentChampId;
        const { data: champInfo } = await leagueRequest.get(`/lol-game-data/assets/v1/champions/${currentChampId}.json`);
        const { data: allRunePages } = await leagueRequest.get("/lol-perks/v1/pages");
        const champName = champInfo.name;
        console.log(`Current champion name: ${champName}`);
        await handleRunepage(champName, currentChampId, allRunePages);
    }
    catch (err) {
        if (isAxiosError(err)) {
            console.error(`[Axios] Error handling ChampSelect: `, err.response?.data || err.message);
        }
        else {
            console.error(`[Unknown] Error handling ChampSelect: `, err);
        }
    }
};
// Handles "InProgress"
export const handleInAnActiveGame = async () => {
    FLAGS.isInGame = true;
    console.log("\n");
    try {
        console.log("[InProgress] Game currently in progress...");
        await initializeGame();
    }
    catch (err) {
        console.error("InProgress error: ", err);
    }
};
// Handle PreEndOfGame
export const handleHonorPlayers = async () => {
    // Ensure we only trigger this once
    FLAGS.honorTriggered = true;
    try {
        const { data: res } = await leagueRequest.get("/lol-honor-v2/v1/ballot");
        const { gameId } = res;
        STATES.honorVotesRemaining = res.votePool.votes;
        const eligibleAllies = res.eligibleAllies;
        const formattedPlayers = eligibleAllies.map((player) => `${player.championName}: (${player.summonerId})`);
        console.log(`\nGame ID: ${gameId}\nAvailable votes: ${STATES.honorVotesRemaining}\nYour Team:`, formattedPlayers);
        const priorityList = HONOR.priorityList;
        for (const friend of priorityList) {
            const targetPlayer = eligibleAllies.find((ally) => ally.summonerId === friend.summonerId);
            // If the friend isn't available, check for the next one
            if (!targetPlayer)
                continue;
            if (STATES.honorVotesRemaining > 0) {
                try {
                    const payload = {
                        recipientPuuid: targetPlayer.puuid,
                        honorType: "HEART", // Only HEART is known to work on allies
                    };
                    // Send the honor
                    const res = await leagueRequest.post("/lol-honor/v1/honor", payload);
                    if (res.status === HttpStatusCode.NoContent) {
                        STATES.honorVotesRemaining--;
                        console.log(`[Honor] Honored ${friend.name}\n`);
                    }
                    else {
                        console.log(`[Honor] Failed honoring ${friend.name}\n`);
                    }
                }
                catch (err) {
                    if (isAxiosError(err)) {
                        console.error(`[Axios] Couldn't honor ${friend.name}: `, err.response?.data || err.message);
                    }
                    else {
                        console.error(`[Unknown] Couldn't honor ${friend.name}: `, err);
                    }
                }
            }
            else {
                console.log("[Honor] Ran out of honors to give\n\n");
                break;
            }
        }
    }
    catch (err) {
        if (isAxiosError(err))
            console.error("[Axios] PreEndOfGame error: ", err.response?.data || err.message);
        else
            console.error("[Unknown] PreEndOfGame error: ", err);
    }
};
// Handles EndOfGame
export const handleBackToLobby = async () => {
    console.log("Post-game screen finished!");
    try {
        if (!FLAGS.playAgainTriggered) {
            await leagueRequest.post("/lol-lobby/v2/play-again");
            FLAGS.playAgainTriggered = true;
            console.log("Going back to lobby...");
        }
    }
    catch (err) {
        if (isAxiosError(err)) {
            console.error("[Axios] Play Again error: ", err.response?.data || err.message);
        }
        else {
            console.error("[Unknown] Play Again Error: ", err);
        }
    }
};
export const handleLobby = async (res) => {
    // When we first go to lobby this triggers only once
    if (!FLAGS.isInLobby) {
        FLAGS.isInLobby = true;
        FLAGS.inviteTriggered = false;
        FLAGS.isQueuedUp = false;
        const { data: gameflow } = await leagueRequest.get("/lol-gameflow/v1/session");
        STATES.gameMode = gameflow.gameData.queue.gameMode;
        if (AUTO_LEVEL_ABILITIES)
            resetLevelingFlags(); // Ensure we still get auto-leveling next game
    }
    if ((ONLY_FOR_ARAMS && STATES.gameMode !== "ARAM") || FLAGS.isInLowPrioQueue)
        return;
    try {
        FLAGS.isLobbyFull = res.gameConfig.isLobbyFull;
        FLAGS.isPartyLeader = res.localMember.isLeader;
        FLAGS.canStartGame = res.canStartActivity;
        const members = res.members;
        const allReady = members.every((m) => m.ready === true);
        const invitations = res.invitations;
        const allInvitesAccepted = invitations.every((inv) => inv.state === "Accepted");
        if (allReady && allInvitesAccepted) {
            if (AUTO_INVITE_FRIENDS &&
                !FLAGS.inviteTriggered &&
                FLAGS.isPartyLeader &&
                FLAGS.canStartGame) {
                await tryInviteFriends(members, FLAGS.isLobbyFull);
                return;
            }
        }
        else {
            console.log("Waiting for players to be ready...");
        }
    }
    catch (err) {
        if (isAxiosError(err)) {
            console.error("[Axios] Lobby error: ", err.response?.data || err.message);
        }
        else {
            console.error("[Unknown] Lobby error: ", err);
        }
    }
};
// Handles Matchmaking
export const handleInQueue = async () => {
    if (FLAGS.isQueuedUp)
        return;
    try {
        console.log("Looking for a game...");
        FLAGS.isQueuedUp = true;
    }
    catch (err) {
        console.error("Matchmaking error: ", err);
    }
};
// Handles ReadyCheck
export const handleAcceptQueue = async () => {
    // Avoid unnecessary extra requests
    if (FLAGS.isGameAccepted)
        return;
    if (FLAGS.isInLowPrioQueue)
        FLAGS.isInLowPrioQueue = false;
    try {
        const { data: res } = await leagueRequest.get("/lol-matchmaking/v1/ready-check");
        if (res.state === "InProgress") {
            console.log("Accepting game...");
            await leagueRequest.post("/lol-matchmaking/v1/ready-check/accept");
            FLAGS.isGameAccepted = true;
        }
    }
    catch (err) {
        if (isAxiosError(err)) {
            if (err.response?.status !== HttpStatusCode.NotFound) {
                console.error("[Axios] ReadyCheck error: ", err.response?.data || err.message);
            }
        }
        else {
            console.error("[Unknown] ReadyCheck error", err);
        }
    }
};
