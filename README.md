# ext-comm

A tiny lib for typed comms between background, content-scripts and popup pages of chrome extensions.

## Installation

```bash
npm install ext-comm
yarn add ext-comm
pnpm add ext-comm
bun install ext-comm
```

## Usage

Basic example

In a common file, e.g. `comm.ts`, define the schema of the communication, use params and return types function as query and response types.


You have to define a `content`, `background` and `popup` schema. If you are not using one of the pages, you can use `_noop` as a placeholder.

```ts
// comm.ts
import { createComm, CommSchema } from 'ext-comm';

type RecordingStatus = "recording" | "paused" | "stopped";
type RecorderEvent = {
  _dummy: string;
};
type Session = {
  _dummy: string;
};
type JSONSerializedRenderNode = {
  _dummy: string;
};

type Schema = CommSchema<{
  content: {
    startRecording: () => void;
    stopRecording: () => void;
  };
  background: {
    log: (level: "debug" | "warn" | "error", jsonString: string) => void;
    getRecordingState: () => {
      isRecording: boolean;
      status: RecordingStatus;
    };
    setRecordingState: (isRecording: boolean) => Promise<void>;
    addEvent: (
      event: RecorderEvent,
      dom: JSONSerializedRenderNode | null
    ) => void;
    getSession: () => Session | null;
  };
  popup: {
    _noop: () => void;
  };
}>

export const extComm = createComm<Schema>();
```


### Handlers

You have to setup handlers/resolves for each type of message you want to handle. You can use `onMsg`, `onMsgs` and `onMsgCallback` to setup handlers.

You need to setup `background`, `content` and `popup` handlers in the respective pages.

```ts
// background.ts

import { extComm } from './comm';

// handle single type
extComm.onMsg("background", "getSession", () => {

    return {} as Session
});

// handle multiple types
extComm.onMsgs(
  "background",
  ["getRecordingState", "setRecordingState"],
  (msg, type) => {
    switch (type) {
      case "getRecordingState":
        return {
          isRecording: false,
          status: "stopped",
        };
      case "setRecordingState":
        return Promise.resolve();
    }
  }
);

// handle promise returns
extComm.onMsgCallback("background", "getRecordingState", (_msg, cb) => {
  cb({
    isRecording: true,
    status: "recording",
  });

  return true;
});
```

### Sending messages

You can use `sendMsg`, `sendMsgs` and `sendMsgCallback` to send messages.

```ts
// content.ts

import { extComm } from './comm';

// send msg to `background` from `content`
const session = await extComm.sendMsg("background", "getSession", []);
```
****
```ts
// popup.ts

import { extComm } from './comm';

// send msg to `content`
await extComm.sendMsgToActiveTab("startRecording", [])
```