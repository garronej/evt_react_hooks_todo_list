import React, { Component, useReducer, useState, useCallback, useMemo } from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { ItemLi, Props as ItemLiProps } from "./ItemLi";
import { Item, getMockApi, Api } from "./store";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import { useRequest } from "./hooks/useRequest";



const SplashScreen: React.FunctionComponent<{}> = ()=> {

  const [ ,triggerFetch, [ mockApi ]]= useRequest(getMockApi);

  useState(()=> { triggerFetch(); });

  return mockApi === undefined ? 
      <h1>Fetching your todo items...</h1> :
      <App api={mockApi}/>;

};

const App: React.FunctionComponent<{ api: Api }> = ({api})=>{

  const { 
    items, 
    evtNewItem, 
    evtDeletedItem, 
    evtItemUpdated,
    deleteItem, 
    updateItemDescription, 
    updateItemIsCompleted 
  } = api;

  {

    const [,forceUpdate]= useReducer(x=>x+1,0);

    useEvt(
      ctx=> {
        Evt.merge(ctx, [evtNewItem, evtDeletedItem])
        .attach(()=>forceUpdate());
      },
      [evtNewItem, evtDeletedItem]
    );

  }

  const [itemLiProps] = useState(()=> new WeakMap<
    Item, 
    Omit<ItemLiProps,"item"> & { detach(): void; }
  >());

  useEvt(
    ctx=>{

      evtDeletedItem.attach(
        ctx,
        ({ item })=> itemLiProps.get(item)!.detach()
      );

    },
    [ evtDeletedItem ]
  );

  return (
    <ul className="App">
      {items.map(item=> {

          let props = itemLiProps.get(item);

          if( !props ){

            const ctx = Evt.newCtx();

            props = {
              "evtUpdate": evtItemUpdated.pipe(ctx,data=> data.item === item),
              "updateItemDescription": ({ description })=> updateItemDescription({item, description}),
              "updateItemIsCompleted": ({ isCompleted })=> updateItemIsCompleted({item, isCompleted}),
              "deleteItem": ()=> deleteItem({item}),
              "detach": ()=> ctx.done()
            };

            itemLiProps.set(item, props);

          }

          return (
            <ItemLi
              key={item.id}
              item={item}
              evtUpdate={props.evtUpdate}
              updateItemDescription={props.updateItemDescription}
              updateItemIsCompleted={props.updateItemIsCompleted}
              deleteItem={props.deleteItem}
            />
          );

        }
      )}
    </ul>
  );

};

reactDom.render(
  //<React.StrictMode>
    <SplashScreen />,
  //</React.StrictMode>, 
  document.getElementById("root")
);
