import { Key, keyboard } from "@nut-tree-fork/nut-js";
import { activeWindow } from "active-win";
import axios, { isAxiosError } from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { Agent } from "https";
import fetch from "node-fetch";
import {
  champNamesConfigPath,
  champPrefsConfigPath,
  CONFIG,
} from "./config/constants.js";
import {
  AllGameData,
  ChampPreference,
  GameData,
  GameMode,
  LocalItemData,
  SkillKey,
} from "./types/index.js";

// CONSTANTS
let SKILL_ORDER: Record<SkillKey, string[]> = {
  Q: [],
  W: [],
  E: [],
  R: [],
};

const CHAMP_PREFERENCES: ChampPreference[] = JSON.parse(
  fs.readFileSync(champPrefsConfigPath).toString(),
);
const CHAMP_NAMES: string[] = JSON.parse(
  fs.readFileSync(champNamesConfigPath).toString(),
);

// FLAGS
let isLaunched = false; // If the auto-leveling script itself has been launched
let isSkillOrderFetched = false; // Skill order from U.GG
let isGamemodeFetched = false;
let isInActiveGame = false;
export let hasReachedMaxLevel = false;

let champNameFetched = false;

let GAMEMODE: GameMode | "" = "";
let CHAMP_NAME = "";

const httpsAgent = new Agent({
  rejectUnauthorized: false, // Disable SSL cert verification
});

const liveClientData = axios.create({
  baseURL: "https://127.0.0.1:2999/liveclientdata",
  httpsAgent,
});

let prevChampLevel: number | null = null;

const addPoint = (key: SkillKey, skill: string): void => {
  SKILL_ORDER[key].push(skill);
};

