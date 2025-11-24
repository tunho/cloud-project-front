import { io } from "socket.io-client";
import { reactive, ref } from "vue";

// 환경 변수에서 백엔드 URL 가져오기 (배포 환경 대응)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"], // polling을 fallback으로 추가
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
