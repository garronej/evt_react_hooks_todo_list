import React from "react";
import * as reactDom from "react-dom";
import "./style.scss";

import { getMockStore } from "./store";
import { useAsync } from "react-async-hook";
import { Spinner } from "./Spinner";
import { App } from "./App";

/*
NOTE: Be mindfull that Stackblitz does not use TypeScript in strict mode. 
A lot of token that would be 'T | undefined' in VSCode are 'T' here.
*/
const Switcher: React.FunctionComponent<{}> = ()=> {

  const asyncGetMockStore = useAsync(getMockStore,[]);

  return asyncGetMockStore.result === undefined ?
    <h1><Spinner /> Fetching your todo items...</h1> :
    <App store={asyncGetMockStore.result} />;

};


reactDom.render(
  //<React.StrictMode>
    <Switcher />,
  //</React.StrictMode>, 
  document.getElementById("root")
);