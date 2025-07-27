import { isAxiosError } from "axios";
import { COLLECTIONS, CONFIG } from "./config/constants.js";
import { leagueRequest } from "./connection.js";
import {
  ChampionRuneRecEntry,
  RunePage,
  RunePagePayload,
} from "./types/index.js";

const { RECOMMENDED_RUNES, CHAMPS } = COLLECTIONS;

const { AUTO_SELECT_RECOMMENDED_RUNES } = CONFIG;

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

  const page = result.runeRecommendations.filter((rec) => rec.mapId === 12)[0];

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
): Promise<void> => {
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

export const handleRunepage = async (
  champName: string,
  champId: number,
  runePages: RunePage[]
): Promise<void> => {
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
