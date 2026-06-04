import axios from "axios";
import * as cheerio from "cheerio";
import { champNamesConfigPath } from "./config/constants.js";
import fs from "fs";
import path from "path";

async function loadChampPage(): Promise<string> {
  try {
    const { data: res } = await axios.get("https://op.gg/lol/champions");
    return res;
  } catch (err) {
    console.error(err);
    return "";
  }
}

function getChampNames(html: string): string[] {
  if (!html) return [];

  const $ = cheerio.load(html);

  // Element holding all champ names
  const champNames = $(`.w-\\[46px\\].truncate.text-xs.text-gray-500`)
    .map((_, el) => {
      const url = $(el).closest("a").attr("href");

      if (!url) return;

      const champName = url.split("champions/")[1].split("/")[0];
      // if (champName === "build") return;
      return champName;
    })
    .get();

  return champNames;
}

async function main() {
  console.log("Hi!");

  const html = await loadChampPage();

  const result = getChampNames(html);

  fs.writeFileSync(champNamesConfigPath, JSON.stringify(result, null, 2), {
    encoding: "utf-8",
  });

  console.log(`Updated ${path.basename(champNamesConfigPath)}`);
}

main();
