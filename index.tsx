import React, { Component, useReducer, useState, useCallback, useMemo, useEffect } from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { ItemLi, Props as ItemLiProps } from "./ItemLi";
import { Item, getMockApi, Api } from "./logic";
import { useEvt } from "./hooks/useEvt";
import { Evt } from "evt";
import { useRequest } from "./hooks/useRequest";
import { Spinner } from "./Spinner";
import { useStatefulEvt } from "./hooks/useStatefulEvt";



const SplashScreen: React.FunctionComponent<{}> = ()=> {

  const [ ,triggerFetch, [ mockApi ]]= useRequest(getMockApi);

  useEffect(()=> { triggerFetch(); },[]);

  return mockApi === undefined ? 
      <h1><Spinner />Fetching your todo items...</h1> :
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

  //{

    const [,forceUpdate]= useReducer(x=>x+1,0);

    useEvt(
      ctx=> {
        Evt.merge(ctx, [evtNewItem, evtDeletedItem])
        .attach(()=>forceUpdate());
      },
      [evtNewItem, evtDeletedItem]
    );

  //}

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
  //useStatefulEvt([evtNewItemDescription]);

  /*
  useEffect(()=>{

      evtNewItemDescription.evtChange.attach(
        text=>{

          console.log("update " + text);

          forceUpdate();

        }
      );



  },[]);
  */

  useEvt(
    ctx=>{

      evtNewItemDescription.evtChange.attach(
        ctx,
        text=>{

          console.log("update " + text);

          forceUpdate();

        }
      );

    },
    []
  );


  


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
            onChange={useCallback(({target})=> {
              console.log(target.value);
              evtNewItemDescription.state= target.value
            },[])}
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
  //<React.StrictMode>
    <SplashScreen />,
  //</React.StrictMode>, 
  document.getElementById("root")
);
