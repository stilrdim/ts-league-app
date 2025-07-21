import { authenticate } from "league-connect";
import axios, { isAxiosError } from "axios";
import fs from "fs";
import { Agent } from "https";
import {
  handleLeveling,
  resetLevelingFlags,
  __dirname,
  rootDir,
  hasReachedMaxLevel,
  friendsConfigPath,
  champsConfigPath,
  recRunesConfigPath,
} from "./leveler_module.js";
import {
  ChampInfo,
  ChampSelectSession,
  CloseFriend,
  Friend,
  Party,
  PartyMember,
  ChampionRuneRecEntry,
  RunePage,
  RunePagePayload,
  GameFlowSession,
  ReadyCheck,
} from "./types/index.js";

// CONFIG
const AUTO_LEVEL_ABILITIES = true;
const SKIP_ENDGAME_SCREEN = true;
const AUTO_QUEUE_UP = true;
const AUTO_ACCEPT_QUEUE = true;
const AUTO_INVITE_FRIENDS = true;
const AUTO_SELECT_RUNES = true;
const AUTO_SELECT_RECOMMENDED_RUNES = true;
const POLLING_INTERVAL_IN_SECONDS = 1; // Time between each client state update

// #region Constants and Flags
const FRIENDS: Record<string, CloseFriend> = JSON.parse(
  fs.readFileSync(friendsConfigPath).toString()
);
const CHAMPS = JSON.parse(fs.readFileSync(champsConfigPath).toString());
const RECOMMENDED_RUNES = JSON.parse(
  fs.readFileSync(recRunesConfigPath).toString()
);

// Flags to avoid unnecessary requests
let playAgainTriggered = false; // Clicked "Play Again" during EndOfGame stage
let honorTriggered = false; // Honored a player successfully

let hasFriendsToInvite = false; // Forgot what I was going to use this for
let inviteTriggered = false; // Invites have been sent out

let isInLobby = false; // In Lobby stage
let isQueuedUp = false; // In Matchmaking stage
let isGameAccepted = false; // In ReadyCheck stage
let isInGame = false; // In InProgress stage
let isInChampSelect = false; // In ChampSelect stage

let isPartyLeader = false; // If you can't start a game, don't even bother trying
let canStartGame = false; // If we can start at all, someone might have penalty, etc
let isLobbyFull = false; // If lobby is full to avoid inviting even if more people are online

let lastChampId: number | null = null; // Track champion changes during ChampSelect stage

// #endregion Constants and Flags

