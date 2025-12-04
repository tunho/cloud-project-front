<template>
  <div class="chip-stack">
    <div 
      v-for="i in stackCount" 
      :key="i" 
      class="chip-visual"
      :style="{ bottom: `${(i-1) * 4}px`, zIndex: i }"
    >
      <div class="chip-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  amount: number;
}>();

const stackCount = computed(() => {
  // 1 chip visual for every 10 chips, max 10 chips in stack
  // Minimum 1 chip if amount > 0
  if (props.amount <= 0) return 0;
  const count = Math.floor(props.amount / 10);
  return Math.min(Math.max(count, 1), 10);
});
</script>

<style scoped>
.chip-stack {
  position: relative;
  width: 40px;
  height: 60px; /* Enough for max stack */
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.chip-visual {
  position: absolute;
  width: 40px;
  height: 12px; /* Flattened circle look */
  background: linear-gradient(to bottom, #ffd700, #b8860b);
  border-radius: 50%;
  border: 1px solid #8b6914;
  box-shadow: 0 2px 2px rgba(0,0,0,0.3);
}

.chip-inner {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px dashed rgba(255,255,255,0.4);
  border-radius: 50%;
}
</style>
