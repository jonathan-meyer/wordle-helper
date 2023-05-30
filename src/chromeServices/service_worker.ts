import parse from "node-html-parser";
import { MessageRequest, MessageResponse } from "../types";

console.log("src/chromeServices/service_worker.ts");

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log("onInstalled:", reason);

  // Page actions are disabled by default and enabled on select tabs
  chrome.action.disable();

  // Clear all rules to ensure only our expected rules are set
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    // Declare a rule to enable the action on example.com pages
    let isWordleRule = {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostSuffix: "nytimes.com",
            pathPrefix: "/games/wordle",
          },
        }),
      ],
      actions: [new chrome.declarativeContent.ShowAction()],
    };

    // Finally, apply our new array of rules
    let rules = [isWordleRule];
    chrome.declarativeContent.onPageChanged.addRules(rules);
  });
});

chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    console.log("onMessage:", request);

    switch (request.type) {
      case "GET_WORDS":
        getWords(request.letters)
          .then((words) => {
            console.log("word count:", words.length);
            sendResponse({ words: words });
          })
          .catch((err: Error) => {
            console.log(err);
            sendResponse({ error: err.message });
          });
        break;
    }

    return true;
  }
);

const getWords = async (letters: string) => {
  const key = `words-${letters}`;

  console.log("key:", key);

  let words: string[] = await chrome.storage.local
    .get([key])
    .then((result) => result[key]);

  if (!words) {
    console.log("Fetching Words");

    words = await fetch("https://www.anagrammer.com/scrabble/", {
      method: "POST",
      body: toFormData({
        letters: letters.padEnd(5, "?"),
        sort: "length",
        "wordLengths[5]": "on",
        resultLimit: 1000000,
      }),
    })
      .then((res) => res.text())
      .then((text) => parse(text))
      .then((html) =>
        html
          .querySelectorAll(".r a")
          .map((word) => word.text)
          .sort((a, b) => a.localeCompare(b))
      );

    await chrome.storage.local.set({ [key]: words });
  }

  return words;
};

const toFormData = (data: Record<string, string | number>): FormData => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, `${value}`);
  });

  return formData;
};

export {};
