import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Evt } from "evt";
import * as runExclusive from "run-exclusive";


/** 
 * Returns [ isRequestPending, makeRequestProxy ] 
 * 
 * Take a function that takes some time to complete
 * and return a function that return void instead of Promise<U>
 * alongside a boolean value that is true while there is a request
 * currently beeing performed.
 * 
 * Calls are queued, only one instance of the request can be running
 * simultanously.
 * 
 * This hooks does not handle errors.
 * Makes sure mareRequest never rejects.
 * 
 **/
export function useRequest<T extends any[], U>(
  makeRequest: (...args: T)=> Promise<U>
): [
  boolean,
  (...args: T)=> void,
  [U] | [],
] {

  const [ 
    { isRequestPending, dataWrap }, 
    setIsRequestPendingAndDataWrap
  ]= useState<{ 
    isRequestPending: boolean; 
    dataWrap: [U]|[]; 
  }>({ 
    "isRequestPending": false, 
    "dataWrap": [] 
  });

  const [ args, setArgs ] = useState<T | undefined>(undefined);

  const runExclusiveMakeRequest= useMemo(
    ()=> runExclusive.build(makeRequest),
    [makeRequest]
  );

  useEffect(()=>{

    if( args === undefined ){
      return;
    }

    let ignore =false;

    (async ()=>{

      setIsRequestPendingAndDataWrap({ 
        "isRequestPending": true, 
        "dataWrap": dataWrap 
      });

      const data = await runExclusiveMakeRequest(...args);

      if( ignore ){
        return;
      }

      setIsRequestPendingAndDataWrap({
        "isRequestPending": runExclusive.isRunning(runExclusiveMakeRequest),
        "dataWrap": [data]
      });


    })();

    return ()=> { ignore = true; };


  }, [args]);

  return [
    isRequestPending, 
    useCallback(
      (...args: T)=>{ setArgs(args); }, 
      []
    ),
    dataWrap
  ];

}

/*
export function useRequest<T extends any[]>(
  makeRequest: (...args: T)=> Promise<any>
): [boolean, (...args: T)=> void] {

  const [ isRequestLoading, setIsRequestLoading ]= useState(false);

  const [ args, setArgs ] = useState<T | undefined>(undefined);

  const runExclusiveMakeRequest= useMemo(
    ()=> runExclusive.build(makeRequest),
    [makeRequest]
  );

  useEffect(()=>{

    if( args === undefined ){
      return;
    }

    let ignore =false;

    (async ()=>{

      setIsRequestLoading(true);

      await runExclusiveMakeRequest(...args);

      if( ignore ){
        return;
      }

      setIsRequestLoading(false);

    })();

    return ()=> { ignore = true; };


  }, [args]);

  return [
    isRequestLoading, 
    useCallback(
      (...args: T)=>{ setArgs(args); }, 
      []
    )
  ];

}
*/

