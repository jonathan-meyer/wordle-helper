import { concat, entries, isEmpty, uniq } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import Guess from "./Guess";
import {
  ErrorResponse,
  MessageRequest,
  MessageResponse,
  Tile,
  TileResponse,
  Tiles,
  WordResponse,
} from "./types";

function Helper() {
  const params = useParams();
  const tabId: number = useMemo(() => Number(params.tabId), [params.tabId]);

  const [tiles, setTiles] = useState<Tiles>();
  const [include, setInclude] = useState<string>();
  const [exclude, setExclude] = useState<string>();
  const [match, setMatch] = useState<string>();
  const [notMatch, setNotMatch] = useState<string>();
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [guesses, setGuesses] = useState<string[]>([]);
  const [recommend, setRecommend] = useState<string[]>([]);

  const getTiles = useCallback((tabId: number) => {
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
  }, []);

  const getWords = useCallback((letters?: string) => {
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
  }, []);

  const selectGuess = useCallback((tabId: number, guess: string) => {
    console.log("selectGuess", guess, "for tab", tabId);

    chrome.tabs &&
      chrome.tabs
        .sendMessage<MessageRequest, MessageResponse>(tabId, {
          type: "SELECT_GUESS",
          guess,
        })
        .then((response) => {
          console.log("SELECT_GUESS response:", response);
          window.close();
        })
        .catch((err: Error) => {
          console.error(err);
          setError(err.message);
        });
  }, []);

  useEffect(() => {
    tabId && getTiles(tabId);
  }, [getTiles, tabId]);

  const getUniqLetters = useCallback((tiles?: Tile[]): string[] => {
    return uniq(tiles && tiles.map((tile) => tile.letter)) ?? [];
  }, []);

  const getLetters = useCallback((tiles?: Tile[]): string[] => {
    const letters: string[] = [];

    for (let x: number = 0; x < 5; x++) {
      const letter = uniq(
        (tiles ?? [])
          .filter((tile) => tile?.position === x)
          .map((tile) => tile.letter)
      ).join("");

      letters[x] = isEmpty(letter) ? "." : letter;
    }

    return letters;
  }, []);

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

    getWords(letters);
  }, [getLetters, getUniqLetters, getWords, tiles]);

  useEffect(() => {
    setGuesses(
      words
        .filter(
          (word) =>
            isEmpty(exclude) || (exclude && word.match(notPattern(exclude)))
        )
        .filter(
          (word) => isEmpty(match) || (match && word.match(pattern(match)))
        )
        .filter(
          (word) =>
            isEmpty(notMatch) || (notMatch && word.match(pattern(notMatch)))
        )
        .sort()
    );
  }, [exclude, match, notMatch, words]);

  type PositionCount = [number, number, number, number, number];
  type LetterCount = Record<string, PositionCount>;

  const countLettersInWord = useCallback(
    (word: string): LetterCount =>
      word.split("").reduce((p, c, i) => {
        const pos: PositionCount = p[c] ?? [0, 0, 0, 0, 0];
        pos[i] = pos[i] + 1;
        return { ...p, [c]: pos };
      }, {} as LetterCount),
    []
  );

  useEffect(() => {
    const letters: LetterCount = guesses.reduce((p, word) => {
      entries(countLettersInWord(word)).forEach(([l, pos]) => {
        const lc = p[l] ?? [0, 0, 0, 0, 0];
        pos.forEach((pc, i) => (lc[i] += pc));
        p[l] = lc;
      });

      return p;
    }, {} as LetterCount);

    const his = Object.entries(letters).sort(([k1, v1], [k2, v2]) =>
      k1.localeCompare(k2)
    );

    console.log(
      "his:",
      his.map(([l, ns]) => `${l} ${JSON.stringify(ns)}`)
    );

    // setRecommend([guesses[0]]);
  }, [countLettersInWord, guesses]);

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
              { k: "Count", v: guesses.length },
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

                {recommend.map((word, i) => (<>
                  {i === 0 && <hr />}
                  <Guess
                    word={word}
                    onClick={() => tabId && selectGuess(tabId, word)}
                    className="m-1"
                  /></>
                ))}
                <hr />
                {guesses.map((word) => (
                  <Guess
                    word={word}
                    onClick={() => tabId && selectGuess(tabId, word)}
                    className="m-1"
                  />
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

export default Helper;
