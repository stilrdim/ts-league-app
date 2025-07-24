import { authenticate } from "league-connect";
import axios, { isAxiosError } from "axios";
import fs from "fs";
import { Agent } from "https";
import {
  rootDir,
  friendsConfigPath,
  allRunesConfigPath,
  recRunesConfigPath,
  champPrefsConfigPath,
} from "./leveler_module.js";
import {
  AllPlayer,
  ChampionRuneRecEntry,
  ChampPreference,
  CloseFriends,
  FriendlistFriend,
  RunePage,
} from "./types/index.js";

// #region Implementation Detail

// Keep logic just in case we want to send this back to the main file
let endpointsWereTested = false;

const DEBUGGING_MODE = false;

const RUNEPAGES: RunePage[] = JSON.parse(
  fs.readFileSync(allRunesConfigPath).toString()
);
const CHAMP_PREFERENCES: ChampPreference[] = JSON.parse(
  fs.readFileSync(champPrefsConfigPath).toString()
);
const FRIENDS: CloseFriends = JSON.parse(
  fs.readFileSync(friendsConfigPath).toString()
);
const RECOMMENDED_RUNES: ChampionRuneRecEntry[] = JSON.parse(
  fs.readFileSync(recRunesConfigPath).toString()
);

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

  // Interceptor for future debugging
  if (DEBUGGING_MODE)
    leagueRequest.interceptors.request.use(
      (request) => {
        console.log(
          `➡️ Request: ${(request.method ?? "UNKNOWN").toUpperCase()} ${
            request.url ?? "<no-url>"
          }`
        );
        if (request.data) {
          console.log("Payload:", JSON.stringify(request.data, null, 2));
        } else {
          console.log("Payload: <none>");
        }
        return request; // Important to return the request
      },
      (error) => {
        // Log request error if any
        console.error("Request error:", error);
        return Promise.reject(error);
      }
    );

  const cDragonRequest = axios.create({
    baseURL: `https://raw.communitydragon.org/pbe`,
    httpsAgent,
  });

  console.log(
    `[DEV TESTING] Connected to league client on port ${credentials.port}\n`
  );

  const sleep = (secs: number) =>
    new Promise((r) => setTimeout(r, secs * 1000));

  const findFriend = async (targetName: string) => {
    const { data: friends } = await leagueRequest.get<FriendlistFriend[]>(
      "/lol-chat/v1/friends"
    );
    const targetFriend = friends.find((f) => f.gameName === targetName);

    // availability: offline   -> Offline
    // availability: dnd       -> In a game / Champ select
    // availability: chat      -> Online
    // availability: away      -> Away

    return targetFriend;
  };

  // List close friends
  const listCloseFriends = () => {
    const friends = Object.values(FRIENDS);
    friends.forEach((friend) => console.log(`${friend.name} (${friend.id})`));
  };

  // #endregion Implementation Detail

  // #region Runepage Handling

  const findRunepagesByName = (stringToFind: string) => {
    const fileName = "runepages.json";
    const runePagesDir = `${rootDir}/${fileName}`;

    const runePages: RunePage[] = JSON.parse(
      fs.readFileSync(runePagesDir).toString()
    );

    const targetRunePages = runePages.filter((page) =>
      page.name.includes(stringToFind)
    );

    return targetRunePages;
  };

  const storeRunepages = (
    fileName = "test",
    runePages = Object,
    folder: string
  ) => {
    fileName = `${rootDir}/${folder ? folder + "/" : ""}${fileName}.json`;

    fs.writeFileSync(fileName, JSON.stringify(runePages, null, 2));

    return console.log(`Rune pages stored at ${fileName}`);
  };

  const convertRunepagesToPayload = (runePages: RunePage[]) => {
    return runePages.map((page) => ({
      name: page.name,
      primaryStyleId: page.primaryStyleId,
      subStyleId: page.subStyleId,
      selectedPerkIds: page.selectedPerkIds,
      current: false,
    }));
  };
  // #endregion Runepage Handling

  const testEndpoints = async () => {
    if (endpointsWereTested) return;
    endpointsWereTested = true;

    // Build our file name and directory
    let isPlural = false;
    const pluralSuffix = isPlural ? "s" : "";
    const attempt = 1;
    const targetFolder = "./data";
    const currentTestType = "phase";

    // const champId = 22;

    let success = false;

    const endpoints: string[] = [
      // ----- CHAMP SELECT ENDPOINTS
      // "/lol-champ-select/v1/session",
      // "/lol-lobby-team-builder/champ-select/v1/subset-champion-list", // GET - new cards in ARAM
      // `/lol-perks/v1/perks-from-backed-recommendations/${champId}/NONE`, // GET - Recommended runes
      // "/lol-game-data/assets/v1/champions/22.json", // GET - Champ data
      // "/plugins/rcp-be-lol-game-data/global/default/v1/champion-rune-recommendations.json" // GET - Up to date rune recommendations
      // ----- TEST SURRENDER ENDPOINTS
      // "/lol-end-of-game/v1/surrender", // DEAD
      // "/lol-chat/v1/conversations", // DMS
      // "/lol-chat/v1/game-messages", // DEAD
      // ----- HONOR ENDPOINTS
      // "/lol-honor-v2/v1/ballot",             //   GET   - List of players to honor
      // "/lol-honor-v2/v1/vote-completion",    //   GET   - Check if voting phase complete
      // "/lol-honor-v2/v1/config",             //   GET   - Honor system config and flags
      // "/lol-honor-v2/v1/latest-eligible-game", // GET   - Last league game
      // "/lol-honor-v2/v1/recognition-history", //  GET   - Previous people who honored you
      // "/lol-honor-v2/v1/honor-player",       //   POST  - Submit honor vote
      // "/lol-honor-v2/v1/level-change",
      // "/lol-honor-v2/v1/profile",
      // "/lol-honor-v2/v1/reward-granted",
      // "/lol-honor-v2/v1/team-choices",
      // "/lol-honor-v2/v1/recognition",        //   GET   - Personal honor progress (Deprecated)
      // "/lol-honor-v2/v1/recognition-enabled",//   GET   - If honor enabled (Deprecated)
      // "/lol-honor-v2/v1/profile-summary",    //   GET   - Honor profile summary (Deprecated)
      // "/lol-honor-v2/v1/full-team-vote",     //   GET   - Full team vote status (Deprecated)
      // ----- OLD TESTING ENDPOINTS
      // "/lol-gameflow/v1/session", //              GET   - Session type ChampSelect Lobby etc
      // "/lol-gameflow/v1/gameflow-phase"           GET   - Only a game phase string
      // "/lol-end-of-game/v1/eog-stats-block", //   GET   - End of game stats
      // "/lol-chat/v1/friends", //                  GET   - Friend list
      // "/lol-chat/v1/me", //                       GET   - My own info
      // "/lol-summoner/v1/current-summoner", //     GET   - More own info
      // "/lol-lobby/v2/lobby", //                   GET   - Info about your current party
      // "/lol-perks/v1/pages", //                   GET   - All rune pages
    ];
    // #region Endpoints logic
    if (endpoints.length === 0) return;
    // return console.log(`No endpoints to test currently.\n`)

    if (endpoints.length > 1) isPlural = true;

    let payload: {
      GET: {
        successes: { [key: string]: unknown };
        failures: { [key: string]: unknown };
      };
    } = {
      GET: {
        successes: {},
        failures: {},
      },
    };

    try {
      for (const endpoint of endpoints) {
        try {
          const res = endpoint.startsWith("/lol")
            ? await leagueRequest.get(endpoint)
            : await cDragonRequest.get(endpoint);
          const data = res.data;
          payload["GET"]["successes"][endpoint] = { data };

          console.log(`Successfully scanned endpoint ${endpoint}`);
        } catch (error) {
          // Endpoint returned an error
          if (isAxiosError(error)) {
            console.log(`Error scanning endpoint ${endpoint}`);
            payload["GET"]["failures"][endpoint] = {
              data: {
                message: error.message ?? "Unknown Error",
                code: error.code ?? "No code",
                status: error.status ?? "No status",
              },
            };
          }
        }

        // Sleep for X seconds
        const sleepDurationInSec = 1;
        await new Promise((r) => setTimeout(r, sleepDurationInSec * 1000));
      }

      // Successfully finished scanning all the endpoints
      success = true;
    } catch (error) {
      // Error in the overall block of code
      console.log(`Unexpected error while scanning endpoints: `, error);
    }

    if (success) {
      const fileName = `${targetFolder}/a_${currentTestType}_endpoint${pluralSuffix}${attempt}.json`;

      fs.writeFileSync(fileName, JSON.stringify(payload, null, 2));
      console.log("Finished scanning endpoints!");
    }
    // #endregion Endpoints logic
  };
  await testEndpoints();

  // #region Handle honor
  const handleHonorPlayers = async (type: number) => {
    let honored = false;

    try {
      const { data: res } = await leagueRequest.get("/lol-honor-v2/v1/ballot");

      const gameId = res.gameId;
      const availableVotesCount = res.votePool?.votes;

      const eligibleAllies = res.eligibleAllies;

      const formattedPlayers = eligibleAllies.map(
        (player: AllPlayer) => `${player.championName}: (${player.summonerId})`
      );

      console.log(
        `\nGame ID: ${gameId}\nAvailable votes: ${availableVotesCount}\nYour Team:`,
        formattedPlayers
      );

      const targetPlayer = eligibleAllies[0];
      // const targetPlayer = eligibleAllies.find(ally => ally.summonerId === FRIENDS.Jasmy.id)

      if (targetPlayer) {
        try {
          console.log(
            `Attempt to honor ${targetPlayer.summonerId} (${targetPlayer.championName})`
          );

          console.log(
            `Target puuid: ${targetPlayer.puuid} (${targetPlayer.championName})`
          );

          let honorRes;
          if (type === 1)
            honorRes = await leagueRequest.post("/lol-honor/v1/ballot", {
              gameId,
              honorRequestVotes: [
                {
                  honorType: "HEART",
                  recipientPuuid: targetPlayer.puuid,
                },
              ],
            });
          else
            honorRes = await leagueRequest.post("/lol-honor-v2/v1/ballot", {
              honorRequestVotes: [
                {
                  honorType: "HEART",
                  recipientPuuid: targetPlayer.puuid,
                },
              ],
            });

          console.log(honorRes.data);

          if (honorRes.data === "failed_to_contact_honor_server") {
            console.warn(`Failed attempt`);
          } else {
            console.log(`✅ Honored ${targetPlayer.summonerId}`);
            honored = true;
          }
        } catch (err) {
          if (isAxiosError(err)) {
            console.error(
              `[Axios] Honor attempt failed:`,
              err.response?.data || err.message
            );
          } else {
            console.error("[Unknown] Honor attempt failed: ", err);
          }
        }
      }

      if (!honored) {
        console.error(
          `Failed to honor ${targetPlayer.championName}: (${targetPlayer.summonerId})`
        );
      }
    } catch (err) {
      if (isAxiosError(err))
        console.error(
          "[Axios] PreEndOfGame error: ",
          err.response?.data || err.message
        );
      else console.error("[Unknown] PreEndOfGame error: ", err);
    }
  };
  // await handleHonorPlayers(1);
  // #endregion Handle honor

  console.log("\nFinished all testing");
})();

