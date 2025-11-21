<template>
  <div class="player-card" :class="{ active }">
    <div class="hand" :class="[handClass, { 'eliminated': isEliminated }]">
      
      <!-- 플레이어 정보 표시 (닉네임, 학과, 학번) -->
      <div class="player-info-badge" :class="side">
        <div class="nickname-row">
          <span class="nickname">{{ player.nickname || player.name }}</span>
          <span class="bet-amount" v-if="player.betAmount">💰{{ player.betAmount }}</span>
          <button class="info-btn" @click.stop="() => { console.log('👁️ Info button clicked!', player); emit('show-info', player); }" title="플레이어 정보">👁️</button>
        </div>
      </div>

      <!-- 탈락 배지 -->
      <div v-if="isEliminated" class="eliminated-badge">OUT</div>

      <template v-if="orderedHand.length > 0">
        <div v-if="side === 'bottom'" class="arrow-container horizontal arrow-pos-top">
          <div class="line"></div>
          <svg class="arrow-head right" viewBox="0 0 12 12"><path d="M0,0 L12,6 L0,12 L2,6 Z" /></svg>
        </div>
        <div v-if="side === 'top'" class="arrow-container horizontal arrow-pos-bottom">
          <div class="line"></div>
          <svg class="arrow-head left" viewBox="0 0 12 12"><path d="M12,0 L0,6 L12,12 L10,6 Z" /></svg>
        </div>
          <!-- Arrow for left/right sides (rotated with hand) -->
          <div v-if="side === 'left' || side === 'right'" class="arrow-container horizontal"
               :class="{'arrow-pos-left-badge': side === 'left' || side === 'right'}">
            <div class="line"></div>
            <svg class="arrow-head right" viewBox="0 0 12 12"><path d="M0,0 L12,6 L0,12 L2,6 Z" /></svg>
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
          'interactable-tile': isInteractable && !t.revealed,
          'my-revealed': isMe && t.revealed
        }"
        @click="handleTileClick(index)"
      >

        <div class="tile-content" :class="{ 'content-pulse': t.isNew }">
          <template v-if="isMe">
            <span v-if="t.isJoker" class="joker">★</span>
            <span v-else class="number">{{ t.value }}</span>
            
            <!-- 🔥 [추가] 내 카드가 공개되었을 때 표시 -->
            <div v-if="t.revealed" class="revealed-overlay">
              <div class="eye-icon">👁️</div>
            </div>
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
  (e: 'show-info', player: any): void;  // 🔥 [NEW] 플레이어 정보 표시 이벤트
}>();

const isInteractable = computed(() => {
  return props.isMyTurn && (props.phase === 'GUESSING' || props.phase === 'POST_SUCCESS_GUESS') && !props.isMe;
});

function handleTileClick(index: number) {
  if (!isInteractable.value) return;
  const tile = orderedHand.value[index]; 
  if (tile && tile.revealed) return;

  // 🔥 [수정] Top만 역순이므로 논리적 인덱스로 변환
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
  // 🔥 [수정] Top만 역순 렌더링 (왼쪽=낮은수, 오른쪽=높은수)
  // Right, Left, Bottom은 모두 정순으로 렌더링
  if (props.side === "top") {
    return [...props.player.hand].slice().reverse();
  }
  return props.player.hand;
});

const isEliminated = computed(() => {
  if (!props.player.hand || props.player.hand.length === 0) return false;
  return props.player.hand.every((t: any) => t.revealed);
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
/* 🔥 [수정] Left/Right 카드는 90도 회전하여 수평으로 배치 */
.leftHand { 
  flex-direction: row; 
  gap: 12px; 
  transform: rotate(90deg);
  transform-origin: center center;
}
.rightHand { 
  flex-direction: row; 
  gap: 12px; 
  transform: rotate(-90deg);
  transform-origin: center center;
}
.topHand { gap: 12px; }

/* 🔥 ========== Player Info Button ========== */
.nickname-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  transition: all 0.2s ease;
  opacity: 0.7;
  pointer-events: auto; /* 🔥 [수정] 확실히 클릭 가능하도록 */
  z-index: 101; /* 🔥 [수정] 배지보다도 위로 */
}

.info-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  opacity: 1;
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

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
/* 🔥 [수정] 카드와 화살표를 감싸는 래퍼 */
.cards-wrapper {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

/* 화살표 컨테이너 (공통) */
.arrow-container {
  position: absolute;
  pointer-events: none;
  z-index: 0; /* 카드 뒤로 가도록? 아니면 겹치지 않게? 일단 0 */
  opacity: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
  
  /* 기본적으로 가로 라인 */
  left: 0; width: 100%; height: 2px;
}

/* 화살표 라인 */
.arrow-container .line {
  position: absolute;
  top: 50%; left: 0; width: 100%; height: 2px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, #ffffff 20%, #ffffff 80%, rgba(255,255,255,0) 100%);
}

/* 화살표 헤드 (SVG) */
.arrow-head {
  position: absolute;
  width: 14px; height: 14px;
  fill: #ffffff;
  top: 50%; right: 0; 
  transform: translateY(-50%);
}

.arrow-head.left {
  right: auto;
  left: 0;
}

/* 위치 조정 (카드 그룹 기준) */
.arrow-container.arrow-pos-top { top: -20px; }
.arrow-container.arrow-pos-bottom { bottom: -20px; }
.arrow-container.arrow-pos-left-badge { top: -25px; } /* 회전된 상태에서 위쪽(시각적 왼쪽) */
.arrow-container.arrow-pos-right-badge { bottom: -25px; } /* 회전된 상태에서 아래쪽(시각적 오른쪽) */


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

/* 🔥 [추가] 내 카드가 공개되었을 때 스타일 */
.my-revealed {
  border: 2px solid #ff4757 !important; /* 붉은 테두리로 경고 */
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

.revealed-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: rgba(255, 71, 87, 0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.eye-icon {
  font-size: 12px;
  line-height: 1;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* -----------------------------
   플레이어 정보 & 탈락 스타일
----------------------------- */
.player-info-badge {
  position: absolute;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 12px;
  color: white;
  text-align: center;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 200; /* 🔥 [수정] 화살표(z-index:5)보다 훬씬 높게 */
  white-space: nowrap;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.player-info-badge .nickname {
  font-weight: 700;
  font-size: 0.9rem;
}

.player-info-badge .bet-amount {
  font-size: 0.8rem;
  color: #ffd700;
  margin-left: 4px;
  font-weight: 600;
}

.player-info-badge .details {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 2px;
}

/* 위치별 배지 배치 */
.player-info-badge.bottom { bottom: 140px; left: 50%; transform: translateX(-50%); }
.player-info-badge.top { top: 110px; left: 50%; transform: translateX(-50%); }
.player-info-badge.left { top: -80px; left: 50%; transform: translateX(-50%); } /* 🔥 [수정] 더 높게 이동 */
.player-info-badge.right { top: -80px; left: 50%; transform: translateX(-50%); } /* 🔥 [수정] 더 높게 이동 */

/* 탈락 상태 */
.hand.eliminated {
  filter: grayscale(100%) opacity(0.6);
  pointer-events: none;
}

.eliminated-badge {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 3rem;
  font-weight: 900;
  color: #ff4757;
  border: 4px solid #ff4757;
  padding: 10px 20px;
  border-radius: 10px;
  z-index: 50;
  text-shadow: 2px 2px 0 #000;
  background: rgba(0,0,0,0.5);
  animation: stamp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes stamp {
  0% { transform: translate(-50%, -50%) scale(2) rotate(0deg); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1) rotate(-15deg); opacity: 1; }
}
</style>