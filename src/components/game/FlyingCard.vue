<template>
  <div class="flying-card-container" :style="containerStyle">
    <div class="flying-card-inner" :class="color" :style="innerStyle">
      <div class="card-face"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";

const props = defineProps<{
  startRect: { top: number; left: number; width: number; height: number };
  endRect: { top: number; left: number; width: number; height: number };
  color: "black" | "white";
}>();

const emit = defineEmits(["complete"]);

const isMoving = ref(false);

// X축 이동 (Linear)
const containerStyle = computed(() => ({
  position: "fixed" as const,
  left: `${props.startRect.left}px`,
  top: `0px`, // Y축은 inner에서 제어하므로 0
  width: `${props.startRect.width}px`,
  height: `${props.startRect.height}px`,
  transform: isMoving.value 
    ? `translateX(${props.endRect.left - props.startRect.left}px)` 
    : `translateX(0)`,
  transition: isMoving.value ? "transform 0.6s linear" : "none", // 🔥 [FIX] 0.3s -> 0.6s
  zIndex: 9999,
  pointerEvents: "none" as const,
}));

// Y축 이동 (Ease-in-out or Cubic Bezier for arc effect) + Scale + Rotate
const innerStyle = computed(() => {
  const deltaY = props.endRect.top - props.startRect.top;
  const scaleX = props.endRect.width / props.startRect.width;
  const scaleY = props.endRect.height / props.startRect.height;

  return {
    position: "absolute" as const,
    top: `${props.startRect.top}px`,
    left: `0px`,
    width: "100%",
    height: "100%",
    transform: isMoving.value
      ? `translateY(${deltaY}px) scale(${scaleX}, ${scaleY})` 
      : `translateY(0) scale(1)`,
    // Y축은 ease-out을 사용하여 깔끔하게 떨어지는 느낌
    transition: isMoving.value ? "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none", // 🔥 [FIX] 0.3s -> 0.6s
  };
});

onMounted(async () => {
  await nextTick();
  // 브라우저 리플로우 보장
  setTimeout(() => {
    isMoving.value = true;
  }, 20); // 50ms -> 20ms

  setTimeout(() => {
    emit("complete");
  }, 650); // 🔥 [FIX] 0.6s + buffer
});
</script>

<style scoped>
.flying-card-inner {
  border-radius: 6px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  transform-origin: center center;
}

.flying-card-inner.black {
  background: linear-gradient(145deg, #2b2b2b, #101010);
  border: 1px solid #444;
}

.flying-card-inner.white {
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border: 2px solid #ffffff;
}
</style>
