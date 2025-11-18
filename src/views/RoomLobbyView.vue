<template>
  <div class="lobby-container">
    <h1>방 대기실</h1>

    <div class="room-info">
      <strong>Room ID:</strong> {{ roomId }}
    </div>

    <h2>참가자 목록</h2>
    <ul class="player-list">
      <li v-for="p in serverState.players" :key="p.sid">
        {{ p.name }} <span v-if="p.sid === hostSid">(방장)</span>
      </li>
    </ul>

    <div class="actions">
      <button v-if="isHost" @click="startGame">게임 시작하기</button>
      <p v-else class="waiting-text">방장이 게임 시작하기를 기다리는 중…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed, onMounted } from "vue";
import { socket, serverState } from "../socket";

// route 정보
const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId as string;

// 🔥 방장 SID = players[0].sid (서버 기준)
const hostSid = computed(() => serverState.players[0]?.sid);

// 내가 방장인지
const isHost = computed(() => socket.id === hostSid.value);

// 게임 시작
function startGame() {
  socket.emit("start_game", { roomId });
}

// 서버에서 "game_started" 수신 → GameView로 이동
socket.on("game_started", () => {
  router.push(`/room/${roomId}/game`);
});

onMounted(() => {
  console.log("Lobby mounted:", roomId);
});
</script>

<style scoped>
.lobby-container {
  max-width: 480px;
  margin: 40px auto;
  padding: 20px;
  border-radius: 12px;
  background: #fafafa;
  box-shadow: 0 0 12px rgba(0,0,0,0.1);
  text-align: center;
}

.room-info {
  margin-bottom: 20px;
}

.player-list {
  list-style: none;
  padding: 0;
}
.player-list li {
  padding: 6px 0;
  border-bottom: 1px solid #ddd;
}

.actions {
  margin-top: 20px;
}

.waiting-text {
  font-size: 14px;
  color: #666;
}
</style>
