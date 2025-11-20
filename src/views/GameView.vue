<template>
  <div class="game-container">
    
<template v-for="side in sideList" :key="side">
      <template v-for="p in players" :key="side + '-' + p.sid">
        <div v-if="seatMap[p.sid] === side" :class="side + (side === 'top' ? '-player' : '-zone')">
          <div :class="side === 'top' ? '' : side + '-hand'">
            <PlayerCard
              :player="p"
              :isMe="false"
              :active="p.id === currentTurn"
              :phase="phase"
              :side="side"  :isMyTurn="isMyTurn"
              :selectedTarget="selectedTarget"
              @select-tile="handleTileSelected"
            />
          </div>
        </div>
      </template>
    </template>
    <div class="center-area">
      
      <GuessInputWheel
        v-if="isGuessingUIOpen && !isWaitingForResult"
        @cancel="cancelSelection"
        @select-value="selectGuessValue"
      />

      <GameNotification
        :isWaitingForResult="isWaitingForResult"
        :showResultModal="showResultModal"
        :guessResult="guessResult"
      />

      <GameDrawUI
        v-if="isMyTurn && phase === 'DRAWING' && !showResultModal"
        @pick-color="pickColor"
      />

      <GameTimer
        v-else-if="!isGuessingUIOpen && !isWaitingForResult && !showResultModal"
        :circleStyle="circleStyle"
        :currentPlayerName="orderedPlayers[currentTurn]?.name"
        :isMyTurn="isMyTurn"
      />

      <!-- 🔥 [삭제] 중앙 덱 (사용자 요청으로 제거, 애니메이션은 화면 중앙 좌표 사용) -->

      
    </div>

    <div v-if="me && seatMap[me.sid] === 'bottom'">
      <div class="my-hand">
        <PlayerCard
          :player="me"
          :isMe="true"
          :active="me.id === currentTurn"
          :phase="phase"
          side="bottom"
          :isMyTurn="isMyTurn"
          :selectedTarget="selectedTarget"
          @select-tile="handleTileSelected"
        />
      </div>
    </div>

    <GuessAnimationOverlay
      :isVisible="isAnimating"
      :targetRect="animTargetRect"
      :isCorrect="animIsCorrect"
      :guessedValue="animGuessedValue"
      @animation-complete="handleAnimationComplete"
    />

    <ContinueGuessOverlay
      :isVisible="showContinueOverlay"
      :timer="continueTimer"
      @continue="handleContinueGuess"
      @pass="handlePassTurn"
    />

    <JokerPlacementOverlay
      v-if="phase === 'PLACE_JOKER' && isMyTurn && me"
      :hand="me.hand"
      :drawnTile="drawnTile"
      @place-joker="handlePlaceJoker"
    />

    <FlyingCardOverlay
      :isVisible="isFlying"
      :startRect="flyStartRect"
      :endRect="flyEndRect"
      :color="flyColor"
      @animation-complete="handleFlyComplete"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { socket } from "../socket";

// 컴포넌트 Import
import PlayerCard from "../components/PlayerCard.vue";
import GuessInputWheel from "../components/game/GuessInputWheel.vue";
import GameNotification from "../components/game/GameNotification.vue";
import GameDrawUI from "../components/game/GameDrawUI.vue";
import GameTimer from "../components/game/GameTimer.vue";
import GuessAnimationOverlay from "../components/game/GuessAnimationOverlay.vue";
import ContinueGuessOverlay from "../components/game/ContinueGuessOverlay.vue";
import JokerPlacementOverlay from "../components/game/JokerPlacementOverlay.vue";
import FlyingCardOverlay from "../components/game/FlyingCardOverlay.vue"; // 🔥 [추가]


const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId as string;
const maxTime = ref(20);

const isAnimating = ref(false);
const animIsCorrect = ref(false);
const animGuessedValue = ref<number | string | null>(null); // 🔥 [추가]
const animTargetRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const currentAnimData = ref<any>(null); // 나중에 서버로 보낼 데이터 저장용

