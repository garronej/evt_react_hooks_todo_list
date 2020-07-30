import React, { Component, useReducer, useState, useCallback, useMemo } from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { ItemLi, Props as ItemLiProps } from "./ItemLi";
import { Item, getMockApi, Api } from "./logic";
import { useEvt, useStatefulEvt } from "evt/hooks";
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
    updateItemIsCompleted,
    createItem
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

  const [ evtNewItemDescription ] = useState(()=> Evt.create(""));
  useStatefulEvt([evtNewItemDescription]);

  /*
  const onInputKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>)=> {

      if( event.key !== "Enter" ){
        return;
      }
                      
      event.preventDefault();

      updateItemDescriptionNow();

    },
    []
  );
  */

  return (
    <div className="App">
      <form
      onSubmit={useCallback(event=> { 
        event.preventDefault();

        evtNewItemDescription.state = "";

        

        console.log("here");
        
      },[])}
      >
        <div className="wrapper">
          <input 
            type="text" 
            value={evtNewItemDescription.state}
            onChange={useCallback(({target})=> evtNewItemDescription.state= target.value,[])}
            placeholder="Describe a new thing to do..."
          />
          <input type="submit" value="Add"/>
        </div>
      </form>
      <ul>
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
    </div>
  );

};

reactDom.render(
  //<React.StrictMode>
    <SplashScreen />,
  //</React.StrictMode>, 
  document.getElementById("root")
);
