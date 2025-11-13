// src/socket.ts
import { io } from "socket.io-client";
import { ref } from "vue";

// 서버 주소
export const socket = io("http://localhost:5000");

// 서버에서 주는 전체 게임 상태
export const serverState = ref<any>(null);

// 서버에서 받은 추리 결과 등
export const serverResult = ref<any>(null);

socket.on("connect", () => {
  console.log("🟢 Connected to server:", socket.id);
});

// 실시간 게임 상태 업데이트
socket.on("state_update", (state) => {
  console.log("📡 state_update", state);
  serverState.value = state;
});

// 추리 결과 등 서버에서 보내는 단발성 이벤트
socket.on("guess_result", (result) => {
  console.log("🎯 guess_result", result);
  serverResult.value = result;
});