const normalizeChampionName = (champName: string): string | undefined => {
  // Store in a new variable clearing all instances of ' and .
  if (champName === "") {
    console.log(
      "Something went wrong when getting the champion name. Received empty string.",
    );
    return;
  }

  const normalizedName = champName.toLowerCase().replace(/[.'"]/g, "");
  const firstName = normalizedName.split(" ")[0];

  if (!firstName) return;

  // Try to find exact match --- in case of "vi" returning "sivir"
  let champFound = CHAMP_NAMES.find((champ) => champ === firstName);

  // If that doesn't work, resort to a broader search with just the first name
  if (!champFound) {
    champFound = CHAMP_NAMES.find((champ) => champ.includes(firstName));
  }

  if (!champFound) {
    console.log(
      "The champion name seems to be undefined or not valid. Is it a new champ release? Add it to config/leveler_champs_array.json!",
    );
  }

  return champFound;
};

const getSkillOrder = async (
  champName: string,
  gameMode: GameMode,
): Promise<void> => {
  isSkillOrderFetched = true;
  let url;

  // Filter out useless symbols in name
  let matchedChampName: string | undefined = normalizeChampionName(champName);

  if (matchedChampName && gameMode === "ARAM") {
    console.log("Getting ARAM skill order");
    url = `https://u.gg/lol/champions/aram/${matchedChampName}-aram`;
  } else {
    console.log("Getting normal skill order");
    url = `https://u.gg/lol/champions/${matchedChampName}/build`;
  }
  await fetch(url)
    .then((res) => res.text())
    .then((body) => {
      const $ = cheerio.load(body);
      const skillOrderDiv = $("div.skill-order");
      const children = skillOrderDiv.children();

      children.each((i, el) => {
        const level = i + 1;
        const skill = $(el).text().trim();

        // U.GG returns the entire html element including all the boxes for each level
        // + 1 for passive (73 total)

        // Sort out skills by order
        if (level >= 1 && level <= 18) {
          if (skill) addPoint("Q", skill);
        } else if (level >= 19 && level <= 36) {
          if (skill) addPoint("W", skill);
        } else if (level >= 37 && level <= 54) {
          if (skill) addPoint("E", skill);
        } else if (level >= 55 && level <= 72) {
          if (skill) addPoint("R", skill);
        }
      });
    })
    .catch((err) => console.error("Error while fetching skill order: ", err));
};

const fetchGamemode = (gameData: GameData, champName: string): GameMode => {
  isGamemodeFetched = true;

  const gameMode = gameData.gameMode;

  console.log(`[Auto-lvler]\nGamemode: ${gameMode}\nChampion: ${champName}\n`);

  return gameMode;
};

const ctrlTapKey = async (letter: SkillKey): Promise<void> => {
  const key = Key[letter]; // Key.Q / Key.W / Key.E / Key.R

  await keyboard.pressKey(Key.LeftControl, key);
  await keyboard.releaseKey(Key.LeftControl, key);
};

const changeSkillPrio = (skillOne: SkillKey, skillTwo: SkillKey): void => {
  const firstSkill = SKILL_ORDER[skillOne]; // Ex.          Q:  1, 4,  5,  7,  9
  const secondSkill = SKILL_ORDER[skillTwo]; // Ex.         W:  2, 8, 10, 12, 13

  SKILL_ORDER[skillOne] = secondSkill; //                   Apply W order to Q
  SKILL_ORDER[skillTwo] = firstSkill; //                    Apply Q order to W

  console.log(`Swapping priority for abilities [${skillOne}] - [${skillTwo}]`);
};

const getChampName = (allGameData: AllGameData): string => {
  champNameFetched = true;

  const summonerName = allGameData.activePlayer.riotId;
  const allPlayers = allGameData.allPlayers;

  const player = allPlayers.find((p) => p.riotId === summonerName);

  if (!player) {
    console.log(
      `Something is wrong with you receiving ingame data.\n Summoner name ${summonerName} not found.`,
    );
    return "";
  }

  return player.championName;
};

const handleAramStart = async (): Promise<void> => {
  const ability1 = Object.entries(SKILL_ORDER).find(([_, levels]) =>
    levels.includes("1"),
  )?.[0] as SkillKey | undefined;

  const ability2 = Object.entries(SKILL_ORDER).find(([_, levels]) =>
    levels.includes("2"),
  )?.[0] as SkillKey | undefined;

  const ability3 = Object.entries(SKILL_ORDER).find(([_, levels]) =>
    levels.includes("3"),
  )?.[0] as SkillKey | undefined;

  if (!ability1 || !ability2 || !ability3) {
    return console.log(
      "Something went wrong when trying to find where to put your first 3 skillpoints",
    );
  }
  console.log(
    `[ARAM] Putting points into your [${ability1}] [${ability2}] [${ability3}]`,
  );
  await ctrlTapKey(ability1);
  await ctrlTapKey(ability2);
  await ctrlTapKey(ability3);
};

const handleSkillPrio = (targetChamp: ChampPreference): void => {
  // If the R isn't as expected, it's probably a unique champ like udyr jayce etc, just a failsafe
  if (SKILL_ORDER.R.join(",") !== "6,11,16")
    return console.log(
      "Unique champ detected - [R] leveling isn't as expected.",
    );

  const firstPrio = Object.values(SKILL_ORDER).find((arr) => arr.includes("9"));
  const secondPrio = Object.values(SKILL_ORDER).find((arr) =>
    arr.includes("13"),
  );
  const thirdPrio = Object.values(SKILL_ORDER).find((arr) =>
    arr.includes("18"),
  );

  if (!firstPrio || !secondPrio || !thirdPrio) {
    return console.warn(
      "Failed to find skill levels 9, 13 or 18 in current SKILL_ORDER",
    );
  }

  const newSkillOrder = targetChamp.prio.split("-") as SkillKey[];
  SKILL_ORDER[newSkillOrder[0]] = firstPrio;
  SKILL_ORDER[newSkillOrder[1]] = secondPrio;
  SKILL_ORDER[newSkillOrder[2]] = thirdPrio;

  console.log(`Rearranged skill prio to ${newSkillOrder.join(" -> ")}`);
};

const handleSkillSwap = (targetChamp: ChampPreference): void => {
  // Example: E-Q
  targetChamp.skillSwaps?.forEach((s) => {
    const [fromSkill, toSkill] = s.split("-") as [SkillKey, SkillKey];

    if (fromSkill && toSkill) changeSkillPrio(fromSkill, toSkill);
  });
};

const handleChampPreferences = (champName: string, gameMode: string): void => {
  isInActiveGame = true; // Run all of this only once

  console.log(`Checking champ preferences for:\n${champName}`); // Keep this for debugging purposes
  const targetChamp = CHAMP_PREFERENCES.find(
    (champ) => champ.name === champName,
  );

  if (targetChamp) {
    // If it has no "mode" field consider it as "ALL"
    const champMode = targetChamp.mode?.toUpperCase() ?? "ALL";

    const preferenceType = targetChamp.prefType?.toUpperCase() ?? "PRIO";

    // Check if mode preferences for that champ match and if the champ exists
    if (champMode === "ALL" || champMode === gameMode.toUpperCase()) {
      switch (preferenceType) {
        case "PRIO":
          handleSkillPrio(targetChamp);
          break;

        case "SWAP":
          handleSkillSwap(targetChamp);
          break;
      }
    }
  } else {
    console.log("No special skill priority preferences detected");
  }

  console.log(`\nSkill priority:`);
  console.log(SKILL_ORDER); // List separately - avoid [Object object] and keep syntax highlight
  console.log("\n\n");
};

const fetchRecommendedItems = async (
  champName: string,
  gameMode: GameMode,
): Promise<void> => {
  try {
    const matchedChampName = normalizeChampionName(champName);

    let url;
    if (gameMode === "ARAM")
      url = `https://op.gg/lol/modes/aram/${matchedChampName}/items`;
    else url = `https://op.gg/lol/champions/${matchedChampName}/items`;
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const items: LocalItemData[] = [];
    const $ = cheerio.load(html);

    const itemsHeading = $('div:contains("Items")').filter((_, el) => {
      return $(el).text().trim() === "Items";
    });

    const itemsSection = itemsHeading.closest("section");
    const itemsTable = itemsSection.find("tbody");

    const rows = itemsTable.children("tr");

    // Loop over 15 rows or the rows.length if the rows are less than 15
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const $row = $(rows[i]);
      const name = $row.find("strong.text-gray-900").text().trim();
      const pickRate = $row
        .find("td.bg-gray-100 span.font-bold")
        .first()
        .text()
        .trim();
      const winRate =
        $row.find("td:last-child strong").text().trim() ?? "Unknown";

      const gamesPurchased = $row
        .find("td.bg-gray-100 span.text-gray-500")
        .first()
        .text()
        .trim();

      if (name && pickRate) {
        items.push({ name, pickRate, winRate, gamesPurchased });
      }
    }

    console.log(`\n\n\nRecommended items for ${champName}`);
    console.table(
      items.map((item) => ({
        Name: item.name,
        "Pick Rate %": item.pickRate,
        "Win Rate %": item.winRate,
        "Games Purchased": item.gamesPurchased,
      })),
    );
  } catch (err) {
    if (isAxiosError(err)) {
      console.error(
        "[Axios] Error fetching recommended items: ",
        err.response?.data || err.message,
      );
    } else {
      console.error("[Unknown] Error fetching recommended items: ", err);
    }
  }
};

const levelUp = async (champLevel: number): Promise<void> => {
  const resultForAbility = Object.entries(SKILL_ORDER).find(([_, levels]) =>
    levels.includes(champLevel.toString()),
  );

  const abilityToLevel = resultForAbility
    ? (resultForAbility[0] as SkillKey)
    : null;
  if (!abilityToLevel) return;

  console.log(`[${champLevel}] -> [${abilityToLevel}]`);

  await ctrlTapKey(abilityToLevel);
};

export const resetLevelingFlags = (): void => {
  isSkillOrderFetched = false;
  isGamemodeFetched = false;
  isInActiveGame = false;
  hasReachedMaxLevel = false;

  champNameFetched = false;

  GAMEMODE = "";
  CHAMP_NAME = "";

  prevChampLevel = null;

  SKILL_ORDER = {
    Q: [],
    W: [],
    E: [],
    R: [],
  };
};

export const handleLeveling = async (): Promise<void> => {
  if (!isLaunched) {
    isLaunched = true;
    console.log("League auto-leveler launched!");
  }

  // Ensure we're tabbed in, otherwise don't bother doing anything at all
  const activeWin = await activeWindow();
  if (!activeWin?.title.toLowerCase().includes("league of legends")) return;

  try {
    const { data: allGameData } =
      await liveClientData.get<AllGameData>("/allgamedata");

    const summonerInfo = allGameData.activePlayer;
    const gameInfo = allGameData.gameData;

    // Check if game has begun
    const isInLoadingScreen =
      gameInfo.gameTime < CONFIG.CONSIDER_GAME_AS_STARTED_AFTER_X_SECONDS;
    if (isInLoadingScreen) return;

    // Figure out the champ name using summoner ID etc...
    if (!champNameFetched) CHAMP_NAME = getChampName(allGameData);
    if (!CHAMP_NAME) return;

    const champLevel = summonerInfo.level;

    // Ensure the level has changed compared to the last poll
    if (!champLevel || prevChampLevel === champLevel || champLevel === 0)
      return;

    prevChampLevel = champLevel;

    // Fetch our current game mode from the LiveClientData
    if (!isGamemodeFetched) GAMEMODE = fetchGamemode(gameInfo, CHAMP_NAME);
    if (!GAMEMODE) return;

    // Fetch our skill order from U.GG
    if (!isSkillOrderFetched) await getSkillOrder(CHAMP_NAME, GAMEMODE);

    // Fetch our recommended items from OP.GG

    // Run only once in an active game and check if the user has special preferences for this champ
    if (!isInActiveGame) {
      handleChampPreferences(CHAMP_NAME, GAMEMODE);
      await fetchRecommendedItems(CHAMP_NAME, GAMEMODE);
    }

    // Level all first 3 skills
    if (GAMEMODE?.toLowerCase() === "aram" && champLevel === 3)
      return await handleAramStart();

    // Grab current ability to upgrade based on our new level
    await levelUp(champLevel);

    if (champLevel === 18) {
      hasReachedMaxLevel = true;
      console.log(`Level 18 reached. Turning off auto-leveler!\n`);
    }
  } catch (err) {
    // Most likely just haven't started a game yet, might be a port issue or more
    if (isInActiveGame) isInActiveGame = false;
    else return;
    console.log("Not in an active game.");
  }
};
