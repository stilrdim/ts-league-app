import {
  allRunesConfigPath,
  champPrefsConfigPath,
  champsConfigPath,
  friendsConfigPath,
  recRunesConfigPath,
} from "../leveler_module.js";
import { ClientState } from "../types/general.js";
import { ChampPreference } from "../types/ingame.js";
import { RunePage } from "../types/runes.js";
import { CloseFriends } from "../types/users.js";
import fs from "fs";

// CONFIG
export const CONFIG = {
  AUTO_LEVEL_ABILITIES: true,
  SKIP_ENDGAME_SCREEN: true,
  AUTO_HONOR_FRIENDS: true,
  AUTO_QUEUE_UP: true,
  AUTO_ACCEPT_QUEUE: true,
  AUTO_INVITE_FRIENDS: true,
  AUTO_SELECT_RUNES: true,
  AUTO_SELECT_RECOMMENDED_RUNES: true,
  ONLY_FOR_ARAMS: true,
  POLLING_INTERVAL_IN_SECONDS: 1,
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
