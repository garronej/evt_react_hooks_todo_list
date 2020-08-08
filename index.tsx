import React, { Component, useReducer, useState, useCallback, useMemo, useEffect } from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { ItemLi, Props as ItemLiProps } from "./ItemLi";
import { Item, getMockApi, Api } from "./logic";
import { useEvt, useStatefulEvt } from "evt/hooks";
import { Evt } from "evt";
import { useRequest } from "./hooks/useRequest";
import { Spinner } from "./Spinner";

/*
This implementation of a TODO list focus on being well optimized, memory leaks free and apply 
strict isolation of concerns.
The result may come out as over engineered for such a straightforward web app but it provides guidelines for building React/ReactNative app that will scale well as your business grows. Keep in mind that, in React Native, memory leaks are a much bigger deal than they are on the web. 

The loading times are all simulated, they are meant to show how to build a UI that stays usable
even in bad network conditions or when the backend is under heavy loads. 
*/

const SplashScreen: React.FunctionComponent<{}> = ()=> {

  const [ ,triggerFetch, [ mockApi ]]= useRequest(getMockApi);

  useEffect(()=> { triggerFetch(); },[]);

  return mockApi === undefined ? 
      <h1><Spinner /> Fetching your todo items...</h1> :
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


  const [isCreateItemRequestPending, createItem]=useRequest(
    useCallback(
      api.createItem,
      [api.createItem]
    )
  );

  return (
    <div className="App">
      <form
      onSubmit={useCallback(event=> { 
        event.preventDefault();

        createItem({
          "description": evtNewItemDescription.state,
          "isCompleted": false
        });

        evtNewItemDescription.state = "";

      },[createItem])}
      >

        <div className="wrapper">
          <input 
            type="text" 
            value={evtNewItemDescription.state}
            onChange={useCallback(({target})=> evtNewItemDescription.state= target.value,[])}
            placeholder={
              isCreateItemRequestPending?
              "Loading...":
              "Describe a new thing to do..."
            }
          />
          <button type="submit">
            {isCreateItemRequestPending?<Spinner />:"Add"}
          </button>
          
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
  <React.StrictMode>
    <SplashScreen />,
  </React.StrictMode>, 
  document.getElementById("root")
);