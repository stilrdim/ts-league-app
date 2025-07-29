import itemsData from "../data/items.json" with { type: "json" };
import { LocalItem } from "./types/index.js";

// Convert array to Map entries
const itemEntries: [string, LocalItem][] = itemsData.map((item: LocalItem) => [
  item.id,
  item,
]);

// Create map
export const items = new Map<string, LocalItem>(itemEntries);

/*
6 searches:
Map:    0.067ms
Find:   0.049ms


10 searches:
Map:    0.069ms
Find:   0.229ms


1000 searches:
Map:    0.088ms
Find:   2.5ms
*/
