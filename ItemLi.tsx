import React, { useReducer, useCallback, useState, useEffect, useMemo } from "react";
import {Item, Store} from "./store";
import { Evt, NonPostableEvt, StatefulReadonlyEvt } from "evt";

import { useEvt, useStatefulEvt } from "evt/hooks";
import { useAsyncCallback } from "react-async-hook";

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


  const asyncUpdateDeleteItem = useAsyncCallback(
      useCallback(
        ()=> store.deleteItem({ item }), 
        [item, store] 
      )
  );


  const [ evtIsEditing ] = useState(()=> Evt.create(false));
  const [ evtInputText ] = useState(()=>Evt.create(item.description));

  useStatefulEvt([ evtIsEditing, evtInputText ]);

  const asyncUdateItemDescrption = useAsyncCallback(
    useCallback(
      ()=> store.updateItemDescription({ item, "description": evtInputText.state }),
      [item, store]
    )
  );

  //Remplace the input text by the span when the item description have been sucessfully updated.
  useEffect(()=>{

    if( asyncUdateItemDescrption.loading ){
      return;
    }

    evtIsEditing.state = false;

  }, [asyncUdateItemDescrption.loading]);


  //For animation.
  const [isShowClassApplyed, setIsShowClassApplyed ] = useState(false);

  useEffect(()=>{
    
    const timer = setTimeout(()=> setIsShowClassApplyed(true),20);

    return ()=> { clearTimeout(timer); };    

  },[]);
  

  const onInputChange = useCallback(
    ({target}: React.ChangeEvent<HTMLInputElement>)=>
      evtInputText.state = target.value,
    []
  );

  /*
  When the user is updating a todo item description
  and stop typing for 2 second, perform the update 
  automatically. 
  */
  

  const asyncDeouncedUpdateitemDescrption = useAsyncCallback(
      useMemo(() =>
        AwesomeDebouncePromise(asyncUdateItemDescrption.execute, 2000),
        [asyncUdateItemDescrption]
      )
  );

  //When the user press enter, update imediately. 
  const onInputKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>)=> {

      if( event.key === "Enter" ){
        event.preventDefault();
        asyncUdateItemDescrption.reset();
        asyncUdateItemDescrption.execute();
        return;
      }
      asyncDeouncedUpdateitemDescrption.execute();
                      
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
        asyncUpdateItemIsCompleted.loading ? 
          <Spinner /> :
          <input
            type="checkbox"
            checked={item.isCompleted}
            onChange={asyncUpdateItemIsCompleted.execute}
          />
      }
      </div>

      <div>
      {
        evtIsEditing.state ?(
        <div>
          <input
            type="text"
            value={evtInputText.state}
            onChange={onInputChange}
            onKeyPress={onInputKeyPress}
            readOnly={asyncUdateItemDescrption.loading}
            onBlur={asyncUdateItemDescrption.execute}
            autoFocus
          />
          {asyncUdateItemDescrption.loading && <Spinner />}
        </div>):
        <span 
          className={item.isCompleted?"barred":""} 
          onClick={onSpanClick}
        >{item.description}</span>
      }
      </div>

      <div>
      {
        asyncUpdateDeleteItem.loading ? 
          <Spinner /> :
          <button onClick={asyncUpdateDeleteItem.execute}>
            <i className="fa fa-trash-o" />
          </button>
      }
      </div>
    </li>
  );


};
