import React, { useReducer, useCallback, useState, useEffect } from "react";
import {Item} from "./store";
import { Evt, NonPostableEvt, StatefulReadonlyEvt } from "evt";

import { useEvt, useStatefulEvt } from "evt/hooks";

import { useRequest } from "./hooks/useRequest";
import { useSearch } from "./hooks/useSearch";

export type Props = {
  item: Omit<Item, "id">;
  evtUpdate: NonPostableEvt<{ updateType: "DESCRIPTION" | "IS COMPLETED";  }>;
  updateItemDescrption(params: { descrption: string; }): Promise<void>;
  updateItemIsCompleted(params: { isCompleted: boolean; }): Promise<void>;
  deleteItem(): Promise<void>;
};

export const ItemLi: React.FunctionComponent<Props>= (props)=>{

  const { items } = props;

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

  }description

  const { description, isCompleted } = item;

  const [isRequestUpdateIsCompletePending, updateItemIsCompleted ] = 
  useRequest(  
    useCallback(
      ()=> props.updateItemIsCompleted({ "isCompleted": !item.isCompleted }), 
      [props.updateItemIsCompleted, item] 
    )
  );

  const [isRequestUpdateDescriptionPending, updateItemDescription] = 
  useRequest(
    useCallback(
      (description: string)=> props.updateItemName({ description }), 
      [props.updateItemDescription] 
    )
  );

  const [isRequestDeleteItemPending, deleteItem]
  = useRequest(
    useCallback(
      ()=> props.deleteItem(),
      [props.deleteItem]
    )
  );


  const [ evtIsEditing ] = useState(()=> Evt.create(false));
  const [ evtNewDescription ] = useState(()=>Evt.create(description));

  useStatefulEvt([ evtNewDescription, evtIsEditing ]);
  
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
    "evtQuery": evtNewDescription, 
    "search": updateItemDescription 
  });

  //Automatically switch from the input text to the span
  useEffect(()=>{

    if( isRequestUpdateDescriptionPending ){
      return;
    }

    evtIsEditing.state = false;

  }, [isRequestUpdateDescriptionPending]);

  const onInputChange = useCallback(
    ({target}: React.ChangeEvent<HTMLInputElement>)=>
      evtNewDescription.state = target.value,
    []
  );

  //When the user press enter, update imediately. 
  const onInputKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>)=> {

      if( event.key !== "Enter" ){
        return;
      }
                      
      event.preventDefault();

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
            onChange={updateItemIsCompleted}
            readOnly={isRequestUpdateIsCompletePending}           
          />
      }
      </div>


      <div>
      {
        evtIsEditing.state ?(
        <div>
          <input
            type="text"
            value={evtNewDescription.state}
            onChange={onInputChange}
            onKeyPress={onInputKeyPress}
            readOnly={isRequestUpdateDescriptionPending}
            onBlur={searchNow}
            autoFocus
          />
          {isRequestUpdateDescriptionPending && <Spinner />}
        </div>):
        <span 
          className={isCompleted?"barred":""} 
          onClick={onSpanClick}
        >{description}</span>
      }
      </div>

      <div>
      {
        isRequestDeleteItemPending ? 
          <Spinner /> :
          <button onClick={deleteItem}>
            <i className="fa fa-trash-o" />
          </button>
      }
      </div>
    </li>
  );

  

};

const Spinner: React.FunctionComponent = ()=> <i className="fa fa-spin fa-spinner" />;
