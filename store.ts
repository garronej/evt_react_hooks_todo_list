
import  { Evt, NonPostableEvt, ToPostableEvt, StatefulReadonlyEvt } from "evt";

type MutableItem= {
  id: string;
  name: string;
  isCompleted: boolean;
};

export interface Item extends Readonly<MutableItem> {}

export type Api ={
  readonly items: Readonly<Item[]>;

  evtNewItem: NonPostableEvt<{ item: Item; }>;
  evtDeletedItem: NonPostableEvt<{ item: Item; }>;
  evtItemUpdated: NonPostableEvt<{ item: Item; updateType: "NAME" | "IS COMPLETED"; }>;

  createItem(params: { name: string; isCompleted: boolean; }): Promise<void>;
  deleteItem(params: { item: Item; }): Promise<void>;
  updateItemName(params: { item: Item; name: string; }): Promise<void>;
  updateItemIsCompleted(params: { item: Item; isCompleted: boolean; }): Promise<void>;
};

export async function getMockApi(): Promise<Api> {

   const getNewId= (()=>{

    let count = 0;

    return ()=> `${count++}`;

  })();

  const simulateNetworkDelay = (delay= 600)=> new Promise<void>(resolve=> setTimeout(resolve, delay));

  await simulateNetworkDelay(100);

  const items: MutableItem[]= [
    { "id": getNewId(), "name": "⛳ Understand the useEvt hook", "isCompleted": false },
    { "id": getNewId(), "name": "⭐ Understand the useStatefulEvt hook", "isCompleted": false },
    { "id": getNewId(), "name": "🚀 Acknowledge that EVT works well with React Hooks", "isCompleted": true },
  ];

  const api: ToPostableEvt<Api>= {
    items,
    "evtNewItem": new Evt(),
    "evtDeletedItem": new Evt(),
    "evtItemUpdated": new Evt(),
    "createItem": async ({ name, isCompleted })=> {

        await simulateNetworkDelay();

        const item: Item = {
          "id": getNewId(),
          name, 
          isCompleted
        };

        items.push(item);

        api.evtNewItem.post({item});


    },
    "deleteItem": async ({ item })=> {

        await simulateNetworkDelay();

        items.splice(items.indexOf(item), 1);

        api.evtDeletedItem.post({ item });

    },
    "updateItemName": async ({ item, name }) => {

        await simulateNetworkDelay();

        (item as MutableItem).name = name;

        api.evtItemUpdated.post({ item, "updateType": "NAME" });

    },
        "updateItemIsCompleted": async ({ item, isCompleted }) => {

        await simulateNetworkDelay();

        (item as MutableItem).isCompleted = isCompleted;

        api.evtItemUpdated.post({ item, "updateType": "IS COMPLETED" });

    }
  };

  return api;

}
