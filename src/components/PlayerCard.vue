<template>
  <div class="player-card" :class="{ active }">
    <div class="hand" :class="handClass">
      
      <template v-if="orderedHand.length > 0">
        <div v-if="side === 'bottom'" class="arrow-container horizontal arrow-pos-bottom">
          <div class="line"></div>
          <svg class="arrow-head right" viewBox="0 0 10 10">
            <path d="M0,0 L10,5 L0,10 Z" fill="#5a5a5a" />
          </svg>
        </div>
        <div v-if="side === 'top'" class="arrow-container horizontal arrow-pos-top">
          <div class="line"></div>
          <svg class="arrow-head left" viewBox="0 0 10 10">
            <path d="M10,0 L0,5 L10,10 Z" fill="#5a5a5a" />
          </svg>
        </div>
        <div v-if="side === 'right'" class="arrow-container vertical arrow-pos-right ">
          <div class="line-v"></div>
          <svg class="arrow-head up" viewBox="0 0 10 10">
            <path d="M0,10 L5,0 L10,10 Z" fill="#5a5a5a" />
          </svg>
        </div>
        <div v-if="side === 'left'" class="arrow-container vertical arrow-pos-left">
          <div class="line-v"></div>
          <svg class="arrow-head down" viewBox="0 0 10 10">
            <path d="M0,0 L10,0 L5,10 Z" fill="#5a5a5a" />
          </svg>
        </div>
      </template>

      <div
        v-for="(t, index) in handWithNewFlag"
        :key="t.id"
        class="tile"
        :class="{ 
          black: t.color === 'black', 
          white: t.color === 'white', 
          'new-tile-highlight': t.isNew,
          
          /* 🔥🔥 인터랙션 클래스 추가: 추리 가능하고 뒤집히지 않은 카드만 */
          'interactive': isInteractable && !t.revealed
        }"
        :style="t.isNew ? { ...tileStyle, zIndex: 10 } : tileStyle"
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
  isMyTurn?: boolean; // Game.vue에서 전달받음
}>();

const emit = defineEmits<{
  (e: "select-tile", payload: { targetId: number; index: number }): void;
}>();

// 🔥🔥 상호작용(추리) 가능 여부 계산
const isInteractable = computed(() => {
  // 1. 내 턴이고, 2. 추리 단계이며, 3. 내 카드가 아닐 때
  return props.isMyTurn && props.phase === 'GUESSING' && !props.isMe;
});

function handleTileClick(index: number) {
  // 인터랙션 불가능하면 클릭 무시
  if (!isInteractable.value) return;

  const tile = orderedHand.value[index]; 
  
  // 이미 공개된 카드는 클릭 무시
  if (tile && tile.revealed) {
    return;
  }

  emit("select-tile", {
    targetId: props.player.id,
    index: index,
  });
}

// 🔥🔥 Top 플레이어 반전 로직이 포함된 플래그 계산
const handWithNewFlag = computed(() => {
  const lastIdx = props.player.lastDrawnIndex;

  if (lastIdx === null || lastIdx === undefined) {
    return orderedHand.value;
  }
  
  const totalCards = orderedHand.value.length;

  return orderedHand.value.map((tile: any, index: number) => {
    let isNew = false;

    // Top 플레이어는 배열이 시각적으로 뒤집혀 있으므로 인덱스도 뒤집어서 비교
    if (props.side === 'top') {
      isNew = index === (totalCards - 1 - lastIdx);
    } else {
      isNew = index === lastIdx;
    }

    return {
      ...tile,
      isNew
    };
  });
});

const tileStyle = computed(() => {
  switch (props.side) {
    case "top":
      return { transform: "rotate(180deg)" };
    case "bottom":
      return { transform: "rotate(0deg)" };
    case "left":
      return { transform: "rotate(90deg)" };
    case "right":
      return { transform: "rotate(-90deg)" };
    default:
      return {};
  }
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
  gap: 18px;
  transform-origin: center center;
}
.leftHand {
  flex-direction: column;
  gap: 1px;
}
.rightHand {
  flex-direction: column;
  gap: 1px;
}

/* -----------------------------
   카드 스타일
----------------------------- */
.tile {
  width: 70px;
  height: 95px;
  border-radius: 12px;
  border: 3px solid #444;
  box-shadow: 0 4px 8px rgba(0,0,0,0.35);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 회전 트랜지션 */
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; 
  z-index: 2; 
}

/* 🔥🔥🔥 인터랙션 Hover 효과 수정 🔥🔥🔥
   - 움직임(translateY) 제거
   - 황금빛 테두리와 광채(Glow)만 적용
*/
.tile.interactive:hover {
  cursor: pointer;
  /* 황금빛 테두리 */
  border-color: #FFD700 !important; 
  border-width: 3px;
  
  /* 황금빛 광채 */
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.7), 
              0 4px 8px rgba(0,0,0,0.35) !important;
  
  /* 강조를 위해 z-index만 살짝 높임 */
  z-index: 20; 
}

.tile.black { background: #111; color: white; }
.tile.white { background: white; color: black; }

.tile-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.number { font-size: 36px; font-weight: 900; }
.hidden { font-size: 40px; color: #888; }
.joker {
  font-size: 40px; color: gold; font-weight: 900;
  text-shadow: 0 0 6px rgba(255,215,0,.7);
}

/* -----------------------------
   화살표 스타일
----------------------------- */
.arrow-container {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}
.arrow-head {
  position: absolute;
  width: 12px;  
  height: 12px;
  overflow: visible;
}
.arrow-container.horizontal {
  left: 0;
  width: 100%;
  height: 20px;
}
.arrow-container.arrow-pos-bottom { bottom: 110px; }
.arrow-container.arrow-pos-top { top: 110px; }

.horizontal .line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #5a5a5a;
  transform: translateY(-50%);
}
.arrow-head.right {
  top: 50%; right: 0;
  transform: translate(0, -50%); margin-right: -1px; 
}
.arrow-head.left {
  top: 50%; left: 0; 
  transform: translate(0, -50%); margin-left: -1px;
}
.arrow-container.vertical {
  top: 0; height: 100%; width: 20px;
  right: 100%; margin-right: 12px; 
}
.arrow-container.arrow-pos-left{ left: 110px; }
.arrow-container.arrow-pos-right{ right: 90px; }

.vertical .line-v {
  position: absolute;
  left: 50%; top: 0; height: 100%; width: 2px;
  background-color: #5a5a5a;
  transform: translateX(-50%);
}
.arrow-head.up {
  top: 0; left: 50%;
  transform: translate(-50%, 0); margin-top: -1px;
}
.arrow-head.down {
  bottom: 0; left: 50%;
  transform: translate(-50%, 0); margin-bottom: -1px;
}

/* -----------------------------
   새 카드 하이라이트
----------------------------- */
.tile.new-tile-highlight {
  box-shadow: 0 0 10px 5px rgba(76, 175, 80, 0.8),
              0 4px 8px rgba(0,0,0,0.35);
  border: 3px solid #4CAF50; 
}

.content-pulse {
  animation: pulse-scale 1.5s ease-out infinite alternate;
}

@keyframes pulse-scale {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.15);
  }
}
</style>