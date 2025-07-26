# Simple League LCU App

## A simple application that interacts with the League of Legends LCU to automate certain actions in the client

## Made only as a fun personal project for now for me and a couple of friends to use together


Uses a mixture of **Websockets** and **Polling** to automate certain things in the league client. 

The customizable features are listed [below](#customizable-features).

 
 Additionally can automatically level your abilities while in an active game based on suggested order for your current champion on U.GG.


#### Config files inside `config/` can be used to:
- Customize ability priority order for the auto-leveler
- Define 5 default runepages to be created with `runepage_builder_aram.js`
- Keep Riot Games' recommended runes for every champion inside `recommended_runepages.json` which is also update-able by running `recommended_runes_updater.js`.
- Define a list of closed friends and add their `actualNames` and `summonerId` to use later in the `AUTO_HONOR_FRIENDS` feature or the `AUTO_INVITE_FRIENDS` feature

### Customizable features


  ```ini
  ;config/CONFIG.ini
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

## Build:
Inside project folder:

`npm i`

`npm run league`  or  `node dist/league.js`
