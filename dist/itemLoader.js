import itemsData from "../data/items.json" with { type: "json" };
let items = null;
export async function getItems() {
    if (!items) {
        items = new Map(itemsData.map((item) => [item.id, item]));
    }
    return items;
}
const items2 = await getItems();
const item3 = items2.get("3153");
console.log(item3);
