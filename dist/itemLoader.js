import itemsData from "../data/items.json" with { type: "json" };
// Convert array to Map entries
const itemEntries = itemsData.map((item) => [
    item.id,
    item,
]);
// Create map
export const items = new Map(itemEntries);
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
