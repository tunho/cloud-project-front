import { io } from "socket.io-client";
import { reactive, ref } from "vue";

export const socket = io("http://localhost:5000", {
  autoConnect: true,
  transports: ["websocket"],
});

// 🔥 [NEW] 게임 진입 가드 (새로고침 시 false로 초기화됨)
export const gameEntryGuard = {
  allowed: false
};

export const serverState = reactive<any>({
  players: [],
  piles: { black: 0, white: 0 },
  currentTurn: 0,
  drawnTile: null,
  pendingPlacement: false,
});

export const mySid = ref("");

socket.on("connect", () => {
  mySid.value = socket.id!;
});

socket.on("state_update", (state) => {
  Object.assign(serverState, state);
});
