# Simple League LCU App

A simple application that interacts with the `League of Legends LCU` (League Client Update API) to automate various client actions.

This is a personal project made for fun to use with a small group of friends.

It uses a combination of **WebSockets** and **polling** to react to game state changes inside the League client.

---

## Features

- Automatically level abilities during a game using recommended skill order (`U.GG`-based)
- Auto queue handling (ready check, matchmaking flow)
- Auto honor system for selected friends
- Auto invite friends to lobby
- Auto rune page handling
- Optional skipping of end game screen
- Champion-specific logic for `ARAM` / `normal` modes

---

## Config

All main behavior is controlled through `config/CONFIG.ini`:

```ini
AUTO_LEVEL_ABILITIES=true
SKIP_ENDGAME_SCREEN=false
AUTO_HONOR_FRIENDS=true
AUTO_QUEUE_UP=true
AUTO_ACCEPT_QUEUE=true
AUTO_INVITE_FRIENDS=true
AUTO_SELECT_RUNES=true
AUTO_SELECT_RECOMMENDED_RUNES=true
ONLY_FOR_ARAMS=true
POLLING_INTERVAL_IN_SECONDS=1
```

You can toggle features on/off without touching code.

---

## Config Files

Inside `config/` you can also define:

- Champion ability priority presets for auto-leveling
- Default rune pages used by rune page builder scripts
- Riot “recommended runes” cache (auto-updatable)
- Friend list for:
  - auto invite system
  - auto honor system

---

## How It Works

The app connects directly to the League client using:

- WebSockets (for real-time client state changes)
- Polling (for game state validation and fallback logic)

It listens for states like:

- Lobby
- Matchmaking
- ReadyCheck
- ChampSelect
- InGame

And runs automation logic depending on the current state.

---

## Demo image

![Demo image showcasing output of state changes, recommended items and skill prioritization](https://i.ibb.co/MDYPwXr0/league-app.png)

---

## Auto Leveling

During an active game, the app:

- Reads live game data from the `League Live Client API`
- Fetches recommended skill order from `U.GG`
- Applies champion-specific overrides (if defined)
- Automatically levels abilities using keyboard simulation

Supports:

- `ARAM` logic (different early leveling rules)
- Custom skill priority swaps
- Champion-specific builds

---

## Build & Run

Install dependencies

```bash
npm i
```

Build the project

```bash
npm run build
```

Run the compiled app

```bash
npm run league
```

Or directly

```bash
node dist/league.js
```

---

## Notes

- This project is **experimental** and **may break** after League client updates
- Some features depend on internal `Riot APIs` that are **not** officially supported
- Designed for personal use only

---
