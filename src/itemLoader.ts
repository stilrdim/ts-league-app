import { ItemLocal } from "./types/index.js";
import itemsData from "../data/items.json" with {type: "json"};

let _items: Map<string, ItemLocal> | null = null;

export async function getItems(): Promise<Map<string, ItemLocal>> {
  if (!_items) {

    _items = new Map(itemsData.map((item: ItemLocal) => [item.id, item]));
  }

  return _items;
}

