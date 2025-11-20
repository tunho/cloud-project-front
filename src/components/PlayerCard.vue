<template>
  <div class="player-card" :class="{ active }">
    <div class="hand" :class="handClass">
      
      <template v-if="orderedHand.length > 0">
        <div v-if="side === 'bottom'" class="arrow-container horizontal arrow-pos-bottom">
          <div class="line"></div>
          <svg class="arrow-head right" viewBox="0 0 12 12"><path d="M0,0 L12,6 L0,12 L2,6 Z" /></svg>
        </div>
        <div v-if="side === 'top'" class="arrow-container horizontal arrow-pos-top">
          <div class="line"></div>
          <svg class="arrow-head left" viewBox="0 0 12 12"><path d="M12,0 L0,6 L12,12 L10,6 Z" /></svg>
        </div>
        <div v-if="side === 'right'" class="arrow-container vertical arrow-pos-right ">
          <div class="line-v"></div>
          <svg class="arrow-head up" viewBox="0 0 12 12"><path d="M0,12 L6,0 L12,12 L6,10 Z" /></svg>
        </div>
        <div v-if="side === 'left'" class="arrow-container vertical arrow-pos-left">
          <div class="line-v"></div>
          <svg class="arrow-head down" viewBox="0 0 12 12"><path d="M0,0 L6,12 L12,0 L6,2 Z" /></svg>
        </div>
      </template>

      <div
        v-for="(t, index) in handWithNewFlag"
        :key="t.id"
        :id="`player-${player.id}-tile-${index}`"
        class="tile"
        :class="{
          black: t.color === 'black',
          white: t.color === 'white',
          'new-tile-highlight': t.isNew,
          'interactable-tile': isInteractable && !t.revealed
        }"
        @click="handleTileClick(index)"
      >

        <div class="tile-content" :class="{ 'content-pulse': t.isNew }">
          <template v-if="isMe">
            <span v-if="t.isJoker" class="joker">★</span>
            <span v-else class="number">{{ t.value }}</span>
          </template>

          <template v-else>
            <template v-if="t.revealed">
              <span v-if="t.isJoker" class="joker">★</span>
              <span v-else class="number">{{ t.value }}</span>
            </template>
            <span v-else class="hidden">?</span>
          </template>
        </div>

        <div v-if="t.isNew" class="new-card-glow"></div>

        <div class="chain-lock-overlay" v-if="!t.revealed && !isMe">
          <div class="padlock-icon"></div>
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
  side: "top" | "bottom" | "left" | "right";
  phase: string;
  selectedTarget?: { targetId: number; index: number } | null;
  isMyTurn?: boolean;
}>();

const emit = defineEmits<{
  (e: "select-tile", payload: { targetId: number; index: number }): void;
}>();

const isInteractable = computed(() => {
  return props.isMyTurn && props.phase === 'GUESSING' && !props.isMe;
});

function handleTileClick(index: number) {
  if (!isInteractable.value) return;
  const tile = orderedHand.value[index]; 
  if (tile && tile.revealed) return;

  // 🔥 [수정] Top 플레이어는 시각적으로 역순이므로, 논리적 인덱스(실제 핸드 인덱스)로 변환 필요
  let logicalIndex = index;
  if (props.side === 'top') {
    logicalIndex = props.player.hand.length - 1 - index;
  }

  emit("select-tile", {
    targetId: props.player.id,
    index: logicalIndex,
  });
}

const handWithNewFlag = computed(() => {
  const lastIdx = props.player.lastDrawnIndex;
  const hand = orderedHand.value;

  if (lastIdx === null || lastIdx === undefined) {
    return hand;
  }
  const totalCards = hand.length;

  return hand.map((tile: any, index: number) => {
    let isNew = false;
    if (props.side === 'top') {
      isNew = index === (totalCards - 1 - lastIdx);
    } else {
      isNew = index === lastIdx;
    }
    return { ...tile, isNew };
  });
});

const handClass = computed(() => ({
  topHand: props.side === "top",
  bottomHand: props.side === "bottom",
  leftHand: props.side === "left",
  rightHand: props.side === "right",
}));

const orderedHand = computed(() => {
  return props.side === "top"
    ? [...props.player.hand].slice().reverse()
    : props.player.hand;
});
</script>

<style scoped>
/* -----------------------------
   기본 레이아웃
----------------------------- */
.hand {
  position: relative;
  display: flex;
  gap: 12px;
  transform-origin: center center;
  perspective: 1000px;
}
.leftHand { flex-direction: column; gap: -40px; }
.rightHand { flex-direction: column; gap: -40px; }
.topHand { gap: 12px; }

/* -----------------------------
   카드 스타일 (High Contrast)
----------------------------- */
.tile {
  width: 60px;
  height: 90px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-style: preserve-3d;
  box-shadow: 
    0 4px 8px rgba(0,0,0,0.5),
    0 1px 3px rgba(0,0,0,0.3);
}

