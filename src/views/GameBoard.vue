<template>
  <div style="padding:16px;">
    <h1>다빈치 코드 (실시간)</h1>

    <button @click="joinGame">Join Game</button>
    <button @click="startGame">Start Game</button>

    <br /><br />

    <button @click="drawBlack">Draw Black</button>
    <button @click="drawWhite">Draw White</button>
    <button @click="nextTurn">Next Turn</button>

    <pre>{{ serverState }}</pre>
  </div>
</template>

<script setup lang="ts">
import { socket, serverState } from "../socket";
import { ref } from "vue";

const name = ref("");

// 참여
function joinGame() {
  const n = prompt("닉네임 입력") || "익명";
  socket.emit("join_game", { name: n });
}

// 게임 시작
function startGame() {
  socket.emit("start_game");
}

// 카드 뽑기
function drawBlack() {
  socket.emit("draw_tile", { color: "black" });
}

function drawWhite() {
  socket.emit("draw_tile", { color: "white" });
}

// 턴 넘기기
function nextTurn() {
  socket.emit("next_turn");
}
</script>
