import { MessageRequest, MessageResponse, Tiles } from "../types";

console.log("contents.ts");

chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    console.log("onMessage:", request);

    switch (request.type) {
      case "GET_TILES":
        const data: Tiles = {};

        Array.from(document.querySelectorAll("[role='group']")).forEach((row) =>
          Array.from(row.querySelectorAll("[role='img']")).forEach(
            (tile, position) => {
              const htmlTile = tile as HTMLElement;
              const state = htmlTile.dataset.state ?? "-";
              const letter = htmlTile.innerHTML;

              data[state] = [...(data[state] ?? []), { letter, position }];
            }
          )
        );

        console.log("tiles:", data);
        sendResponse({ tiles: data });
        break;
    }
  }
);

export {};
