<template>
  <div class="player">
    <div class="name" :class="{ current: isCurrent }">
      {{ player.name }}
    </div>

    <div class="hand">
    <TileCard
      v-for="(t,i) in player.hand"
      :key="t.id"
      :tile="t"
      class="tile-wrapper"
      :class="{ 
        revealed: t.revealed,
        disabled: (player.id === store.currentTurn) || t.revealed
      }"
      @click="selectCard(i, t)"
    />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import TileCard from "./TileCard.vue";
import { useGameStore } from "../stores/game";

const props = defineProps({
  player: Object
});

const emit = defineEmits(["guess"]);

const store = useGameStore();

/* 현재 턴의 플레이어인지 여부 */
const isCurrent = computed(() => store.currentTurn === props.player.id);

/* ===== 카드 클릭 처리 ===== */
const selectCard = (index, tile) => {
  // 자기 카드는 클릭 불가
  if (isCurrent.value) return;

  // 이미 공개된 타일 클릭 불가
  if (tile.revealed) return;

  emit("guess", { index, playerId: props.player.id });
};
</script>

<style scoped>
.player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.name {
  font-weight: bold;
  margin-bottom: 6px;
}

.name.current {
  color: #2a71ff;
}

.hand {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* ===== 클릭 불가 스타일 ===== */
.tile-wrapper.disabled {
  pointer-events: none;
  cursor: default;
  opacity: 0.5; /* 시각적으로 비활성 */
}

.tile-wrapper.revealed {
  filter: grayscale(70%);
}
</style>
