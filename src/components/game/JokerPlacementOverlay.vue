<template>
  <div class="joker-overlay">
    <div class="overlay-content">
      <h2 class="title">조커를 어디에 놓을까요?</h2>
      <p class="subtitle">원하는 위치를 선택하세요</p>

      <div class="hand-container">
        <!-- 0번 인덱스 (맨 앞) 슬롯 -->
        <div 
          class="insertion-slot"
          :class="{ active: hoverSlot === 0 }"
          @click="selectSlot(0)"
          @mouseenter="hoverSlot = 0"
          @mouseleave="hoverSlot = -1"
        >
          <div class="slot-indicator">+</div>
        </div>

        <template v-for="(tile, index) in hand" :key="tile.id || index">
          <div class="tile" :class="tile.color">
            <div class="tile-content">
              <span v-if="tile.isJoker" class="joker">★</span>
              <span v-else class="number">{{ tile.value }}</span>
            </div>
          </div>

          <!-- 타일 사이 슬롯 (index + 1) -->
          <div 
            class="insertion-slot"
            :class="{ active: hoverSlot === index + 1 }"
            @click="selectSlot(index + 1)"
            @mouseenter="hoverSlot = index + 1"
            @mouseleave="hoverSlot = -1"
          >
            <div class="slot-indicator">+</div>
          </div>
        </template>
      </div>

      <div class="current-joker">
        <div class="tile" :class="drawnTile?.color || 'black'">
          <div class="tile-content">
            <span class="joker">★</span>
          </div>
        </div>
        <div class="label">배치할 조커</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  hand: any[];
  drawnTile: any;
}>();

const emit = defineEmits<{
  (e: 'place-joker', index: number): void;
}>();

const hoverSlot = ref(-1);

function selectSlot(index: number) {
  emit('place-joker', index);
}
</script>

<style scoped>
.joker-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'Inter', sans-serif;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.subtitle {
  font-size: 1.2rem;
  color: #ccc;
  margin-top: -20px;
}

.hand-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 타일 스타일 (PlayerCard와 유사하지만 단순화) */
.tile {
  width: 60px;
  height: 90px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
}

.tile.black {
  background: linear-gradient(145deg, #2b2b2b, #101010);
  border: 1px solid #444;
  color: #ffd700;
}

.tile.white {
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border: 2px solid #ffffff;
  color: #222;
}

.tile-content .number { font-size: 2.5rem; font-weight: 800; }
.tile-content .joker { font-size: 2.5rem; color: #ff4757; }
.tile.black .tile-content .joker { color: #ff6b81; }

/* 슬롯 스타일 */
.insertion-slot {
  width: 30px;
  height: 100px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px dashed rgba(255, 255, 255, 0.3);
}

.insertion-slot:hover, .insertion-slot.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  transform: scale(1.1);
}

.slot-indicator {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffd700;
}

.current-joker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0.8;
}

.current-joker .label {
  font-size: 0.9rem;
  color: #aaa;
}
</style>
