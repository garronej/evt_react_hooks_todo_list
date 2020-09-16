import React, { Component, useReducer, useState, useCallback, useMemo, useEffect } from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { ItemLi, Props as ItemLiProps } from "./ItemLi";
import { Item, Store } from "./store";
import { useEvt, useStatefulEvt } from "evt/hooks";
import { Evt } from "evt";
import { useAsync, useAsyncCallback} from "react-async-hook";
import { Spinner } from "./Spinner";


export const App: React.FunctionComponent<{ store: Store }> = ({ store })=>{

  const [,forceUpdate]= useReducer(x=>x+1,0);

  /*
  NOTE: Here we have a store that keep only one copy of the data
  and mutates it internally (unlike redux that create new copies when
  actions are dispated).
  The store iforms of mutation that took place by posting
  evtNewItem, evtDeletedItem and evtUpdatedItem. 
  In this paradigme the we are in charge of trigering new render
  when and where it's relevent.
  */
  useEvt(
    ctx=> {

      Evt.merge(
        ctx, 
        [
          store.evtNewItem, 
          store.evtDeletedItem
        ]
      ).attach(()=>forceUpdate());
      
    },
    [store]
  );

  
  const [ evtNewItemDescription ] = useState(()=> Evt.create(""));
  
  useStatefulEvt([evtNewItemDescription]);

  const asyncCreateItem = useAsyncCallback(store.createItem);

  return (
    <div className="App">
      <form
      onSubmit={useCallback(event=> { 
        event.preventDefault();

        asyncCreateItem.execute({
          "description": evtNewItemDescription.state,
          "isCompleted": false
        });

        evtNewItemDescription.state = "";

      },[asyncCreateItem])}
      >

        <div className="wrapper">
          <input 
            type="text" 
            value={evtNewItemDescription.state}
            onChange={useCallback(({target})=> evtNewItemDescription.state= target.value,[])}
            readOnly={asyncCreateItem.loading}
            placeholder={
              asyncCreateItem.loading?
              "Loading...":
              "Describe a new thing to do..."
            }
          />
          <button type="submit">
            {asyncCreateItem.loading?<Spinner />:"Add"}
          </button>
          
        </div>
      </form>
      <ul>
        {store.items.map(item=> 
          <ItemLi
            key={item.id}
            item={item}
            store={store}
          /> 
        )}
      </ul>
    </div>
  );

};