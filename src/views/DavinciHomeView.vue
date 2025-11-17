<template>
  <div class="home-container">
    <h1>JBNU Game Platform</h1>

    <button class="btn auto-btn" @click="autoMatch">
      🚀 자동 매치
    </button>

    <button class="btn custom-btn" @click="goCustomMatch">
      🎮 커스텀 매치
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { io } from "socket.io-client";

const router = useRouter();

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

// 자동 매치: 그냥 랜덤 방 하나로 보내기
async function autoMatch() {
  router.push("/matching");  
}

// 커스텀 매치 페이지로 이동
function goCustomMatch() {
  router.push("/custom-match");
}

socket.on("match:success", (data) => {
  // data = { roomId, opponent }
  router.push(`/room/${data.roomId}`);
});


</script>

<style scoped>
.home-container {
  max-width: 400px;
  margin: 120px auto;
  text-align: center;
}

.btn {
  width: 220px;
  padding: 14px;
  font-size: 18px;
  margin: 16px 0;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.auto-btn {
  background: #4caf50;
  color: white;
}

.custom-btn {
  background: #2196f3;
  color: white;
}
</style>