const showContinueOverlay = ref(false);
const continueTimer = ref(0);

// 🔥 [추가] 카드 날리기 애니메이션 상태
const isFlying = ref(false);
const flyStartRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const flyEndRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const flyColor = ref<"black" | "white">("black");

// ... (기존 상태값 및 로직 그대로 복사) ...
// players, currentTurn, piles, drawnTile, phase, timeLeft, mySid, selectedTarget
// isWaitingForResult, showResultModal, guessResult, currentGuessInfo
// orderedPlayers, me, isMyTurn, isGuessingUIOpen, circleStyle
// startLocalTimer, pickColor, handleStateUpdate, handleTurnPhaseStart
// handleGuessResult, handleGuessAttempt, seatMap
// handleTileSelected, cancelSelection, selectGuessValue, sendGuess

// -----------------------------
// 상태값 (요약)
// -----------------------------
const players = ref<any[]>([]);
const currentTurn = ref(0);
const phase = ref("INIT");
const piles = ref({ black: 0, white: 0 }); // 🔥 [추가]
const timeLeft = ref(0);
let timerInterval: number | null = null;
const mySid = ref<string | null>(null);
const drawnTile = ref<any>(null);

// 추리 타겟 상태
const selectedTarget = ref<{ targetId: number; index: number } | null>(null);

// UI 상태
const isWaitingForResult = ref(false);
const showResultModal = ref(false);
const guessResult = ref<{ correct: boolean; value: number } | null>(null);
const currentGuessInfo = ref<{
    guesserName: string; targetName: string; targetTileIndex: number; guessValue: number | string; 
} | null>(null); 

// -----------------------------
// 계산 속성 (요약)
// -----------------------------
const orderedPlayers = computed(() => [...players.value].sort((a, b) => a.id - b.id));
const me = computed(() => players.value.find((p) => p.sid === mySid.value) || null);
const isMyTurn = computed(() => me.value && me.value.id === currentTurn.value);
const isGuessingUIOpen = computed(() => !!selectedTarget.value);
const circleStyle = computed(() => {
  const percent = 1 - timeLeft.value / maxTime.value;
  return { "--timer-angle": `${percent * 360}deg` };
});

// -----------------------------
// 로직 함수 (이전 코드와 동일)
// -----------------------------
function startLocalTimer(sec: number) {
  timeLeft.value = sec;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    timeLeft.value -= 1;
    if (timeLeft.value <= 0) clearInterval(timerInterval!);
  }, 1000);
}

function pickColor(payload: { color: "black" | "white", event: MouseEvent } | "black" | "white") {
  if (!isMyTurn.value) return;
  
  let color: "black" | "white" = "black";
  
  // 이벤트 객체가 있는 경우 (GameDrawUI에서 호출)
  if (typeof payload === "object" && "color" in payload) {
    color = payload.color;
    const target = payload.event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      flyStartRect.value = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
      flyColor.value = color;
    }
  } else {
    // 하위 호환성 (혹시 모를 직접 호출)
    color = payload as "black" | "white";
  }

  socket.emit("draw_tile", { roomId, color });
}

