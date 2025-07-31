import { HttpStatusCode, isAxiosError } from "axios";
import { COLLECTIONS, FLAGS } from "./config/constants.js";
import { leagueRequest } from "./connection.js";
import { FriendlistFriend, LobbyMember } from "./types/index.js";

const { FRIENDS } = COLLECTIONS;

const findUninvitedFriends = async (
  partyMembers: LobbyMember[]
): Promise<FriendlistFriend[] | []> => {
  // Get the summoner IDs of people already in our lobby
  const partyMembersIds = partyMembers.map((p) => p.summonerId);

  // Get the username of every friend that matters
  const closeFriendsList = Object.values(FRIENDS).map((f) => f.name);

  const { data: allFriends } = await leagueRequest.get<FriendlistFriend[]>(
    "/lol-chat/v1/friends",
    {
      timeout: 3000,
    }
  );

  // Filter through the entire friendlist and obtain the ones that matter
  const closeFriends = allFriends.filter((friend) =>
    closeFriendsList.includes(friend.gameName)
  );

  const unavailableStates = ["offline", "mobile", "dnd"]; // dnd -> ingame
  const uninvitedFriends = closeFriends.filter(
    (friend) =>
      !partyMembersIds.includes(friend.summonerId) && // They aren't already in our lobby
      !unavailableStates.includes(friend.availability) // They are available
  );

  return uninvitedFriends;
};

const queueUp = async (): Promise<void> => {
  if (FLAGS.isQueuedUp) return;
  FLAGS.isQueuedUp = true;
  console.log(
    "No new friends to invite and everybody seems ready, queueing up..."
  );
  await leagueRequest.post("/lol-lobby/v2/lobby/matchmaking/search");
};

export const tryInviteFriends = async (
  partyMembers: LobbyMember[]
): Promise<void> => {
  try {
    // Skip checking for online friends if the lobby has no space for them
    if (FLAGS.isLobbyFull) return await queueUp();

    const uninvitedFriends = await findUninvitedFriends(partyMembers);

    // Somebody is actually available and not already in lobby
    if (uninvitedFriends.length > 0) {
      console.log("You have more friends that are online!");
      FLAGS.hasFriendsToInvite = true;

      uninvitedFriends.forEach((friend) =>
        console.log(`Inviting ${friend.gameName}...`)
      );

      // Format it the way the league client expects it to be
      const invitePayload = uninvitedFriends.map((friend) => ({
        toSummonerId: friend.summonerId,
      }));

      // Send the invite
      await leagueRequest.post(
        "/lol-lobby/v2/lobby/invitations",
        invitePayload
      );
    } else {
      console.log("No new friends to invite");
      // await queueUp();
    }
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response?.status === HttpStatusCode.BadRequest) {
        console.error(
          "[Axios] Queue up error (probably a low priority queue): ",
          err.response?.data || err.message
        );

        if (!FLAGS.isInLowPrioQueue) FLAGS.isInLowPrioQueue = true;
      }
      console.error(
        "[Axios] Inviting friends error: ",
        err.response?.data || err.message
      );
    } else {
      console.error("[Unknown] Inviting friends error: ", err);
    }
  }
};
