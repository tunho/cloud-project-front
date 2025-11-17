<template>
  <div class="platform-container">
    <h1>JBNU Game Platform</h1>
    <p class="sub">전북대학교 전용 멀티 게임 플랫폼</p>

    <div class="game-list">
      <!-- 다빈치 코드 -->
      <div class="game-card" @click="goDavinci">
        <img src="/davinci.png" class="game-thumb" alt="Davinci Code" />
        <h3>다빈치 코드</h3>
        <p>숫자 추리 심리전 게임</p>
      </div>

      <!-- 추후 다른 게임 (비활성화 표시) -->
      <div class="game-card disabled">
        <img src="/lock.png" class="game-thumb" alt="Coming Soon" />
        <h3>Coming Soon...</h3>
        <p>준비 중</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function goDavinci() {
  router.push("/davinci-home");
}
</script>

<style scoped>
.platform-container {
  text-align: center;
  padding: 40px;
}

.sub {
  color: #777;
  margin-bottom: 30px;
}

.game-list {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.game-card {
  width: 200px;
  padding: 20px;
  border-radius: 15px;
  background: #f2f5ff;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: 0.2s ease;
}

.game-card:hover {
  transform: translateY(-5px);
}

.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.game-thumb {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 10px;
}
</style>
