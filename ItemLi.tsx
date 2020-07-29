import React, { useReducer, useCallback, useState, useEffect } from "react";
import {Item} from "./store";
import { Evt, NonPostableEvt, StatefulReadonlyEvt } from "evt";

import { useEvt, useStatefulEvt } from "evt/hooks";

import { useRequest } from "./hooks/useRequest";
import { useSearch } from "./hooks/useSearch";

// https://static.semasim.com/css/icons.css


export type Props = {
  item: Omit<Item, "id">;
  evtUpdate: NonPostableEvt<{ updateType: "NAME" | "IS COMPLETED";  }>;
  updateItemName(params: { name: string; }): Promise<void>;
  updateItemIsCompleted(params: { isCompleted: boolean; }): Promise<void>;
  deleteItem(): Promise<void>;
};

export const ItemLi: React.FunctionComponent<Props>= 
 ({item, evtUpdate, updateItemName, updateItemIsCompleted, deleteItem})=>{

  {

    const [,forceUpdate]= useReducer(x=>x+1,0);

    useEvt(
      ctx=> { 
        evtUpdate.attach(ctx, 
          ()=> Promise.resolve(()=> forceUpdate()) 
        ); 
      },
      [item, evtUpdate]
    );

  }

  const { name, isCompleted } = item;

  const [isRequestUpdateIsCompletePending, updateItemIsCompletedProxy ] = 
  useRequest(  
    useCallback(
      ()=> updateItemIsCompleted({ "isCompleted": !item.isCompleted }), 
      [updateItemIsCompleted, item] 
    )
  );

  const [isRequestUpdateNamePending, updateItemNameProxy ] = 
  useRequest(
    useCallback(
      (name: string)=> updateItemName({ name }), 
      [updateItemName] 
    )
  );

  const [isRequestDeleteItemPending, deleteItemProxy ]
  = useRequest(
    useCallback(
      ()=> deleteItem(),
      [deleteItem]
    )
  );


  const [ evtIsEditing ] = useState(()=> Evt.create(false));
  const [ evtName ] = useState(()=>Evt.create(name));

  useStatefulEvt([ evtName, evtIsEditing ]);
  

  

  /*
  When the user is updating a todo item description
  and stop tiping for 2 second, perform the update 
  automatically. 

  NOTE: It would be much easyer to have a simple 
  imput and a button that the user would
  click when he is done instead of this complicated
  search hook but we use it anyway as the goal of this demo
  is mainly to demonstrate how to use EVT with react.
  */
  const { searchNow } =useSearch({ 
    "delay": 2000, 
    "evtQuery": evtName, 
    "search": updateItemNameProxy 
  });

  //When the update name request is no longer pending 
  //switch the text input with the span.
  useEffect(()=>{

    if( isRequestUpdateNamePending ){
      return;
    }

    evtIsEditing.state = false;

  }, [isRequestUpdateNamePending]);

  const onInputChange = useCallback(
    ({target}: React.ChangeEvent<HTMLInputElement>)=>
      evtName.state = target.value,
    []
  );

  //When the user press enter, update imediately. 
  const onInputKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>)=> {

      console.log(event);

      if( (event.keyCode || event.which)!==13){
        return;
      }
                      
      event.preventDefault();

      console.log("coucou");

      searchNow();

    },
    []
  );

  const onSpanClick = useCallback(
    ()=> evtIsEditing.state = true,
    []
  );
  
  return (
    <li className="itemLi">
      <div>
      {
        isRequestUpdateIsCompletePending ? 
          <Spinner /> :
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={updateItemIsCompletedProxy}
            onKeyUp={onInputKeyPress}
            readOnly={isRequestUpdateIsCompletePending}
            autoFocus
                      
          />
      }
      </div>


      <div>
      {
        evtIsEditing.state ?(
        <div>
          <input
            type="text"
            value={evtName.state}
            onChange={onInputChange}
            readOnly={isRequestUpdateNamePending}
          />
          {isRequestUpdateNamePending && <Spinner />}
        </div>):
        <span 
          className={isCompleted?"barred":""} 
          onClick={onSpanClick}
        >{name}</span>
      }
      </div>

      <div>
      {
        isRequestDeleteItemPending ? 
          <Spinner /> :
          <button onClick={deleteItemProxy}>
            <i className="fa fa-trash-o" />
          </button>
      }
      </div>
    </li>
  );

  

};

const Spinner: React.FunctionComponent = ()=> <i className="fa fa-spin fa-spinner" />;
