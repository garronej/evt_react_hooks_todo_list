
import  { Evt, NonPostableEvt, ToPostableEvt, StatefulReadonlyEvt } from "evt";

type MutableItem= {
  id: string;
  description: string;
  isCompleted: boolean;
};

export interface Item extends Readonly<MutableItem> {}

export type Api ={
  readonly items: Readonly<Item[]>;

  /* Evts to notify when the items has changed */
  evtNewItem: NonPostableEvt<{ item: Item; }>;
  evtDeletedItem: NonPostableEvt<{ item: Item; }>;
  evtItemUpdated: NonPostableEvt<{ item: Item; updateType: "DESCRIPTION" | "IS COMPLETED"; }>;

  /* Function for changing the items */
  createItem(params: { description: string; isCompleted: boolean; }): Promise<void>;
  deleteItem(params: { item: Item; }): Promise<void>;
  updateItemDescription(params: { item: Item; description: string; }): Promise<void>;
  updateItemIsCompleted(params: { item: Item; isCompleted: boolean; }): Promise<void>;
};

export async function getMockApi(): Promise<Api> {

   const getNewId= (()=>{

    let count = 0;

    return ()=> `${count++}`;

  })();

  const simulateNetworkDelay = (delay= 600)=> new Promise<void>(resolve=> setTimeout(resolve, delay));

  await simulateNetworkDelay(900);

  const items: MutableItem[]= [
    { "id": getNewId(), "description": "🚀 Understand the useEvt hook", "isCompleted": false },
    { "id": getNewId(), "description": "⭐ Understand the useStatefulEvt hook", "isCompleted": false },
    { "id": getNewId(), "description": "🔒 Checkout run-exclusive, usefull for network requests", "isCompleted": false },
    { "id": getNewId(), "description": "💧 Acknowledge that EVT works well with React Hooks", "isCompleted": true },

  ];

  const api: ToPostableEvt<Api>= {
    items,
    "evtNewItem": new Evt(),
    "evtDeletedItem": new Evt(),
    "evtItemUpdated": new Evt(),
    "createItem": async ({ description, isCompleted })=> {

        await simulateNetworkDelay();

        const item: Item = {
          "id": getNewId(),
          description, 
          isCompleted
        };

        items.unshift(item);

        api.evtNewItem.post({item});


    },
    "deleteItem": async ({ item })=> {

        await simulateNetworkDelay();

        items.splice(items.indexOf(item), 1);

        api.evtDeletedItem.post({ item });

    },
    "updateItemDescription": async ({ item, description }) => {

        if( item.description === description ){
          return;
        }

        await simulateNetworkDelay();

        (item as MutableItem).description = description;

        api.evtItemUpdated.post({ item, "updateType": "DESCRIPTION" });

    },
    "updateItemIsCompleted": async ({ item, isCompleted }) => {

        if( item.isCompleted === isCompleted ){
          return;
        }

        await simulateNetworkDelay();

        (item as MutableItem).isCompleted = isCompleted;

        api.evtItemUpdated.post({ item, "updateType": "IS COMPLETED" });

    }
  };

  return api;

}
