
import  { Evt, NonPostableEvt, ToPostableEvt, StatefulReadonlyEvt } from "evt";

type MutableItem = {
  id: string;
  description: string;
  isCompleted: boolean;
};

export type Item = Readonly<MutableItem>;

type ItemLike = Pick<Item, "id">;

export type Store = Readonly<{

  items: Item[];

  /* Evts to notify when the items has changed */
  evtNewItem: NonPostableEvt<{ item: Item; }>;
  evtDeletedItem: NonPostableEvt<{ item: Item; }>;
  evtItemUpdated: NonPostableEvt<{ item: Item; updateType: "DESCRIPTION" | "IS COMPLETED"; }>;

  /* Function for changing the items */
  createItem(params: { description: string; isCompleted: boolean; }): Promise<void>;
  deleteItem(params: { item: ItemLike; }): Promise<void>;
  updateItemDescription(params: { item: ItemLike; description: string; }): Promise<void>;
  updateItemIsCompleted(params: { item: ItemLike; isCompleted: boolean; }): Promise<void>;

}>;

export async function getMockStore(): Promise<Store> {

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
    { "id": getNewId(), "description": "💧 Acknowledge that EVT works well with React Hooks", "isCompleted": true }
  ];

  const store: ToPostableEvt<Store>= {
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

        store.evtNewItem.post({item});


    },
    "deleteItem": async ({ item: { id } })=> {

        await simulateNetworkDelay();

        const item = items.find(item=> item.id === id);
        
        if( item === undefined ){
          return;
        }

        items.splice(items.indexOf(item), 1);

        store.evtDeletedItem.post({ item });

    },
    "updateItemDescription": async ({ item: { id }, description })=> {

        const item = items.find(item=> item.id === id);

        if( item === undefined || item.description === description ){
          return;
        }

        await simulateNetworkDelay();

        item.description = description;

        store.evtItemUpdated.post({ item, "updateType": "DESCRIPTION" });

    },
    "updateItemIsCompleted": async ({ item: { id }, isCompleted }) => {

        const item = items.find(item=> item.id === id);

      
        if( item === undefined || item.isCompleted === isCompleted ){
          return;
        }
        
        await simulateNetworkDelay();

        item.isCompleted = isCompleted;

        store.evtItemUpdated.post({ item, "updateType": "IS COMPLETED" });

    }
  };

  return store;

}


