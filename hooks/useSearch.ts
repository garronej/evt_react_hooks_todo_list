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
 * Returns a function "searchNow" that, when called, trigger the search
 * with the current querry and cancel the schedulled search.
 * 
 * equivalent in RxJS: https://youtu.be/Urv82SGIu_0?t=1103
 */
export function useSearch(
  params: { 
    delay: number;
    evtQuery: StatefulReadonlyEvt<string>, 
    search(text: string): void;
  }
): { searchNow(): void; } {

  const { delay, evtQuery, search } = params;

  useEvt(
    ctx=>{

      const evtTextDebounced = Evt.create(evtQuery.state);

      let timer: number;

      evtQuery
        .pipe(ctx, text => text.length > 2)
        .attach(async text=>{

          clearTimeout(timer);

          await new Promise(resolve=> timer = setTimeout(resolve, delay));
          
          evtTextDebounced.state = text;

        });

      evtTextDebounced.evtChange.attach(ctx, search);

      ctx.evtDoneOrAborted.attachOnce(()=> clearTimeout(timer));

    },
    [evtQuery, search]
  );


  return { 
    "searchNow": ()=> {
      clearTimeout(timer);
      search(evtQuery.state);
    }
  };


}