/*
Old code





----------------------------------------------------------------------------------------------------

-> Handles ReadyCheck <-
  const handleAcceptQueue = async () => {
    // Avoid unnecessary extra requests
    if (isGameAccepted) return;

    console.log("[ReadyCheck]")
    try {
      const res = await leagueRequest.get("/lol-matchmaking/v1/ready-check");

      if (res.data?.state === "InProgress") {
        console.log("Accepting game...");
        await leagueRequest.post("/lol-matchmaking/v1/ready-check/accept")

        isGameAccepted = true;
      }

      // Find all players that have declined the ReadyCheck (Deprecated)
      const declinedPlayerIds = res.data?.declinerIds;
      if (declinedPlayerIds.length > 0) {
        console.log(`Decliner IDs: `)
        declinedPlayerIds.forEach(id => console.log(id))

        const friends = Object.values(FRIENDS);
        const declinedFriends = friends.filter(friend => declinedPlayerIds.includes(friend.id));

        if (declinedFriends.length > 0) {
          declinedFriends.forEach(friend => {
            console.log(`${friend.name} (${friend.id}) declined the match.`);
          })
        } else {
          console.log("No friends matched the declined IDs");
        }
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("ReadyCheck error: ", err.response?.data || err.message);
      }
    }
  }

----------------------------------------------------------------------------------------------------




----------------------------------------------------------------------------------------------------

-> Honoring a player <-
  const honorRes = await leagueRequest.post(`/lol-honor-v2/v1/honor-player`, {
    // summonerId: targetPlayer.summonerId,
    // puuid: targetPlayer.puuid, // Might be recipientPuuid
    // gameId,
    recipientPuuid: targetPlayer.puuid,
    honorType: "HEART",
    // puuid: targetPlayer.summonerId.toString(),
  });

----------------------------------------------------------------------------------------------------





----------------------------------------------------------------------------------------------------

-> OLD TESTS <-
  const runepagesPayloadDir = "./config/aram_runepages_payloads.json";
  const runepagesPayloads = fs.readFileSync(runepagesPayloadDir);

  const RUNEPAGES = JSON.parse(runepagesPayloads);

  createRunePagesInClient(RUNEPAGES);

  const runePages = findRunepagesByName("ARAM");
  const runePagesPayload = convertToPayload(runePages);


  await createRunePageInClient(runePagesPayload[0]);





  const TEST = {
    Q: [1, 2, 3, 4, 5],
    W: [6, 7, 8, 9, 10],
    E: [11, 12, 13, 14, 15],
    R: [16, 17, 18]
  }

  console.log(TEST);

  for (const [key, value] of Object.entries(TEST)) {
    if (key === "Q")
      console.log("{")
    console.log(`${key}: [ ${value.join(", ")} ]`);
    if (key === "R")
      console.log("}")
  }

----------------------------------------------------------------------------------------------------





----------------------------------------------------------------------------------------------------

-> Handle skill priority <-

  const TEST_SKILL_ORDER = {
    Q: ['1', '4', '5', '7', '9'],
    W: ['2', '8', '10', '12', '13'],
    E: ['3', '14', '15', '17', '18'],
    R: ['6', '11', '16']
  }

  const CHAMP = {
    name: "Miss Fortune",
    skillSwaps: [
      "E-Q",
      "W-Q"
    ],
    prio: "Q-E-W",
    mode: "ARAM",
    prefType: "PRIO"
  }
  const findSkillPrios = (skill_order, targetChamp) => {
    // find 9, 13, 18
    if (skill_order["R"].join(',') !== '6,11,16')
      return skill_order;
    const firstPrio = Object.values(skill_order).find(arr => arr.includes('9'));
    const secondPrio = Object.values(skill_order).find(arr => arr.includes('13'));
    const thirdPrio = Object.values(skill_order).find(arr => arr.includes('18'));
    if (targetChamp.prefType.toUpperCase() === "PRIO") {
      const newSkillOrder = targetChamp.prio.split('-');
      skill_order[newSkillOrder[0]] = firstPrio;
      skill_order[newSkillOrder[1]] = secondPrio;
      skill_order[newSkillOrder[2]] = thirdPrio;
      console.log(`Rearranged skill prio to ${newSkillOrder.join(" -> ")}`)

    }
  }
  console.log(findSkillPrios(TEST_SKILL_ORDER, CHAMP))

----------------------------------------------------------------------------------------------------





----------------------------------------------------------------------------------------------------

-> Grab Recommended Runepage <-
 const grabRecommendedRunepage = (
    recommendations: ChampionRuneRecEntry[],
    champId: number,
    pages: RunePage[]
  ): Record<string, RunePagePayload> | undefined => {
    const pageExists = pages.find(
      (p) => p.name.toUpperCase() === "AUTORUNEPAGE"
    );

    if (!pageExists) {
      console.log(
        "AutoRunepage not found!\nIf you'd like this feature, create a rune page and name it AutoRunepage"
      );
      return;
    }

    const result = recommendations.find(
      (champ) => champ.championId === champId
    );

    if (!result) return;

    const page = result.runeRecommendations.filter(
      (rec) => rec.mapId === 12
    )[0];

    console.log(`Recommended runepage found! Applying to AutoRunepage...`);

    const pagePayload = {
      name: "AutoRunepage",
      primaryStyleId: page.primaryPerkStyleId,
      subStyleId: page.secondaryPerkStyleId,
      selectedPerkIds: page.perkIds,
      current: true,
    };

    await leagueRequest.put(`/lol-perks/v1/pages/${targetRunePage.id}`, pagePayload);

    return { payload: pagePayload };
  };

  const page = grabRecommendedRunepage(RECOMMENDED_RUNES, 22, RUNEPAGES);

  console.log(page);

----------------------------------------------------------------------------------------------------





 */
