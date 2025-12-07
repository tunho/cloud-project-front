<template>
  <div v-if="isVisible" class="continue-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <div class="icon-wrapper">
          <span class="icon-check">✨</span>
        </div>
        <h3 class="title">정답입니다!</h3>
      </div>
      
      <div class="modal-body">
        <p class="description">
          정답입니다.<br>
          턴을 계속 진행하시겠습니까?
        </p>
        
        <div class="timer-bar-container">
          <div class="timer-bar" :style="{ width: `${(displayTimer / 60) * 100}%` }"></div>
          <span class="timer-text">{{ displayTimer }}s</span>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('pass')">
          <span class="btn-icon">🛑</span>
          턴 종료
        </button>
        <button class="btn-primary" @click="$emit('continue')">
          <span class="btn-icon">⚔️</span>
          계속하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  isVisible: boolean;
  timer: number; // Keep for compatibility but use local for display
}>();

defineEmits(["continue", "pass"]);

const displayTimer = ref(60);
let intervalId: number | null = null;

const startTimer = () => {
  stopTimer();
  displayTimer.value = 60;
  intervalId = window.setInterval(() => {
    if (displayTimer.value > 0) {
      displayTimer.value--;
    } else {
      stopTimer();
    }
  }, 1000);
};

const stopTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    startTimer();
  } else {
    stopTimer();
  }
}, { immediate: true });

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
/* 배경 오버레이: 진한 어두움 + 블러 */
.continue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

/* 모달 카드: 프리미엄 다크 테마 */
.modal-card {
  background: linear-gradient(145deg, #1e293b, #0f172a);
  width: 360px;
  padding: 32px;
  border-radius: 24px;
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 215, 0, 0.1);
}

/* 헤더 영역 */
.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ffd700, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  animation: pulse 2s infinite;
}

.icon-check {
  font-size: 2rem;
}

.title {
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(to right, #fff, #cbd5e1);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* 본문 영역 */
.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.description {
  font-size: 1.1rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.6;
}

/* 타이머 바 */
.timer-bar-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  margin-top: 8px;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #f59e0b);
  transition: width 1s linear;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.timer-text {
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 0.8rem;
  color: #ffd700;
  font-weight: bold;
}

/* 버튼 영역 */
.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

button {
  flex: 1;
  padding: 16px 0;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-icon {
  font-size: 1.2rem;
}

/* 보조 버튼 (턴 종료) */
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: translateY(-2px);
}

/* 메인 버튼 (계속하기) */
.btn-primary {
  background: linear-gradient(135deg, #ffd700, #d97706);
  color: #000;
  box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(217, 119, 6, 0.5);
  filter: brightness(1.1);
}

/* 애니메이션 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
}
</style>