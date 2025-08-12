import { HttpStatusCode, isAxiosError } from "axios";
import { COLLECTIONS, FLAGS, STATES, CONFIG } from "./config/constants.js";
import { leagueRequest } from "./connection.js";
import { resetLevelingFlags } from "./leveler_module.js";
const { FRIENDS } = COLLECTIONS;
const { AUTO_INVITE_FRIENDS, AUTO_LEVEL_ABILITIES, ONLY_FOR_ARAMS } = CONFIG;
const findUninvitedFriends = async (partyMembers) => {
    // Get the summoner IDs of people already in our lobby
    const partyMembersIds = partyMembers.map((p) => p.summonerId);
    // Get the username of every friend that matters
    const closeFriendsList = Object.values(FRIENDS).map((f) => f.name);
    const { data: allFriends } = await leagueRequest.get("/lol-chat/v1/friends", {
        timeout: 3000,
    });
    // Filter through the entire friendlist and obtain the ones that matter
    const closeFriends = allFriends.filter((friend) => closeFriendsList.includes(friend.gameName));
    const unavailableStates = ["offline", "mobile", "dnd"]; // dnd -> ingame
    const uninvitedFriends = closeFriends.filter((friend) => !partyMembersIds.includes(friend.summonerId) && // They aren't already in our lobby
        !unavailableStates.includes(friend.availability) // They are available
    );
    return uninvitedFriends;
};
export const queueUp = async () => {
    const isUnableToStart = !FLAGS.isPartyLeader || !FLAGS.canStartGame;
    console.log("Ability to start: ", !isUnableToStart);
    console.log("Already queued up? ", FLAGS.isQueuedUp);
    if (FLAGS.isQueuedUp || isUnableToStart)
        return;
    FLAGS.isQueuedUp = true;
    console.log("Everybody seems ready, queueing up...");
    try {
        await leagueRequest.post("/lol-lobby/v2/lobby/matchmaking/search");
    }
    catch (err) {
        if (isAxiosError(err)) {
            console.error("[Axios] Error queueing up: ", err.response?.data || err.message);
        }
    }
};
const tryInviteFriends = async (partyMembers) => {
    try {
        // Skip checking for online friends if the lobby has no space for them
        if (FLAGS.isLobbyFull)
            return await queueUp();
        const uninvitedFriends = await findUninvitedFriends(partyMembers);
        // Somebody is actually available and not already in lobby
        if (uninvitedFriends.length > 0) {
            console.log("You have more friends that are online!");
            FLAGS.hasFriendsToInvite = true;
            uninvitedFriends.forEach((friend) => console.log(`Inviting ${friend.gameName}...`));
            // Format it the way the league client expects it to be
            const invitePayload = uninvitedFriends.map((friend) => ({
                toSummonerId: friend.summonerId,
            }));
            // Send the invite
            await leagueRequest.post("/lol-lobby/v2/lobby/invitations", invitePayload);
        }
        else {
            console.log("No new friends to invite");
        }
    }
    catch (err) {
        if (isAxiosError(err)) {
            if (err.response?.status === HttpStatusCode.BadRequest) {
                console.error("[Axios] Queue up error (probably a low priority queue): ", err.response?.data || err.message);
                if (!FLAGS.isInLowPrioQueue)
                    FLAGS.isInLowPrioQueue = true;
            }
            console.error("[Axios] Inviting friends error: ", err.response?.data || err.message);
        }
        else {
            console.error("[Unknown] Inviting friends error: ", err);
        }
    }
};
export const handleInvites = async (lobby) => {
    // When we first go to lobby, reset all necessary flags
    if (!FLAGS.isInLobby) {
        FLAGS.isInLobby = true;
        FLAGS.inviteTriggered = false;
        FLAGS.isQueuedUp = false;
        FLAGS.isInLowPrioQueue = false;
        STATES.gameMode = lobby.gameConfig.gameMode ?? "UNKNOWN";
        if (AUTO_LEVEL_ABILITIES)
            resetLevelingFlags(); // Ensure we still get auto-leveling next game
    }
    const isWrongGamemode = ONLY_FOR_ARAMS && STATES.gameMode !== "ARAM" && STATES.gameMode !== "URF";
    const shouldSkipLobbyActions = isWrongGamemode ||
        FLAGS.isInLowPrioQueue ||
        FLAGS.isQueuedUp ||
        !AUTO_INVITE_FRIENDS;
    if (shouldSkipLobbyActions)
        return;
    FLAGS.isLobbyFull = lobby.gameConfig.isLobbyFull;
    FLAGS.isPartyLeader = lobby.localMember.isLeader;
    FLAGS.canStartGame = lobby.canStartActivity;
    const members = lobby.members;
    if (AUTO_INVITE_FRIENDS && !FLAGS.inviteTriggered) {
        FLAGS.inviteTriggered = true;
        await tryInviteFriends(members);
    }
};