/* Black Tile */
.tile.black {
  background: #1a1a1a; /* 완전 검정보다 살짝 밝게하여 입체감 */
  border: 1px solid #444;
  color: #ffd700;
  background: linear-gradient(145deg, #2b2b2b, #101010);
}

/* 🔥 [수정] White Tile: 뒤집힌 상태에서도 완벽한 흰색 유지 */
.tile.white {
  background: #ffffff; /* 기본 배경을 순백색으로 */
  /* 아주 미세한 그라데이션으로 입체감만 줌 (회색톤 제거) */
  background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
  border: 2px solid #ffffff; /* 테두리도 흰색 */
  color: #222;

  /* 흰색이 배경에 묻히지 않도록 그림자 강조 */
  box-shadow: 
    0 5px 15px rgba(0,0,0,0.5), 
    inset 0 0 0 1px rgba(200,200,200, 0.3); /* 내부 얇은 라인으로 형태 구분 */
}

/* Hidden Tile (Back) */
.hidden { font-size: 0; }
.tile .hidden::after {
  content: '?';
  font-size: 24px;
  font-weight: 900;
  color: rgba(0,0,0,0.2); /* 물음표 색상도 연하게 */
}
.tile.black .hidden::after {
  color: rgba(255,255,255,0.2);
}

/* -----------------------------
   내 카드
----------------------------- */
.bottomHand .tile {
  width: 80px;
  height: 120px;
  border-radius: 12px;
}
.bottomHand .tile:hover {
  transform: translateY(-10px);
  z-index: 10;
}

/* -----------------------------
   인터랙션 모드
----------------------------- */
.interactable-tile { cursor: pointer; }
.interactable-tile:hover {
  transform: translateY(-15px) scale(1.1) !important;
  z-index: 100;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 15px 30px rgba(0,0,0,0.6);
  border-color: #ffd700 !important;
}

/* -----------------------------
   폰트
----------------------------- */
.tile-content .number { font-size: 2.5rem; font-weight: 800; font-family: 'Inter', sans-serif; }
.bottomHand .tile-content .number { font-size: 3.5rem; }
.tile-content .joker { font-size: 2.5rem; color: #ff4757; }
.tile.black .tile-content .joker { color: #ff6b81; }

/* -----------------------------
   🔥 [수정] 화살표 디자인
   (삼각형과 선의 연결을 자연스럽게, 색상을 순백색으로)
----------------------------- */
.arrow-container {
  position: absolute;
  pointer-events: none;
  z-index: 5;
  opacity: 1; /* 투명도 제거하여 선명하게 */
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8)); /* 그림자로 배경과 분리 */
}

/* 화살표 헤드 (SVG) */
.arrow-head {
  position: absolute;
  width: 14px; /* 크기 조정 */
  height: 14px;
  fill: #ffffff;
}

/* 가로 라인 */
.arrow-container.horizontal {
  left: 0; width: 100%; height: 2px;
}
.horizontal .line {
  position: absolute;
  top: 50%; left: 0; width: 100%; height: 2px;
  transform: translateY(-50%);
  /* 양끝이 투명해지는 그라데이션 라인 */
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, #ffffff 20%, #ffffff 80%, rgba(255,255,255,0) 100%);
}

.arrow-container.arrow-pos-bottom { bottom: 135px; }
.arrow-container.arrow-pos-top { top: 105px; }

/* 세로 라인 */
.arrow-container.vertical {
  top: 0; height: 100%; width: 2px;
}
.vertical .line-v {
  position: absolute;
  left: 50%; top: 0; width: 2px; height: 100%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 20%, #ffffff 80%, rgba(255,255,255,0) 100%);
}

.arrow-container.arrow-pos-left { left: 85px; }
.arrow-container.arrow-pos-right { right: 85px; }

/* 화살표 헤드 위치 정렬 (라인과 겹치도록 미세 조정) */
.arrow-head.right { top: 50%; right: 0; transform: translateY(-50%); }
.arrow-head.left  { top: 50%; left: 0; transform: translateY(-50%); }
.arrow-head.up    { left: 50%; top: 0; transform: translateX(-50%); }
.arrow-head.down  { left: 50%; bottom: 0; transform: translateX(-50%); }


/* -----------------------------
   기타 효과
----------------------------- */
.new-tile-highlight {
  box-shadow: 0 0 15px #4CAF50, 0 0 5px #4CAF50 inset !important;
  border-color: #4CAF50 !important;
}
.chain-lock-overlay {
  position: absolute; inset: 0; border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
  display: flex; justify-content: center; align-items: center;
  pointer-events: none;
}
.padlock-icon {
  width: 24px; height: 24px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1zM8 6a4 4 0 0 1 8 0v2H8V6z'/%3E%3C/svg%3E") no-repeat center/contain;
  opacity: 0.8;
}
</style>