// #region Create Client
(async () => {
  const credentials = await authenticate({ awaitConnection: true });

  // League uses self-signed certs
  const httpsAgent = new Agent({
    rejectUnauthorized: false,
  });

  const leagueRequest = axios.create({
    baseURL: `https://127.0.0.1:${credentials.port}`,
    httpsAgent,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `riot:${credentials.password}`
      ).toString("base64")}`,
    },
  });

  console.log("Connected to league client on port " + credentials.port);

  // #endregion Create Client

  // #region Util Functions
  const getRecommendedRunepage = (
    recommendations: ChampionRuneRecEntry[],
    champId: number
  ): RunePagePayload | undefined => {
    const result: ChampionRuneRecEntry | undefined = recommendations.find(
      (champ: ChampionRuneRecEntry) => champ.championId === champId
    );

    if (!result) {
      console.log(
        "The champ you've selected doesn't seem to have recommended runes."
      );
      return;
    }

    const page = result.runeRecommendations.filter(
      (rec) => rec.mapId === 12
    )[0];

    if (!page) {
      console.log("It seems this champion has no ARAM recommendations");
      return;
    }

    const pagePayload: RunePagePayload = {
      name: "AutoRunepage",
      primaryStyleId: page.primaryPerkStyleId,
      subStyleId: page.secondaryPerkStyleId,
      selectedPerkIds: page.perkIds,
      current: true,
    };

    console.log(
      "[RunepageHandler/Get] Recommended runepage retrieved. Selecting..."
    );
    return pagePayload;
  };

  const selectRecommendedRunepage = async (
    champId: number,
    champName: string,
    autoRunepage: RunePagePayload
  ) => {
    const pagePayload = getRecommendedRunepage(RECOMMENDED_RUNES, champId);
    if (!pagePayload) return;

    try {
      console.log(
        `[RunepageHandler/Select] Unlisted champ detected: ${champName.toUpperCase()}`
      );

      console.log(`[RunepageHandler/Select] Editing ${autoRunepage.name}...`);
      // Apply the rune page
      await leagueRequest.put(
        `/lol-perks/v1/pages/${autoRunepage.id}`,
        pagePayload
      );

      return console.log(
        `[RunepageHandler/Select] Runepage ${autoRunepage.name} edited successfully!\n`
      );
    } catch (err) {
      if (isAxiosError(err)) {
        console.error(
          "[Axios] Error setting a recommended runepage: ",
          err.response?.data || err.message
        );
      } else {
        console.error("[Unknown] Error setting a recommended runepage: ", err);
      }
    }
  };

  const handleRunepageForRole = async (
    champName: string,
    champId: number,
    runePages: RunePage[]
  ) => {
    let matched = false;

    const categories = [
      CHAMPS.TANK_CHAMPS,
      CHAMPS.BASIC_MAGE_CHAMPS,
      CHAMPS.ULT_MAGE_CHAMPS,
      CHAMPS.BASIC_SUPPORT_CHAMPS,
      CHAMPS.ULT_SUPPORT_CHAMPS,
    ];

    for (const category of categories) {
      if (category.champList.includes(champName)) {
        matched = true;

        console.log(
          `[RunepageHandler] ${
            category.categoryName
          } detected: ${champName.toUpperCase()}`
        );

        const targetRunePage = runePages.find(
          (p) => p.name === category.runePageName
        );
        if (!targetRunePage) {
          console.warn(
            `[RunepageHandler] Runepage ${category.runePageName} not found`
          );
          return;
        }

        const pagePayload = {
          name: targetRunePage.name,
          primaryStyleId: targetRunePage.primaryStyleId,
          subStyleId: targetRunePage.subStyleId,
          selectedPerkIds: targetRunePage.selectedPerkIds,
          current: true,
        };

        if (!targetRunePage.current) {
          await leagueRequest.put(
            `/lol-perks/v1/pages/${targetRunePage.id}`,
            pagePayload
          );
          console.log(
            `[RunepageHandler] Applied rune page ${targetRunePage.name}\n`
          );
        } else {
          console.log(
            `[RunepageHandler] The ${targetRunePage.name} rune page is already active.\n`
          );
        }

        break;
      }
    }
    if (!matched && AUTO_SELECT_RECOMMENDED_RUNES) {
      const autoRunepage = runePages.find(
        (p) => p.name.toUpperCase() === "AUTORUNEPAGE"
      );
      if (!autoRunepage) {
        return console.log(
          "AutoRunepage not found.\nIf you'd like this feature, create a rune page named AutoRunepage"
        );
      }
      await selectRecommendedRunepage(champId, champName, autoRunepage);
    }
  };

  const findUninvitedFriends = async (partyMembers: PartyMember[]) => {
    // Get the summoner IDs of people already in our lobby
    const partyMembersIds = partyMembers.map((p) => p.summonerId);

    // Get the username of every friend that matters
    const closeFriendsList = Object.values(FRIENDS).map((f) => f.name);

    const friendRes = await leagueRequest.get("/lol-chat/v1/friends", {
      timeout: 3000,
    });

    const allFriends = (friendRes.data as Friend[]) || [];

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

  const queueUp = async () => {
    console.log(
      "No new friends to invite and everybody seems ready, queueing up..."
    );
    await leagueRequest.post("/lol-lobby/v2/lobby/matchmaking/search");
  };

  const tryInviteFriends = async (
    partyMembers: PartyMember[],
    isLobbyFull: boolean
  ) => {
    // Ensure we havent already invited people
    if (inviteTriggered) return;

    try {
      // Skip checking for online friends if the lobby has no space for them
      if (isLobbyFull) return await queueUp();

      const uninvitedFriends = await findUninvitedFriends(partyMembers);

      // Somebody is actually available and not already in lobby
      if (uninvitedFriends.length > 0) {
        console.log("You have more friends that are online!");
        hasFriendsToInvite = true;
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

        // Change our flag to avoid spamming invites
        inviteTriggered = true;
      } else {
        await queueUp();
      }
    } catch (err) {
      if (isAxiosError(err)) {
        console.error(
          "[Axios] Inviting friends error: ",
          err.response?.data || err.message
        );
      } else {
        console.error("[Unknown] Inviting friends error: ", err);
      }
    }
  };
  // #endregion Util Functions

  // #region Handle States
  const handleChampSelect = async (gameMode: string) => {
    try {
      if (!isInChampSelect) {
        isInChampSelect = true;
        console.log(`-----------------------------\nCHAMP SELECT STARTED\n`);
        console.log(`GAMEMODE: ${gameMode}`);
      }

      const { data: session } = await leagueRequest.get<ChampSelectSession>(
        "/lol-champ-select/v1/session"
      );

      const myCellId = session.localPlayerCellId;
      const myPick = session.myTeam.find((p) => p.cellId === myCellId);

      if (!myPick) return;

      const currentChampId = myPick.championId;

      // Don't make further requests if there's been no changes in the selected champion
      if (!myPick || currentChampId === lastChampId || currentChampId === 0)
        return;

      console.log(`[ChampSelect] Current champion id: ${currentChampId}`);

      // Store the current champ id to avoid repetitive requests with no champion change
      lastChampId = currentChampId;

      // Handle GET requests...
      const { data: champInfo } = await leagueRequest.get<ChampInfo>(
        `/lol-game-data/assets/v1/champions/${currentChampId}.json`
      );
      const { data: pages } = await leagueRequest.get<RunePage[]>(
        "/lol-perks/v1/pages"
      );

      const champName = champInfo.name;
      console.log(`[ChampSelect] Current champion name: ${champName}`);

      await handleRunepageForRole(champName, currentChampId, pages);
    } catch (err) {
      if (isAxiosError(err)) {
        console.error(
          "[Axios] ChampSelect error: ",
          err.response?.data || err.message
        );
      } else {
        console.error("[Unknown] ChampSelect error: ", err);
      }
    }
  };

  // Handles "InProgress"
  const handleInAnActiveGame = async () => {
    if (isInGame) return;
    console.log("\n");
    try {
      console.log("[InProgress] Game currently in progress...");
      isInGame = true;
    } catch (err) {
      console.error("InProgress error: ", err);
    }
  };

  // Handles EndOfGame
  const handleBackToLobby = async () => {
    console.log("[EndOfGame]\nPost-game screen finished!");
    try {
      if (!playAgainTriggered) {
        await leagueRequest.post("/lol-lobby/v2/play-again");
        playAgainTriggered = true;
        console.log("Going back to lobby...");
      }
    } catch (err) {
      if (isAxiosError(err)) {
        console.error(
          "[Axios] Play Again error: ",
          err.response?.data || err.message
        );
      } else {
        console.error("[Unknown] Play Again Error: ", err);
      }
    }
  };

  const handleLobby = async (isAutoInviting: boolean) => {
    // When we first go to lobby this triggers only once
    if (!isInLobby) {
      isInLobby = true;
      console.log("[Lobby]\nWe're in the lobby!");
      inviteTriggered = false;
      isQueuedUp = false;

      if (AUTO_LEVEL_ABILITIES) resetLevelingFlags(); // Ensure we still get auto-leveling next game
    }

    try {
      const { data: res } = await leagueRequest.get<Party>(
        "/lol-lobby/v2/lobby"
      );

      isLobbyFull = res.gameConfig.isLobbyFull;

      isPartyLeader = res.localMember.isLeader;

      canStartGame = res.canStartActivity;

      const members: PartyMember[] = res.members;
      const allReady = members.every((m) => m.ready === true);

      if (allReady) {
        if (
          isAutoInviting &&
          !inviteTriggered &&
          isPartyLeader &&
          canStartGame
        ) {
          await tryInviteFriends(members, isLobbyFull);
          return;
        }
      } else {
        console.log("Waiting for players to be ready...");
      }
    } catch (err) {
      if (isAxiosError(err)) {
        console.error(
          "[Axios] Lobby error: ",
          err.response?.data || err.message
        );
      } else {
        console.error("[Unknown] Lobby error: ", err);
      }
    }
  };

  // Handles Matchmaking
  const handleInQueue = async () => {
    if (isQueuedUp) return;
    try {
      console.log("[Matchmaking] Looking for a game...");
      isQueuedUp = true;
    } catch (err) {
      console.error("Matchmaking error: ", err);
    }
  };

  // Handles ReadyCheck
  const handleAcceptQueue = async () => {
    // Avoid unnecessary extra requests
    if (isGameAccepted) return;

    console.log("[ReadyCheck]");
    try {
      const { data: res } = await leagueRequest.get<ReadyCheck>(
        "/lol-matchmaking/v1/ready-check"
      );

      if (res.state === "InProgress") {
        console.log("Accepting game...");
        await leagueRequest.post("/lol-matchmaking/v1/ready-check/accept");

        isGameAccepted = true;
      }
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status !== 404) {
          console.error(
            "[Axios] ReadyCheck error: ",
            err.response?.data || err.message
          );
        }
      } else {
        console.error("[Unknown] ReadyCheck error", err);
      }
    }
  };

  // #endregion Handle States

  // #region Polling
  const poll = async () => {
    try {
      const { data: gameflow } = await leagueRequest.get<GameFlowSession>(
        "/lol-gameflow/v1/session"
      );
      const gamePhase = gameflow.phase;
      const gameMode = gameflow.gameData.queue.gameMode;

      switch (gamePhase) {
        case "ChampSelect":
          if (AUTO_SELECT_RUNES) await handleChampSelect(gameMode);

          if (isGameAccepted) isGameAccepted = false;
          break;

        case "InProgress":
          await handleInAnActiveGame();

          if (AUTO_LEVEL_ABILITIES && !hasReachedMaxLevel)
            await handleLeveling();
          break;

        case "PreEndOfGame":
          break;

        case "EndOfGame":
          if (SKIP_ENDGAME_SCREEN) await handleBackToLobby();
          isInGame = false;

          break;

        case "Lobby":
          // Reset necessary flags to avoid useless requests
          if (playAgainTriggered) playAgainTriggered = false;
          if (honorTriggered) honorTriggered = false;
          if (AUTO_QUEUE_UP) await handleLobby(AUTO_INVITE_FRIENDS);
          break;

        case "Matchmaking":
          await handleInQueue();
          // Make sure we auto-accept the next game if previous didn't progress to ChampSelect
          if (isGameAccepted) isGameAccepted = false;

          // Only execute once
          if (isInLobby) isInLobby = false;

          break;

        case "ReadyCheck":
          if (AUTO_ACCEPT_QUEUE) await handleAcceptQueue();
          break;

        default:
          if (isInChampSelect) {
            isInChampSelect = false;
            lastChampId = null;
          }
          break;
      }
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status !== 404)
          console.error("Can't connect to League Client\n", error.code);
      } else {
        console.error("Unknown error: ", error);
      }
    }
  };

  // Poll every X seconds
  setInterval(poll, POLLING_INTERVAL_IN_SECONDS * 1000);
})();
// #endregion Polling
