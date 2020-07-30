# A TODO list with EVT and React Hooks.

[App live](https://evt-react-hooks-todo-list.stackblitz.io/)

[Edit on StackBlitz ⚡️](https://stackblitz.com/edit/react-ts-a81jg9)

The goal of this example is to demonstrate how to levrage 
the powerfull EVT API to build well optimized UI that can 
be synchronized in realtime between multiple user devices.

The buisness logic: ``/logic.ts`` is isolated from the UI logic.
The mock implementation of the logic API simulate network delays
to give the chance to the UI to show user feedback when a request
is ongoing.