function handleStateUpdate(data: any) {
  // 1. 이전 핸드 상태 저장 (플레이어 ID별 핸드 길이)
  const oldHandLengths = new Map<number, number>();
  players.value.forEach(p => oldHandLengths.set(p.id, p.hand.length));

  // 2. 상태 업데이트
  players.value = data.players || [];
  currentTurn.value = data.currentTurn ?? 0;
  if (data.phase) phase.value = data.phase;
  drawnTile.value = data.drawnTile || null;
  piles.value = data.piles || { black: 0, white: 0 }; // 🔥 [추가]

  // 3. 변경 감지 및 애니메이션 트리거
  players.value.forEach(p => {
    const oldLen = oldHandLengths.get(p.id) || 0;
    if (p.hand.length > oldLen) {
      // 카드가 추가됨 -> 애니메이션 대상!
      const newCardIndex = p.lastDrawnIndex ?? (p.hand.length - 1);
      const newCard = p.hand[newCardIndex]; 
      
      // 내 턴이고 이미 pickColor에서 시작 위치를 잡았다면 덮어쓰지 않음
      if (p.sid === mySid.value && flyStartRect.value) {
        // pass (keep existing flyStartRect)
      } else {
        // 소스 덱 찾기 (없으면 화면 중앙)
        const sourceId = newCard.color === 'black' ? 'deck-black' : 'deck-white';
        const sourceEl = document.getElementById(sourceId);
        
        if (sourceEl) {
          const sRect = sourceEl.getBoundingClientRect();
          flyStartRect.value = {
            top: sRect.top, left: sRect.left, width: sRect.width, height: sRect.height
          };
        } else {
          // 덱 엘리먼트가 없으면 화면 중앙에서 시작
          const w = 50; const h = 75;
          flyStartRect.value = {
            top: window.innerHeight / 2 - h / 2,
            left: window.innerWidth / 2 - w / 2,
            width: w, height: h
          };
        }
        flyColor.value = newCard.color;
      }

      // 타겟 카드 찾기 (DOM 업데이트 대기)
      setTimeout(() => {
        let visualIndex = newCardIndex;
        if (seatMap.value[p.sid] === 'top') {
          visualIndex = p.hand.length - 1 - newCardIndex;
        }

        const targetId = `player-${p.id}-tile-${visualIndex}`;
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
          const tRect = targetEl.getBoundingClientRect();
          flyEndRect.value = {
            top: tRect.top, left: tRect.left, width: tRect.width, height: tRect.height
          };
          isFlying.value = true;
          
          // 잠시 숨기기
          targetEl.style.opacity = "0";
        }
      }, 100);
    }
  });
}

function handleFlyComplete() {
  isFlying.value = false;
  flyStartRect.value = null;
  flyEndRect.value = null;
  
  // 모든 플레이어의 숨겨진 카드 복구 (단순화: 모든 타일 opacity 1로 강제하거나, 특정 타일만 복구)
  // 여기서는 전체 복구보다는, 방금 애니메이션 된 타일을 찾아야 하는데...
  // 간단히 class로 제어하거나, 다시 DOM 탐색. 
  // 가장 쉬운 방법: 모든 .tile의 opacity를 1로 리셋하는 CSS class를 toggle하거나,
  // handleStateUpdate에서 저장해둔 타겟 ID를 ref로 저장해두고 복구.
  
  // 여기서는 간단히: "모든 타일은 기본적으로 opacity 1"이므로, 
  // 인라인 스타일을 제거해주면 됨.
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach((el) => (el as HTMLElement).style.opacity = '');
}

function handleTurnPhaseStart(data: any) {
  phase.value = data.phase;
  maxTime.value = data.timer || 20;
  startLocalTimer(maxTime.value);
  cancelSelection();
  showResultModal.value = false;
  currentGuessInfo.value = null;
}

function handleGuessResult(data: any) {
  isWaitingForResult.value = false;
  guessResult.value = { correct: data.correct, value: data.value };
  showResultModal.value = true;
  setTimeout(() => {
    showResultModal.value = false;
    guessResult.value = null;
    currentGuessInfo.value = null;
  }, 2500);
}

function handleGuessAttempt(data: any) {
  // 🔥 [수정] 알림 UI 제거로 인해 로직 삭제
  if (data.guesserId === me.value?.id) return;
  // const guesserPlayer = orderedPlayers.value.find(p => p.id === data.guesserId);
  // const targetPlayer = orderedPlayers.value.find(p => p.id === data.targetId);
  // currentGuessInfo.value = { ... };
}

