import { concat, isEmpty, uniq } from "lodash";
import { useEffect, useState } from "react";
import { Alert, Badge, Card, Col, Container, Row } from "react-bootstrap";
import "./App.css";
import {
  ErrorResponse,
  MessageRequest,
  MessageResponse,
  Tile,
  TileResponse,
  Tiles,
  WordResponse,
} from "./types";

function App() {
  const [tabId, setTabId] = useState<number>();
  const [tiles, setTiles] = useState<Tiles>();
  const [include, setInclude] = useState<string>();
  const [exclude, setExclude] = useState<string>();
  const [match, setMatch] = useState<string>();
  const [notMatch, setNotMatch] = useState<string>();
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  const getTiles = (tabId: number) => {
    console.log("getTiles:", tabId);

    chrome.tabs &&
      chrome.tabs
        .sendMessage<MessageRequest, MessageResponse>(tabId, {
          type: "GET_TILES",
        })
        .then((response) => {
          console.log("GET_TILES response:", response);

          const { error } = (response as ErrorResponse) ?? {};
          const { tiles } = (response as TileResponse) ?? {};

          setError(error);
          setTiles(tiles);
        })
        .catch((err: Error) => {
          console.error(err);
          setError(err.message);
        });
  };

  const getWords = (letters?: string) => {
    console.log("getWords:", letters);

    chrome.runtime &&
      chrome.runtime
        .sendMessage<MessageRequest, MessageResponse>({
          type: "GET_WORDS",
          letters: letters ?? "",
        })
        .then((response) => {
          console.log("GET_WORDS response:", response);

          const { error } = (response as ErrorResponse) ?? {};
          const { words } = (response as WordResponse) ?? {};

          setError(error);
          setWords(words);
        })
        .catch((err: Error) => {
          console.error(err);
          setError(err.message);
        });
  };

  useEffect(() => {
    chrome.tabs &&
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          const tab = tabs.pop();
          tab && setTabId(tab.id);
        })
        .catch((err: Error) => {
          console.error(err);
          setError(err.message);
        });
  }, []);

  useEffect(() => {
    console.log("tabId:", tabId);
    tabId && getTiles(tabId);
  }, [tabId]);

  const getUniqLetters = (tiles?: Tile[]): string[] => {
    return uniq(tiles && tiles.map((tile) => tile.letter)) ?? [];
  };

  const getLetters = (tiles?: Tile[]): string[] => {
    const letters: string[] = [];

    for (let x: number = 0; x < 5; x++) {
      const letter = (tiles ?? [])
        .filter((tile) => tile?.position === x)
        .map((tile) => tile.letter)
        .join("");

      letters[x] = isEmpty(letter) ? "." : letter;
    }

    return letters;
  };

  const notPattern = (letters: string) => RegExp(`^[^${letters}]{5}$`, "gim");
  const pattern = (letters: string) => RegExp(`^${letters}$`, "gim");

  useEffect(() => {
    const { correct, present, absent } = tiles ?? {};

    const letters = getUniqLetters(concat(correct ?? [], present ?? []))
      .sort((a, b) => a.localeCompare(b))
      .join("");

    setInclude(letters);

    setExclude(
      getUniqLetters(absent)
        .filter((c) => !letters.includes(c))
        .join("")
    );

    setMatch(
      getLetters(correct)
        .map((l) => (l === "." ? "." : `[${l}]`))
        .join("")
    );

    setNotMatch(
      getLetters(present)
        .map((l) => (l === "." ? "." : `[^${l}]`))
        .join("")
    );
  }, [tiles]);

  useEffect(() => {
    include && getWords(include);
  }, [include]);

  return (
    <Container fluid className="m-0 p-2">
      {error && <Alert variant="danger">{JSON.stringify(error)}</Alert>}
      <Card bg="dark" text="light" className="mb-auto">
        <Card.Header>
          <h2>Wordle Helper</h2>
        </Card.Header>
        <Card.Body>
          <Container fluid>
            {[
              { k: "Include", v: include },
              { k: "Exclude", v: exclude },
              { k: "Match", v: match },
              { k: "!Match", v: notMatch },
            ].map(({ k, v }) => (
              <Row key={k}>
                <Col xs>{k}</Col>
                <Col xs="auto" className="text-nowrap">
                  <code>{v}</code>
                </Col>
              </Row>
            ))}
            <Row className="mt-2">
              <Col xs>
                {isEmpty(words) && !isEmpty(include) && (
                  <Alert variant="dark">Fetching Suggestions...</Alert>
                )}
                {words
                  .filter(
                    (word) =>
                      isEmpty(exclude) ||
                      (exclude && word.match(notPattern(exclude)))
                  )
                  .filter(
                    (word) =>
                      isEmpty(match) || (match && word.match(pattern(match)))
                  )
                  .filter(
                    (word) =>
                      isEmpty(notMatch) ||
                      (notMatch && word.match(pattern(notMatch)))
                  )
                  .map((word) => (
                    <Badge pill className="m-1">
                      {word}
                    </Badge>
                  ))}
              </Col>
            </Row>
          </Container>
        </Card.Body>
        <Card.Footer></Card.Footer>
      </Card>
    </Container>
  );
}

export default App;
