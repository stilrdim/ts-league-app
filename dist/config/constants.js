import { allRunesConfigPath, champPrefsConfigPath, champsConfigPath, friendsConfigPath, recRunesConfigPath, } from "../leveler_module.js";
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
const FRIENDS = JSON.parse(fs.readFileSync(friendsConfigPath).toString());
const CHAMPS = JSON.parse(fs.readFileSync(champsConfigPath).toString());
const CHAMP_PREFERENCES = JSON.parse(fs.readFileSync(champPrefsConfigPath).toString());
const RUNEPAGES = JSON.parse(fs.readFileSync(allRunesConfigPath).toString());
const RECOMMENDED_RUNES = JSON.parse(fs.readFileSync(recRunesConfigPath).toString());
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
    lastChampId: null, // Track champion changes during ChampSelect stage
    honorVotesRemaining: -1,
    clientState: "Disconnected",
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
export var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["NO_CONTENT"] = 204] = "NO_CONTENT";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
})(HttpStatus || (HttpStatus = {}));
export var RuneStyle;
(function (RuneStyle) {
    RuneStyle[RuneStyle["PRECISION"] = 8000] = "PRECISION";
    RuneStyle[RuneStyle["DOMINATION"] = 8100] = "DOMINATION";
    RuneStyle[RuneStyle["SORCERY"] = 8200] = "SORCERY";
    RuneStyle[RuneStyle["RESOLVE"] = 8400] = "RESOLVE";
    RuneStyle[RuneStyle["INSPIRATION"] = 8300] = "INSPIRATION";
})(RuneStyle || (RuneStyle = {}));
export var SummonerSpell;
(function (SummonerSpell) {
    SummonerSpell[SummonerSpell["FLASH"] = 4] = "FLASH";
    SummonerSpell[SummonerSpell["IGNITE"] = 14] = "IGNITE";
    SummonerSpell[SummonerSpell["SMITE"] = 11] = "SMITE";
    SummonerSpell[SummonerSpell["TELEPORT"] = 12] = "TELEPORT";
})(SummonerSpell || (SummonerSpell = {}));
