<template>
  <div class="player-card" :class="{ active }">
    <div class="player-name">
      {{ player.name }}
      <span v-if="isMe"> (나)</span>
      <span v-if="active"> ← 턴</span>
    </div>

    <div class="hand">
      <div
        v-for="(t, i) in player.hand"
        :key="t.id"
        class="tile"
        :style="tileStyle(t)"
      >
        <span v-if="t.isJoker">★</span>
        <span v-else>{{ t.color[0].toUpperCase() + t.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  player: any,
  active: boolean,
  isMe: boolean
}>();

import type { CSSProperties } from "vue";

function tileStyle(t: any): CSSProperties {
  const isBlack = t.color === "black";
  return {
    width: "28px",
    height: "38px",
    border: "1px solid #999",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    background: isBlack ? "#222" : "#fff",
    color: isBlack ? "#fff" : "#000",
  };
}
</script>

<style scoped>
.player-card {
  background: #fafafa;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 10px;
  width: 160px;
}

.player-card.active {
  background: #eaf5ff;
  border-color: #4a90e2;
}

.player-name {
  font-weight: 700;
  margin-bottom: 6px;
  text-align: center;
}

.hand {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.tile {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
