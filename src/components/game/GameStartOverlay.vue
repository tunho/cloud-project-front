<template>
  <div class="game-start-overlay">
    <div class="content">
      <div class="icon">🃟</div>
      <h1 class="title">게임 시작</h1>
      <p class="subtitle">준비 되셨나요?</p>
      <div class="loading-bar">
        <div class="bar-fill"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props needed for now, just a visual overlay
</script>

<style scoped>
.game-start-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 20, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.5s ease-out;
}

.content {
  text-align: center;
  color: white;
  animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 1s infinite;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: 4px;
  background: linear-gradient(to right, #fff, #4285f4, #fff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 2s linear infinite;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  margin-bottom: 2rem;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin: 0 auto;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  height: 100%;
  background: #4285f4;
  transform-origin: left;
  animation: load 1.5s ease-in-out infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shine {
  to { background-position: 200% center; }
}

@keyframes load {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(0.7); }
  100% { transform: scaleX(1); transform-origin: right; }
}
</style>
