<template>
  <div v-if="isVisible" class="flying-card-overlay">
    <div class="flying-card" :class="color" :style="cardStyle">
      <div class="card-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps<{
  isVisible: boolean;
  startRect: { top: number; left: number; width: number; height: number } | null;
  endRect: { top: number; left: number; width: number; height: number } | null;
  color: "black" | "white";
}>();

const emit = defineEmits(["animation-complete"]);

const currentTop = ref(0);
const currentLeft = ref(0);
const currentWidth = ref(0);
const currentHeight = ref(0);
const currentScale = ref(1);
const currentRotation = ref(0);
const isMoving = ref(false);

const cardStyle = computed(() => ({
  top: `${currentTop.value}px`,
  left: `${currentLeft.value}px`,
  width: `${currentWidth.value}px`,
  height: `${currentHeight.value}px`,
  transform: `scale(${currentScale.value}) rotate(${currentRotation.value}deg)`,
  transition: isMoving.value ? "all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)" : "none",
  position: "absolute" as const,
}));

watch(() => props.isVisible, async (newVal) => {
  if (newVal && props.startRect && props.endRect) {
    // 1. 초기 위치 설정
    isMoving.value = false;
    currentTop.value = props.startRect.top;
    currentLeft.value = props.startRect.left;
    currentWidth.value = props.startRect.width;
    currentHeight.value = props.startRect.height;
    currentScale.value = 1;
    currentRotation.value = 0;

    await nextTick();

    // 2. 애니메이션 시작 (약간의 지연 후)
    setTimeout(() => {
      isMoving.value = true;
      if (props.endRect) {
        currentTop.value = props.endRect.top;
        currentLeft.value = props.endRect.left;
        currentWidth.value = props.endRect.width;
        currentHeight.value = props.endRect.height;
        // 약간의 회전 효과 추가
        currentRotation.value = 360; 
      }
    }, 50);

    // 3. 종료 처리
    setTimeout(() => {
      emit("animation-complete");
    }, 700); // transition duration + buffer
  }
});
</script>

<style scoped>
.flying-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.flying-card {
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  transform-origin: center center;
}

.flying-card.black {
  background: linear-gradient(145deg, #2b2b2b, #101010);
  border: 1px solid #444;
}

.flying-card.white {
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border: 2px solid #ffffff;
}
</style>
