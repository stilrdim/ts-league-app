import { ItemLocal } from "./types/index.js";
import itemsData from "../data/items.json" with {type: "json"};

// Convert array to Map entries
const itemEntries: [string, ItemLocal][] = itemsData.map((item: ItemLocal) => [item.id, item])

// Create map
export const items = new Map<string, ItemLocal>(itemEntries);