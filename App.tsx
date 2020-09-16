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
        {store.items.map(item=> {

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