<template>
  <div class="tile" :class="tileClass">
    <span v-if="tile.isJoker" class="joker-symbol">★</span>
    <span v-else class="value">{{ tile.value }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ tile: Object });

const tileClass = computed(() => ({
  tile: true,
  black: props.tile.color === "black",
  white: props.tile.color === "white",
  revealed: props.tile.revealed,
}));


</script>


<style scoped>
.tile {
  width: 40px;
  height: 55px;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 20px;
  border: 2px solid #000;

  transition: 0.2s;
}

/* ===== 색상 ===== */
.tile.black {
  background: #111;
  color: white;
}

.tile.white {
  background: white;
  color: #111;
  border-color: #ccc;
}


/* ===== 공개된 카드 스타일 ===== */
.tile.revealed {
  box-shadow: 0 0 10px rgba(255, 240, 0, 0.8);
}

/* ===== 심볼 ===== */
.joker-symbol {
  font-size: 22px;
}

.value {
  font-size: 22px;
}
</style>