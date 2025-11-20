<template>
  <div v-if="isVisible" class="animation-overlay">
    <div class="key-container" :style="positionStyle">
      
      <!-- 🔥 [추가] 추리한 숫자 표시 -->
      <!-- 🔥 [추가] 추리한 숫자 표시 -->
      <div class="guessed-value-bubble" :class="[animationClass, { 'bubble-bottom': isNearTop }]">
        {{ guessedValue === 12 ? '★' : guessedValue }}?
      </div>

      <div class="key-icon" :class="animationClass">
        🗝️
      </div>

      <div v-if="showResultIcon" class="result-icon" :class="resultClass">
        {{ isCorrect ? '🔓' : '🔒' }}
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps<{
  isVisible: boolean;
  targetRect: { top: number; left: number; width: number; height: number } | null;
  isCorrect: boolean;
  guessedValue: number | string | null; // 🔥 [추가]
}>();

const emit = defineEmits(["animation-complete"]);

const animationStep = ref<"entering" | "turning" | "result">("entering");
const showResultIcon = ref(false);

// 위치 스타일 계산
const positionStyle = computed(() => {
  if (!props.targetRect) return {};
  // 타겟 카드의 정중앙에 위치하도록 계산
  return {
    top: `${props.targetRect.top + props.targetRect.height / 2}px`,
    left: `${props.targetRect.left + props.targetRect.width / 2}px`,
  };
});

const isNearTop = computed(() => {
  if (!props.targetRect) return false;
  return props.targetRect.top < 100; // 화면 상단 100px 이내면 아래로 표시
});

// 애니메이션 클래스 관리
const animationClass = computed(() => {
  if (animationStep.value === "entering") return "slide-in";
  if (animationStep.value === "turning") return "rotate-key";
  return props.isCorrect ? "unlock-success" : "lock-fail";
});

const resultClass = computed(() => (props.isCorrect ? "fade-in-success" : "shake-fail"));

// 애니메이션 시퀀스 실행
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    runAnimationSequence();
  } else {
    // 초기화
    animationStep.value = "entering";
    showResultIcon.value = false;
  }
});

function runAnimationSequence() {
  // 1. 열쇠 등장 (0.5초)
  animationStep.value = "entering";
  
  setTimeout(() => {
    // 2. 열쇠 돌리기 (1초)
    animationStep.value = "turning";
    
    setTimeout(() => {
      // 3. 결과 보여주기 (1.5초)
      animationStep.value = "result";
      showResultIcon.value = true;

      setTimeout(() => {
        // 4. 완료 이벤트 전송
        emit("animation-complete");
      }, 1500);
      
    }, 1000);
    
  }, 500);
}
</script>

<style scoped>
.animation-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  pointer-events: none; z-index: 9999; /* 최상위 */
  background: rgba(0, 0, 0, 0.3); /* 배경 살짝 어둡게 */
}

.key-container {
  position: absolute;
  transform: translate(-50%, -50%); /* 중앙 정렬 */
  display: flex; justify-content: center; align-items: center;
}

.key-icon { font-size: 4rem; transition: all 0.3s ease; }
.result-icon { position: absolute; font-size: 3rem; font-weight: bold; }

/* 🔥 [추가] 추리 숫자 말풍선 스타일 */
.guessed-value-bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  white-space: nowrap;
  /* 기본 위치 (위쪽) */
  top: -60px;
}
.guessed-value-bubble.bubble-bottom {
  top: auto;
  bottom: -60px;
}

.guessed-value-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px 8px 0;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.9) transparent transparent transparent;
}
.guessed-value-bubble.bubble-bottom::after {
  top: -8px;
  bottom: auto;
  border-width: 0 8px 8px;
  border-color: transparent transparent rgba(255, 255, 255, 0.9) transparent;
}

/* 애니메이션 키프레임 */
.slide-in { animation: slideDown 0.5s ease-out forwards; opacity: 0; }
@keyframes slideDown {
  from { transform: translateY(-50px) scale(0.5); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.rotate-key { animation: turnKey 1s ease-in-out infinite; }
@keyframes turnKey {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
  100% { transform: rotate(0deg); }
}

.unlock-success { animation: popOut 0.5s ease forwards; opacity: 0; }
@keyframes popOut {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; } /* 열쇠가 커지면서 사라짐 */
}

.lock-fail { color: red; }

.fade-in-success { color: #4caf50; animation: fadeIn 0.5s forwards; }
.shake-fail { color: #f44336; animation: shake 0.5s forwards; }

@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}
</style>