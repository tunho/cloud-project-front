<template>
  <div class="platform-wrapper">
    <UserProfile />
    <header class="platform-header">
      <div class="logo">
        <span class="icon">♟️</span>
        <h1>JBNU GAME</h1>
      </div>
    </header>

    <main class="content-area">
      <div class="hero-section">
        <h2>Game Platform</h2>
        <p class="subtitle">전북대학교 학생들을 위한 프리미엄 보드게임 라운지</p>
      </div>

      <div class="game-grid">
        <div class="game-card active" @click="goDavinci">
          <div class="card-content">
            


            <div class="game-icon">🧩</div>
            <h3>Davinci Code</h3>
            <p class="desc">상대방의 코드를 추리하는<br>고도의 심리 전략 게임</p>
            <button class="play-btn">PLAY NOW</button>
          </div>
          <div class="card-bg-glow"></div>
        </div>

        <div class="game-card disabled">
          <div class="card-content">
            <div class="game-icon">🔒</div>
            <h3>Coming Soon</h3>
            <p class="desc">새로운 게임이<br>준비 중입니다</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import UserProfile from "../components/UserProfile.vue";

const router = useRouter();

function goDavinci() {
  router.push("/davinci-home");
}
</script>

<style>
body, html {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
  background-color: #0f0c29; /* 로딩 시 흰 배경 방지 */
}
</style>

<style scoped>
/* Premium Game Theme Styles */

.platform-wrapper {
  /* 화면 꽉 채우기 설정 */
  min-height: 100vh; /* 콘텐츠가 길어지면 늘어나고, 짧아도 전체 화면 유지 */
  width: 100%;       /* 100vw 대신 100%를 써야 스크롤바 문제 방지 */
  
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: white;
  
  /* 내용 정렬 */
  display: flex;
  flex-direction: column;
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky; /* 스크롤 시 헤더 고정 (선택사항) */
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.logo .icon {
  font-size: 1.5rem;
}

.logo h1 {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
  background: linear-gradient(to right, #fff, #aaa);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.content-area {
  flex: 1; /* 남은 공간 모두 차지 */
  padding: 4rem 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box; /* 패딩 포함 크기 계산 */
}

.hero-section {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInDown 0.8s ease-out;
}

.hero-section h2 {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(66, 133, 244, 0.5);
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 320px)); /* 카드 크기 최적화 */
  gap: 2rem;
  width: 100%;
  justify-content: center;
  padding-bottom: 2rem;
}

.game-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 340px; /* 높이 약간 증가 */
  justify-content: center;
}

.game-card.active:hover {
  transform: translateY(-10px) scale(1.02);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(66, 133, 244, 0.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-content {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}

.game-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin: 0;
}

.play-btn {
  margin-top: 1.5rem;
  padding: 0.8rem 2rem;
  background: linear-gradient(45deg, #4285f4, #34a853);
  border: none;
  border-radius: 30px;
  color: white;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.game-card.active:hover .play-btn {
  opacity: 1;
  transform: translateY(0);
}

.game-card.disabled {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(1);
}

.game-card.disabled:hover {
  background: rgba(255, 255, 255, 0.02);
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>