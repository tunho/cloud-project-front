<template>
  <div class="lobby-wrapper">
    <div class="lobby-card">
      <div class="header-area">
        <div class="game-icon">🧩</div>
        <h1>Davinci Code</h1>
        <p class="subtitle">숫자 추리 심리전의 정수</p>
      </div>

      <div class="action-area">
        <button class="action-btn auto-match" @click="autoMatch">
          <div class="btn-content">
            <span class="btn-icon">🚀</span>
            <div class="text-group">
              <span class="btn-title">빠른 시작</span>
              <span class="btn-desc">자동으로 상대를 찾습니다</span>
            </div>
          </div>
          <div class="btn-glow"></div>
        </button>

        <button class="action-btn custom-match" @click="goCustomMatch">
          <div class="btn-content">
            <span class="btn-icon">🎮</span>
            <div class="text-group">
              <span class="btn-title">커스텀 매치</span>
              <span class="btn-desc">방을 만들거나 친구와 대결</span>
            </div>
          </div>
        </button>
      </div>
    </div>
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
.lobby-wrapper {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: white;
}

.lobby-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 4rem 3rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  text-align: center;
  animation: zoomIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.header-area {
  margin-bottom: 3rem;
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.header-area h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #fff, #ccc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
}

.subtitle {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-btn {
  position: relative;
  width: 100%;
  padding: 1.5rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-align: left;
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-icon {
  font-size: 2.5rem;
}

.text-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.btn-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: white;
}

.btn-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Auto Match Button Styles */
.auto-match {
  background: linear-gradient(135deg, #4285f4, #34a853);
  box-shadow: 0 10px 20px rgba(66, 133, 244, 0.3);
}

.auto-match:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(66, 133, 244, 0.5);
}

.auto-match .btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.5s ease;
}

.auto-match:hover .btn-glow {
  opacity: 1;
  transform: scale(1);
}

/* Custom Match Button Styles */
.custom-match {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-match:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}
</style>
