import React, { useReducer, useCallback, useState, useEffect } from "react";
import {Item, Store} from "./store";
import { Evt, NonPostableEvt, StatefulReadonlyEvt } from "evt";

import { useEvt, useStatefulEvt } from "evt/hooks";
import { useAsyncCallback } from "react-async-hook";

import { useSearch } from "./hooks/useSearch";
import { Spinner } from "./Spinner";
import AwesomeDebouncePromise from "awesome-debounce-promise";

export type Props = {
  item: Item;
  store: Pick<Store, "evtItemUpdated" | "updateItemIsCompleted" | "updateItemDescription" | "deleteItem">
};

export const ItemLi: React.FunctionComponent<Props>= props =>{

  const { item, store } = props;

  
  const [,forceUpdate]= useReducer(x=>x+1,0);

  useEvt(
    ctx=> { 
      //NOTE: Re-render only when our Item is updated.
      store.evtItemUpdated.attach(
        ({ item: { id } }) => id === item.id, 
        ctx, 
        ()=> forceUpdate()); 
    },
    [item, store]
  );
  


  const asyncUpdateItemIsCompleted = useAsyncCallback(
      useCallback(
        ()=> store.updateItemIsCompleted({ item, "isCompleted": !item.isCompleted }), 
        [item, store] 
      )
  );


  const asyncUpdateItemDescription = useAsyncCallback(
      useCallback(
        (description: string)=> store.updateItemDescription({ item, description }), 
        [item, store] 
      )
  );

  const asyncUpdateDeleteItem = useAsyncCallback(
      useCallback(
        ()=> store.deleteItem({ item }), 
        [item, store] 
      )
  );



  const [ evtIsEditing ] = useState(()=> Evt.create(false));
  const [ evtInputText ] = useState(()=>Evt.create(item.description));

  useStatefulEvt([ evtIsEditing, evtInputText ]);
  
  /*
  When the user is updating a todo item description
  and stop typing for 2 second, perform the update 
  automatically. 

  NOTE: It would be much easier to have a simple 
  input and a button that the user would
  click when he is done instead of this complicated
  search hook but we use it anyway as we want to show 
  how to implement the realtime search bar with EVT.
  */
  const { searchNowWithCurrentQuery: updateItemDescriptionNow } =useSearch({ 
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

  //For animation.
  const [isShowClassApplyed, setIsShowClassApplyed ] = useState(false);

  useEffect(()=>{
    
    const timer = setTimeout(()=> setIsShowClassApplyed(true),20);

    return ()=> { clearTimeout(timer); };    

  },[]);
  

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

      updateItemDescriptionNow();

    },
    []
  );

  const onSpanClick = useCallback(
    ()=> evtIsEditing.state = true,
    []
  );

  
  
  return (
    <li className={`itemLi${isShowClassApplyed ? " show":""}`}>
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
            onBlur={updateItemDescriptionNow}
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
