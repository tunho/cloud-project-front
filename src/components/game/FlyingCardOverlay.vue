<template>
  <div class="flying-card-overlay">
    <FlyingCard
      v-for="card in cards"
      :key="card.id"
      :startRect="card.startRect"
      :endRect="card.endRect"
      :color="card.color"
      @complete="$emit('animation-complete', card.id)"
    />
  </div>
</template>

<script setup lang="ts">
import FlyingCard from "./FlyingCard.vue";

export interface FlyingCardData {
  id: string;
  startRect: { top: number; left: number; width: number; height: number };
  endRect: { top: number; left: number; width: number; height: number };
  color: "black" | "white";
}

defineProps<{
  cards: FlyingCardData[];
}>();

defineEmits(["animation-complete"]);
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
</style>
