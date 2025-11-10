import { defineStore } from "pinia";

/* ---------- 타입 정의 ---------- */

export type Color = "black" | "white";

export interface Tile {
  id: number;
  color: Color;
  value: number | string | null;
  isJoker: boolean;
  revealed: boolean;
}

export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  lastDrawnIndex: number | null;
}

export type SameNumberOrder = "black-first" | "white-first";

/* ---------- 유틸 함수 ---------- */

function shuffle<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5);
}

let _tid = 0;
function makeTile({
  color,
  value,
  isJoker,
}: {
  color: Color;
  value: number | string | null;
  isJoker: boolean;
}): Tile {
  return {
    id: _tid++,
    color,
    value,
    isJoker,
    revealed: false,
  };
}

function makeTilesByColor(color: Color): Tile[] {
  const arr: Tile[] = [];
  for (let v = 0; v <= 11; v++)
    arr.push(makeTile({ color, value: v, isJoker: false }));
  arr.push(makeTile({ color, value: null, isJoker: true })); // 조커
  return shuffle(arr);
}

function compareTiles(
  a: Tile,
  b: Tile,
  sameNumberOrder: SameNumberOrder = "black-first"
): number {
  if (a.isJoker && b.isJoker) return 0;
  if (a.isJoker) return 1;
  if (b.isJoker) return -1;

  if (a.value !== b.value) return (a.value as number) - (b.value as number);

  if (sameNumberOrder === "black-first") {
    return a.color === "black" ? -1 : 1;
  } else {
    return a.color === "white" ? -1 : 1;
  }
}

/* ---------- Pinia Store ---------- */

export const useGameStore = defineStore("game", {
  state: () => ({
    numPlayers: 4,
    players: [] as Player[],
    piles: { black: [] as Tile[], white: [] as Tile[] },
    sameNumberOrder: "black-first" as SameNumberOrder,

    currentTurn: 0,
    drawnTile: null as Tile | null,
    pendingPlacement: false,
    canPlaceAnywhere: false,
  }),

  getters: {
    currentPlayer(state): Player | null {
      return state.players[state.currentTurn] ?? null;
    },
  },

  actions: {
    prepareTiles() {
      _tid = 0;
      this.piles.black = makeTilesByColor("black");
      this.piles.white = makeTilesByColor("white");
    },

    createPlayers(n = 4) {
      const num = Math.min(4, Math.max(2, n));
      this.numPlayers = num;
      this.players = Array.from({ length: num }, (_, i): Player => ({
        id: i,
        name: `Player ${i + 1}`,
        hand: [],
        lastDrawnIndex: null,
      }));
    },

    dealInitialHands() {
      const initialCount = this.numPlayers === 4 ? 3 : 4;
      const jokerBuf: Record<Color, Tile[]> = { black: [], white: [] };

      for (const p of this.players) {
        p.hand = [];
        while (p.hand.length < initialCount) {
          const first: Color = Math.random() < 0.5 ? "black" : "white";
          const second: Color = first === "black" ? "white" : "black";

          let t = this.piles[first].pop();
          if (!t) t = this.piles[second].pop();
          if (!t) break;

          if (t.isJoker) {
            jokerBuf[t.color].push(t);
            continue;
          }
          p.hand.push(t);
        }
        p.hand.sort((a, b) => compareTiles(a, b, this.sameNumberOrder));
      }

      this.piles.black = shuffle([...this.piles.black, ...jokerBuf.black]);
      this.piles.white = shuffle([...this.piles.white, ...jokerBuf.white]);
    },

    initDealing(n = 4) {
      this.createPlayers(n);
      this.prepareTiles();
      this.dealInitialHands();
      this.currentTurn = 0;
      this.drawnTile = null;
      this.pendingPlacement = false;
      this.canPlaceAnywhere = false;
    },

    startTurnFrom(color: Color) {
      if (!this.players.length) return null;
      if (this.pendingPlacement) return null;

      const pile = this.piles[color];
      if (!pile.length) return null;

      const t = pile.pop()!;
      this.drawnTile = t;
      this.pendingPlacement = true;
      this.canPlaceAnywhere = !!t.isJoker;
      return t;
    },

    autoInsertIndex(hand: Tile[], tile: Tile): number {
      if (tile.isJoker) return hand.length;
      const numericIdx: number[] = [];
      for (let i = 0; i < hand.length; i++) {
        if (!hand[i]?.isJoker) numericIdx.push(i);
      }
      let k = 0;
      while (k < numericIdx.length) {
        const other = hand[numericIdx[k]!];
        if (compareTiles(tile, other!, this.sameNumberOrder) < 0) break;
        k++;
      }
      if (numericIdx.length === 0) return 0;
      if (k === numericIdx.length) return numericIdx[numericIdx.length - 1] ?? + 1;
      return numericIdx[k] ?? 0;
    },

    autoPlaceDrawnTile() {
      const p = this.currentPlayer;
      const t = this.drawnTile;
      if (!p || !t) return;
      if (t.isJoker) return;

      const idx = this.autoInsertIndex(p.hand, t);
      p.hand.splice(idx, 0, t);
      p.lastDrawnIndex = idx;

      this.drawnTile = null;
      this.pendingPlacement = false;
      this.canPlaceAnywhere = false;
    },

    placeDrawnTileAt(index: number) {
      const p = this.currentPlayer;
      const t = this.drawnTile;
      if (!p || !t) return;

      const i = Math.max(0, Math.min(index, p.hand.length));
      p.hand.splice(i, 0, t);
      p.lastDrawnIndex = i;

      this.drawnTile = null;
      this.pendingPlacement = false;
      this.canPlaceAnywhere = false;
    },

    nextTurn() {
      if (this.pendingPlacement) return;
      this.currentTurn = (this.currentTurn + 1) % this.numPlayers;
    },
  },
});
