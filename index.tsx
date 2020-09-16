import React, { Component, useReducer, useState, useCallback, useMemo, useEffect } from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { ItemLi, Props as ItemLiProps } from "./ItemLi";
import { Item, getMockApi, Api } from "./logic";
import { useEvt, useStatefulEvt } from "evt/hooks";
import { Evt } from "evt";
import { useAsync } from "react-async-hook";
import { Spinner } from "./Spinner";
import { App } from "./App";

/*


NOTE: Be mindfull that Stackblitz does not use TypeScript in strict mode. 
A lot of token that would be 'T | undefined' in VSCode are 'T' here.
*/
const Switcher: React.FunctionComponent<{}> = ()=> {

  const asyncGetMockApi = useAsync(getMockApi,[]);

  return asyncGetMockApi.result === undefined ?
    <h1><Spinner /> Fetching your todo items...</h1> :
    <App api={asyncGetMockApi.result} />;

};


reactDom.render(
  <React.StrictMode>
    <Switcher />,
  </React.StrictMode>, 
  document.getElementById("root")
);