type SchemaShape = {
  content: Record<string, (...args: any[]) => any>;
  background: Record<string, (...args: any[]) => any>;
  popup: Record<string, (...args: any[]) => any>;
};

export type CommSchema<T extends SchemaShape> = {
  content: T["content"];
  background: T["background"];
  popup: T["popup"];
};

export const createComm = <S extends SchemaShape>() => {
  type Schema = CommSchema<S>;

  type CommMsg<T extends "content" | "background" | "popup"> =
    T extends "content"
      ? Schema["content"]
      : T extends "background"
      ? Schema["background"]
      : Schema["popup"];

  const extComm = {
    sendMsg: <
      T extends "content" | "background" | "popup",
      U extends keyof CommMsg<T>
    >(
      type: T,
      msgType: U,
      msg: Parameters<CommMsg<T>[U]>
    ): Promise<ReturnType<CommMsg<T>[U]>> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: msgType, ...msg }, (response) => {
          resolve(response as ReturnType<CommMsg<T>[U]>);
        });
      });
    },
    onMsg: <
      T extends "content" | "background" | "popup",
      U extends keyof CommMsg<T>
    >(
      type: T,
      msgType: U,
      cb: (msg: Parameters<CommMsg<T>[U]>) => ReturnType<CommMsg<T>[U]>
    ) => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === msgType) {
          const response = cb(message);
          sendResponse(response);
        }
      });
    },
    onMsgCallback: <
      T extends "content" | "background" | "popup",
      U extends keyof CommMsg<T>
    >(
      type: T,
      msgType: U,
      cb: (
        msg: Parameters<CommMsg<T>[U]>,
        responseCb: (params: ReturnType<CommMsg<T>[U]>) => void
      ) => boolean
    ) => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === msgType) {
          cb(message, (params) => sendResponse(params));
        }
        return true;
      });
    },
    onMsgs: <
      T extends "content" | "background" | "popup",
      U extends keyof CommMsg<T>
    >(
      type: T,
      msgTypes: U[],
      cb: (msg: Parameters<CommMsg<T>[U]>, type: U) => ReturnType<CommMsg<T>[U]>
    ) => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (msgTypes.includes(message.type as U)) {
          const response = cb(message, message.type);
          sendResponse(response);
        }
      });
    },
    sendMsgToActiveTab: <U extends keyof CommMsg<"content">>(
      msgType: U,
      msg: Parameters<CommMsg<"content">[U]>
    ): Promise<ReturnType<CommMsg<"content">[U]>> => {
      return new Promise((resolve) => {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(
              tabs[0]?.id!,
              { type: msgType, ...msg },
              (response) => {
                resolve(response as ReturnType<CommMsg<"content">[U]>);
              }
            );
          }
        );
      });
    },
  };

  return extComm;
};