type Side = "top" | "left" | "right" | "bottom";

// 2️⃣ 반복문용 배열을 'as const'로 정의 (타입 고정)
const sideList = ["top", "left", "right"] as const;

// ... (기존 코드) ...

// 3️⃣ seatMap의 반환 타입도 명시적으로 변경 (권장)
const seatMap = computed(() => {
  if (!me.value || players.value.length === 0) return {};
  const others = players.value.filter(p => p.sid !== mySid.value);
  const count = others.length;
  
  // Record<string, string> -> Record<string, Side> 로 변경
  const seats: Record<string, Side> = { [me.value.sid]: "bottom" };
  
  if (count === 1) { seats[others[0].sid] = "top"; }
  else if (count === 2) { seats[others[0].sid] = "left"; seats[others[1].sid] = "right"; }
  else if (count === 3) { seats[others[0].sid] = "top"; seats[others[1].sid] = "left"; seats[others[2].sid] = "right"; }
  return seats;
});

function handleTileSelected(data: { targetId: number; index: number }) {
  if (!isMyTurn.value || (phase.value !== 'GUESSING' && phase.value !== 'POST_SUCCESS_GUESS')) return;
  selectedTarget.value = data;
}

function cancelSelection() { selectedTarget.value = null; }

function selectGuessValue(value: number | 'joker') {
  if (!selectedTarget.value) return;
  const guessValue = (value === 'joker') ? 12 : value; 
  const targetPlayer = orderedPlayers.value.find(p => p.id === selectedTarget.value!.targetId);
  currentGuessInfo.value = {
    guesserName: me.value!.name,
    targetName: targetPlayer?.name || '대상',
    targetTileIndex: selectedTarget.value!.index,
    guessValue: (value === 'joker') ? '★' : value, 
  };
  sendGuess(guessValue); 
  selectedTarget.value = null; 
}

function sendGuess(value: number | 'joker') {
  if (!selectedTarget.value) return;
  isWaitingForResult.value = true;
  socket.emit("guess_value", {
    roomId,
    targetId: selectedTarget.value.targetId,
    index: selectedTarget.value.index,
    value: value,
  });
}

function handlePlaceJoker(index: number) {
  if (phase.value !== 'PLACE_JOKER') return;
  socket.emit("place_joker", {
    roomId,
    index
  });
}

