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
  sid: string;
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
  // 조커 처리
  if (a.isJoker && b.isJoker) return a.id - b.id;
  if (a.isJoker) return 1;
  if (b.isJoker) return -1;

  // 숫자 비교
  if (a.value !== b.value) {
    return (a.value as number) - (b.value as number);
  }

  // 동일 숫자일 때 색 순서 비교
  if (a.color !== b.color) {
    if (sameNumberOrder === "black-first") {
      return a.color === "black" ? -1 : 1;
    } else {
      return a.color === "white" ? -1 : 1;
    }
  }

  // 숫자도 같고 색도 같으면 동일
  return 0;
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
        sid :"a",
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

    drawCard(color: Color) {
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
  // 조커를 자동으로 정렬할 일은 없다 → 그냥 맨 뒤
  if (tile.isJoker) {
    return hand.length;
  }

  // 조커는 건너뛰고, 숫자 카드들만 기준으로 정렬 위치 계산
  for (let i = 0; i < hand.length; i++) {
    const h = hand[i];

    // 조커는 고정: 비교 대상에서 제외
    if (h!.isJoker) continue;

    // 내가 더 작다면, 여기 앞에 끼워 넣는다
    if (compareTiles(tile, h!, this.sameNumberOrder) < 0) {
      return i;
    }
  }

  // 모든 숫자 카드보다 크면 → 맨 뒤에
  return hand.length;
}
,

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
      this.pendingPlacement = false;
      this.drawnTile = null;
      this.canPlaceAnywhere = false;

      // 원래 nextTurn 로직
      this.currentTurn = (this.currentTurn + 1) % this.players.length;
    },

    // 카드 예측
    guessTile(
      targetPlayerId: number,
      index: number,
      value: number | string | null
    ) {
      const me = this.currentPlayer;
      const target = this.players.find((p) => p.id === targetPlayerId);

      if (!me || !target) {
        return { ok: false, reason: "invalid-player" };
      }

      const tile = target.hand[index];

      if (!tile) {
        return { ok: false, reason: "invalid-index" };
      }


      const correct = tile.value === value;

if (correct) {
  tile.revealed = true;
} else {
  // ❗ 오답일 때만 내 숨겨진 카드 공개
  this.myHiddenOpen();
}

if (this.isPlayerEliminated(target)) {
  this.handlePlayerElimination(target.id);
}

if (this.isPlayerEliminated(me)) {
  this.handlePlayerElimination(me.id);
}

this.nextTurn();

return { ok: true, correct };
},

// 틀렸을 때 내 카드 공개
      myHiddenOpen() {
        const me = this.currentPlayer;
        if (!me) return;

        // 아직 공개되지 않은(hidden) 카드들
        const hidden = me.hand.filter(t => !t.revealed);

        // 숨겨진 카드가 없다면 아무 것도 할 수 없음
        if (!hidden.length) return;

        // 규칙 1: 가장 앞(hidden[0])을 공개
        const tile = hidden[Math.floor(Math.random() * hidden.length)];
        tile!.revealed = true;
      },

      //탈락 여부 확인
    isPlayerEliminated(player: Player): boolean {
      return player.hand.every(t => t.revealed);
    },
    
    // 탈락 시키기
  handlePlayerElimination(playerId: number) {
  // 예: 플레이어 제거
  this.players = this.players.filter(p => p.id !== playerId);

  // 현재 턴이 사라진 플레이어면 턴 조정
  if (this.currentTurn >= this.players.length) {
    this.currentTurn = 0;
  }

  // 플레이어 수 줄이기
  this.numPlayers = this.players.length;

  // 게임 종료 판정도 가능:
  if (this.players.length === 1) {
    alert(`Game Over! Winner is ${this.players[0]!.name}`);
  }
},


placeJokerTile(playerId: number, index: number) {
  const player = this.players.find(p => p.id === playerId);
  if (!player || !this.drawnTile) return;

  // 조커 INSERT
  player.hand.splice(index, 0, this.drawnTile);

  this.drawnTile = null; // 조커 소비됨
}

    



  },
});
