import axios from "axios";
import { Agent } from "https";
import fs from "fs";
import { __dirname, recRunesConfigPath } from "./leveler_module.js";

const URL =
  "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-rune-recommendations.json";

const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

const cDragonRequest = axios.create({
  baseURL: `https://raw.communitydragon.org/pbe`,
  httpsAgent,
});

const updateRecommendedRunes = async () => {
  const res = await cDragonRequest.get(URL);
  const payload = JSON.stringify(res.data, null, 2);

  fs.writeFileSync(recRunesConfigPath, payload);

  return console.log(`Finished writing to ${recRunesConfigPath}`);
};

await updateRecommendedRunes();

console.log("Everything should be up to date now!");
