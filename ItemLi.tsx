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
      ctx=> { evtUpdate.attach(ctx, ()=> forceUpdate()); },
      [item, evtUpdate]
    );

  }

  const { name, isCompleted } = item;

  const [isRequestUpdateIsCompletePending, updateItemIsCompletedProxy ] = useRequest(  
    useCallback(
      ()=> updateItemIsCompleted({ "isCompleted": !item.isCompleted }), 
      [updateItemIsCompleted, item] 
    )
  );

  const [isRequestUpdateNamePending, updateItemNameProxy ] = useRequest(
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

  const [isEddit, setIsEddit] = useState(false);

  const [evtText] = useState(()=>Evt.create(name));

  useStatefulEvt([ evtText ]);

  /*
  NOTE: It would be much easyer to have a simple 
  imput and a button that the user would have to
  click when he is done instead of this complicated
  hook but it use it anyway as the goal of this demo
  is mainly to demonstrate how to use EVT with react.
  */
  useSearch({ 
    "delay": 750, 
    "evtQuery": evtText, 
    "search": updateItemNameProxy 
  });

  /*
  return (
    <li className="itemLi">
      <div>
      {
        isRequestUpdateIsCompletePending ? 
          <i className="fa fa-spin fa-spinner" /> :
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={updateItemIsCompletedProxy}
            readOnly={isRequestUpdateIsCompletePending}
          />
      }
      </div>
      <div>
        <span className={isCompleted?"barred":""}>{name}</span>
      </div>

      <div>
      {
        isRequestDeleteItemPending ? 
          <i className="fa fa-spin fa-spinner" /> :
          <button onClick={deleteItemProxy}>
            <i className="fa fa-trash-o" />
          </button>
      }
      </div>
    </li>
  );
  */

  
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
            readOnly={isRequestUpdateIsCompletePending}
          />
      }
      </div>
 
      <span className={isCompleted?"barred":""}>{name}</span>
  
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

const Spinner: React.FunctionComponent = ()=> 
  <i className="fa fa-spin fa-spinner" />;
