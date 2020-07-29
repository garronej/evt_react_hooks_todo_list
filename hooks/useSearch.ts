import React from "react";
import { Evt, StatefulReadonlyEvt } from "evt";

import { useEvt } from "evt/hooks";

/**
 * Take an evtQuery and call search(evtQuery.state) when the evtQuery.state
 * is changed. Whait <delay> ms before making the request that the user
 * stopped typing.
 * 
 * Request are not made with text that are not at least 3 character long.
 * 
 * Returns a function "searchNowWithCurrentQuery" that, when called, 
 * trigger the search with the current querry and cancel the schedulled search.
 * 
 * Same idea in RxJS: https://youtu.be/Urv82SGIu_0?t=1103,
 * this implementation is more robust though.
 */
export function useSearch(
  params: { 
    delay: number;
    evtQuery: StatefulReadonlyEvt<string>, 
    search(text: string): void;
  }
): { searchNowWithCurrentQuery(): void; } {

  const { delay, evtQuery, search } = params;
  
  const { searchNowWithCurrentQuery }= useEvt(
    ctx=>{

      const evtTextDebounced = Evt.create(evtQuery.state);

      let timer: number;

      evtQuery
        .attach(ctx, async text=>{

          clearTimeout(timer);

          if( text.length < 3 ){
            return;
          }

          await new Promise(resolve=> timer = setTimeout(resolve, delay));
          
          evtTextDebounced.state = text;

        });

      //No need to bound to ctx here, evtTextDebounced is local.
      evtTextDebounced.evtChange.attach(search);

      //We dont want a search to be performed after the componenent
      //have been unmounted (ot the search function has changed...). 
      ctx.evtDoneOrAborted.attachOnce(()=> clearTimeout(timer));

      //So that the search can be triggered when the user hit enter
      //for example.
      const searchNowWithCurrentQuery = ()=> {
        clearTimeout(timer);
        search(evtQuery.state);
      };

      return { searchNowWithCurrentQuery };

    },
    [evtQuery, search]
  );

  return { searchNowWithCurrentQuery };

}