export type MessageType = "GET_TILES" | "GET_WORDS";

export const WordleUrl = "https://www.nytimes.com/games/wordle";

export type Tile = {
  letter: string;
  position: number;
  state?: string;
};

export type Row = Tile[];

export type Tiles = {
  correct?: Tile[];
  present?: Tile[];
  absent?: Tile[];
  [state: string | symbol]: Tile[] | undefined;
};

export type Words = string[];

export type WordRequest = {
  type: "GET_WORDS";
  letters: string;
};

export type TileRequest = {
  type: "GET_TILES";
};

export type TileResponse = {
  tiles: Tiles;
};

export type WordResponse = {
  words: Words;
};

export type ErrorResponse = {
  error: string;
};

export type MessageRequest = WordRequest | TileRequest;
export type MessageResponse = WordResponse | TileResponse | ErrorResponse;
