import { fileURLToPath } from "url";
import { ClientState } from "../types/general.js";
import { ChampPreference } from "../types/ingame.js";
import { RunePage } from "../types/runes.js";
import { CloseFriends } from "../types/users.js";
import fs from "fs";
import ini from "ini";
import path from "path";

// Manually define __dirname and export paths
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const rootDir = __dirname + "/../..";

export const friendsConfigPath = path.join(rootDir, "config", "friends.json");
export const champsConfigPath = path.join(rootDir, "config", "champs.json");
export const champPrefsConfigPath = path.join(
  rootDir,
  "config",
  "champ_preferences.json"
);
export const recRunesConfigPath = path.join(
  rootDir,
  "config",
  "recommended_runepages.json"
);
export const allRunesConfigPath = path.join(
  rootDir,
  "data",
  "all_runepages.json"
);
export const champNamesConfigPath = path.join(
  rootDir,
  "config",
  "leveler_champs_array.json"
);
const configFilePath = path.join(rootDir, "config", "CONFIG.ini");

const rawConfigData = fs.readFileSync(configFilePath, "utf-8");
const parsedConfigData = ini.parse(rawConfigData);
console.log(`configfilepath: `, configFilePath);
console.log(`rawConfigData: `, rawConfigData);
console.log(`parsedConfigData`, parsedConfigData);
// CONFIG
export const CONFIG = {
  AUTO_LEVEL_ABILITIES: Boolean(parsedConfigData.AUTO_LEVEL_ABILITIES ?? true),
  SKIP_ENDGAME_SCREEN: Boolean(parsedConfigData.SKIP_ENDGAME_SCREEN ?? true),
  AUTO_HONOR_FRIENDS: Boolean(parsedConfigData.AUTO_HONOR_FRIENDS ?? true),
  AUTO_QUEUE_UP: Boolean(parsedConfigData.AUTO_QUEUE_UP ?? true),
  AUTO_ACCEPT_QUEUE: Boolean(parsedConfigData.AUTO_ACCEPT_QUEUE ?? true),
  AUTO_INVITE_FRIENDS: Boolean(parsedConfigData.AUTO_INVITE_FRIENDS ?? true),
  AUTO_SELECT_RUNES: Boolean(parsedConfigData.AUTO_SELECT_RUNES ?? true),
  AUTO_SELECT_RECOMMENDED_RUNES: Boolean(
    parsedConfigData.AUTO_SELECT_RECOMMENDED_RUNES ?? true
  ),
  ONLY_FOR_ARAMS: Boolean(parsedConfigData.ONLY_FOR_ARAMS ?? true),
  POLLING_INTERVAL_IN_SECONDS: Number(
    parsedConfigData.POLLING_INTERVAL_IN_SECONDS
  ),
};

// Collections
const FRIENDS: CloseFriends = JSON.parse(
  fs.readFileSync(friendsConfigPath).toString()
);
const CHAMPS = JSON.parse(fs.readFileSync(champsConfigPath).toString());
const CHAMP_PREFERENCES: ChampPreference[] = JSON.parse(
  fs.readFileSync(champPrefsConfigPath).toString()
);
const RUNEPAGES: RunePage[] = JSON.parse(
  fs.readFileSync(allRunesConfigPath).toString()
);
const RECOMMENDED_RUNES = JSON.parse(
  fs.readFileSync(recRunesConfigPath).toString()
);

export const COLLECTIONS = {
  FRIENDS,
  CHAMPS,
  CHAMP_PREFERENCES,
  RUNEPAGES,
  RECOMMENDED_RUNES,
};

// Flags
// Flags to avoid unnecessary requests
export const FLAGS = {
  playAgainTriggered: false, // Clicked "Play Again" during EndOfGame stage
  honorTriggered: false, // Honored a player successfully

  hasFriendsToInvite: false, // Forgot what I was going to use this for
  inviteTriggered: false, // Invites have been sent out

  isInLobby: false, // In Lobby stage
  isQueuedUp: false, // In Matchmaking stage
  isGameAccepted: false, // In ReadyCheck stage
  isInGame: false, // In InProgress stage
  isInChampSelect: false, // In ChampSelect stage

  isPartyLeader: false, // If you can't start a game, don't even bother trying
  canStartGame: false, // If we can start at all, someone might have penalty, etc
  isLobbyFull: false, // If lobby is full to avoid inviting even if more people are online
};

// STATE VARIABLES
export const STATES = {
  lastChampId: null as number | null, // Track champion changes during ChampSelect stage
  honorVotesRemaining: -1 as number,
  clientState: "Disconnected" as ClientState,
};

export const HONOR = {
  priorityList: [
    FRIENDS.Jasmy,
    FRIENDS.babyclaps,
    FRIENDS.bopped,
    FRIENDS.Farewell,
    FRIENDS.Ghettoven,
    FRIENDS.Ecci,
    FRIENDS.Magdora,
    FRIENDS.Kittzie,
    FRIENDS.Onixy,
    FRIENDS.Twelve,
    FRIENDS.maidcafe,
  ],
};

export enum HttpStatus {
  NO_CONTENT = 204,
  NOT_FOUND = 404,
}
export enum RuneStyle {
  PRECISION = 8000,
  DOMINATION = 8100,
  SORCERY = 8200,
  RESOLVE = 8400,
  INSPIRATION = 8300,
}
export enum SummonerSpell {
  FLASH = 4,
  IGNITE = 14,
  SMITE = 11,
  TELEPORT = 12,
}
