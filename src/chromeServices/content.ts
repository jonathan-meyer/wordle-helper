import { MessageRequest, MessageResponse, Tiles } from "../types";

console.log("src/chromeServices/content.ts");

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

      case "SELECT_GUESS":
        const letters = [
          ...Array(5).fill("Backspace", 0),
          ...request.guess.split(""),
        ];

        sendResponse({
          letters: letters.map((letter) =>
            window.dispatchEvent(new KeyboardEvent("keydown", { key: letter }))
              ? "yes"
              : "no"
          ),
        });

        console.log("letters:", letters);
        break;
    }
  }
);

export {};