function handleStartGuessAnimation(data: any) {
  // data: { guesser_id, target_id, index, value, correct }
  
  // 🔥 [수정] 애니메이션 시작 시 대기 상태 해제 (로딩 UI 제거)
  isWaitingForResult.value = false;

  // 1. 타겟 카드의 DOM 요소 찾기 (PlayerCard에서 ID를 설정해뒀으므로 찾을 수 있음)
  // 🔥 [수정] Top 포지션은 카드가 역순으로 렌더링되므로, 인덱스를 변환해야 함
  let visualIndex = data.index;
  const targetPlayer = players.value.find(p => p.id === data.target_id);
  
  if (targetPlayer && seatMap.value[targetPlayer.sid] === 'top') {
    visualIndex = targetPlayer.hand.length - 1 - data.index;
  }

  const elementId = `player-${data.target_id}-tile-${visualIndex}`;
  const el = document.getElementById(elementId);

  if (el) {
    const rect = el.getBoundingClientRect();
    animTargetRect.value = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  // 2. 애니메이션 데이터 설정
  animIsCorrect.value = data.correct;
  animGuessedValue.value = data.value; // 🔥 [추가]
  currentAnimData.value = { 
    roomId: roomId, // route에서 가져온 값
    guesserUid: data.guesser_id, // (주의: 서버가 보내주는 데이터에 맞춰 수정 필요, uid가 아니라 id일수도 있음)
    correct: data.correct
  };

  // 3. 오버레이 활성화 -> 타이머 등 다른 UI 가려짐
  isAnimating.value = true;
}

// ② 오버레이가 "애니메이션 끝났어"라고 알려옴
function handleAnimationComplete() {
  isAnimating.value = false;
  animTargetRect.value = null;

  // 4. 서버에 "완료" 신호 전송
  if (currentAnimData.value) {
    // 서버 game_events.py의 on_animation_done가 받을 데이터 형식 확인
    socket.emit("game:animation_done", {
      roomId: roomId,
      guesserUid: players.value.find(p => p.id === currentAnimData.value.guesserUid)?.uid, // ID -> UID 변환 필요 시
      correct: currentAnimData.value.correct
    });
  }
}

// --- 4. 연속 추리 (Continue Guessing) ---
function handlePromptContinue(data: any) {
  console.log("연속 추리 기회!", data);
  // 기존 타이머 재시작 로직은 유지하되, 오버레이를 띄움
  startLocalTimer(data.timer || 60);
  
  continueTimer.value = data.timer || 60; 
  showContinueOverlay.value = true;
}

function handleContinueGuess() {
  showContinueOverlay.value = false; 
  // 아무것도 안 해도 됨 (이미 GUESSING/POST_SUCCESS_GUESS 상태임)
  // 다만 UX적으로 "추리를 계속하세요" 같은 토스트를 띄워줄 수도 있음
}

function handlePassTurn() {
  showContinueOverlay.value = false; 
  socket.emit("stop_guessing", { roomId: roomId });
}


onMounted(() => {
  mySid.value = socket.id ?? null;
  socket.on("state_update", handleStateUpdate);
  socket.on("game:turn_phase_start", handleTurnPhaseStart);
  socket.on("game:guess_result", handleGuessResult);
  socket.on("game:guess_attempt", handleGuessAttempt);
  socket.on("game_over", (d) => { alert(`게임 종료! 승자: ${d.winner.name}`); router.push("/davinci-home"); });
  socket.on("game:start_guess_animation", handleStartGuessAnimation);
  socket.on("game:prompt_continue", handlePromptContinue); // 🔥 [추가]
});

onUnmounted(() => {
  socket.off("state_update"); socket.off("game:turn_phase_start");
  socket.off("game:guess_result"); socket.off("game:guess_attempt");
  if (timerInterval) clearInterval(timerInterval);
  socket.off("game:start_guess_animation");
  socket.off("game:prompt_continue"); // 🔥 [추가]
});
</script>

<style scoped>
.game-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 2fr 1fr;
  height: 100vh;
  width: 100vw;
  position: relative;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.top-player {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding-bottom: 40px;
  z-index: 10;
}

.my-hand {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  padding: 20px 40px;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 30px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 20;
}

.my-hand .tile {
  pointer-events: auto;
}

.left-hand {
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.right-hand {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.center-area {
  grid-area: 2 / 2;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* Table Glow Effect */
.center-area::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(66, 133, 244, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.deck-piles {
  position: absolute;
  top: 65%; /* 🔥 [수정] 타이머와 겹치지 않도록 아래로 이동 */
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 20px;
  z-index: 5;
}

.deck {
  width: 50px;
  height: 75px;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  position: relative;
}

.deck::before {
  content: '';
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  z-index: -1;
}

/* 카드 쌓인 느낌 (가상 요소) */
.deck::after {
  content: '';
  position: absolute;
  top: -4px; left: 2px; width: 100%; height: 100%;
  border-radius: 6px;
  background: inherit;
  z-index: -2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.deck.black {
  background: #1a1a1a;
  border: 1px solid #444;
  color: #ffd700;
}

.deck.white {
  background: #f0f0f0;
  border: 1px solid #ccc;
  color: #333;
}

.deck-count {
  font-weight: bold;
  font-size: 1.2rem;
  z-index: 2;
}

.deck-label {
  position: absolute;
  top: 5px;
  font-size: 0.6rem;
  opacity: 0.7;
  letter-spacing: 1px;
}
</style>