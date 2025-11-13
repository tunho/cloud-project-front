<template>
  <div class="overlay">
    <div class="panel">
      <h2>{{ currentPlayer?.name }}의 조커 배치</h2>

      <div class="hand-row">

        <!-- 맨 앞 슬롯 -->
        <div class="slot" @click="selectSlot(0)">
          <span>+</span>
        </div>

        <!-- 카드와 그 다음 슬롯 렌더링 -->
        <div v-for="(card, idx) in currentPlayer.hand" :key="idx" class="pair">
          <TileCard :tile="card" class="card-item" />

          <!-- 다음 슬롯 -->
          <div class="slot" @click="selectSlot(idx + 1)">
            <span>+</span>
          </div>
        </div>

      </div>

      <button class="cancel-btn" @click="close">취소</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import TileCard from "./TileCard.vue";
import { useGameStore } from "../stores/game";

const store = useGameStore();

const emit = defineEmits(["choose", "close"]);

/* 🎯 store.currentPlayer 를 반응형으로 감싼다 */
const currentPlayer = computed(() => store.currentPlayer);

/* 슬롯 선택 → index 전달 */
const selectSlot = (index) => {
  emit("choose", { playerId: currentPlayer.value.id, index });
};

const close = () => emit("close");
</script>

<style scoped>
/* 전체 오버레이 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5000;
}

/* 배치 패널 */
.panel {
  background: #fff;
  padding: 20px 28px;
  border-radius: 12px;
  min-width: 500px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.25);
  text-align: center;
}

/* 카드 + 슬롯 배치 줄 */
.hand-row {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

/* 카드 + 슬롯 묶음 */
.pair {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 슬롯 버튼 */
.slot {
  width: 45px;
  height: 60px;
  border: 2px dashed #888;
  border-radius: 6px;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  transition: 0.15s;
}

.slot:hover {
  background: rgba(0, 120, 255, 0.15);
  border-color: #007bff;
}

/* 취소 버튼 */
.cancel-btn {
  margin-top: 16px;
  padding: 8px 14px;
  font-size: 15px;

  background: #ddd;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #ccc;
}
</style>
