<template>
  <div class="player-card">
    <div class="hand" :class="handClass">
      <div
        v-for="t in player.hand"
        :key="t.id"
        class="tile"
        :class="{
          revealed: t.revealed || isMe,
          black: t.color === 'black',
          white: t.color === 'white'
        }"
        :style="tileRotate"
      >
        <div class="tile-content" :class="contentClass">
          <!-- 내 카드 -->
          <template v-if="isMe">
            <span v-if="t.isJoker" class="joker">★</span>
            <span v-else class="number">{{ t.value }}</span>
          </template>

          <!-- 상대 카드 -->
          <template v-else>
            <span v-if="t.revealed">
              <span v-if="t.isJoker" class="joker">★</span>
              <span v-else class="number">{{ t.value }}</span>
            </span>
            <span v-else class="hidden">?</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  player: any;
  isMe: boolean;
  active: boolean;
  side: "left" | "right";
}>();

/* 좌/우 손패 기울기 */
const handClass = computed(() => ({
  leftTilt: props.side === "left",
  rightTilt: props.side === "right",
}));

/* 숫자/별을 다시 반대 방향으로 보정 */
const contentClass = computed(() => ({
  contentLeft: props.side === "left",
  contentRight: props.side === "right",
}));

/* 개별 카드 미세 기울기 */
const tileRotate = computed(() => ({
  transform: props.side === "left" ? "rotate(-10deg)" : "rotate(10deg)",
}));
</script>

<style scoped>
/* 전체 카드 묶음 */
.hand {
  display: flex;
  gap: 14px;
}

.leftTilt {
  transform: rotate(-35deg);
}

.rightTilt {
  transform: rotate(35deg);
}

/* 🎮 실물 타일 스타일 */
.tile {
  width: 70px;
  height: 95px;
  border-radius: 12px;
  border: 3px solid #444;
  box-shadow: 0px 4px 8px rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;

  transition: transform 0.2s;
  background: #fff;
}

/* 색상별 배경 */
.tile.black {
  background: #111;
  border-color: #000;
  color: #fff;
}

.tile.white {
  background: #fff;
  border-color: #ccc;
  color: #000;
}

/* 텍스트 올바르게 보정 */
.contentLeft {
  transform: rotate(35deg);
}

.contentRight {
  transform: rotate(-35deg);
}

.number {
  font-size: 36px;
  font-weight: 900;
}

.hidden {
  font-size: 40px;
  color: #888;
}

.joker {
  font-size: 40px;
  color: gold;
  font-weight: 900;
  text-shadow: 0px 0px 6px rgba(255,215,0,0.7);
}

/* 자기 턴인 플레이어 강조 효과 */
.player-card.active .tile {
  box-shadow: 0px 0px 18px rgba(80,150,255,0.7);
}
</style>
