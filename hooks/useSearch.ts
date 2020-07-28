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
 * equivalent in RxJS: https://youtu.be/Urv82SGIu_0?t=1103
 */
export function useSearch(
  params: { 
    delay: number;
    evtQuery: StatefulReadonlyEvt<string>, 
    search(text: string): void;
  }
): void {

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
          
          if( ctx.getHandlers().length === 0 ){
            return;
          }
          
          evtTextDebounced.state = text;

        });

      evtTextDebounced.evtChange.attach(ctx, search);

    },
    [evtQuery, search]
  );


}