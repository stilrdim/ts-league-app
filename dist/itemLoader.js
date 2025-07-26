import itemsData from "../data/items.json" with { type: "json" };
// Convert array to Map entries
const itemEntries = itemsData.map((item) => [item.id, item]);
// Create map
export const items = new Map(itemEntries);
