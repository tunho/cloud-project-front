<template>
  <div class="game-container">
    <UserProfile />
    <!-- 1. 게임 초기화 전 로딩 화면 -->
    <div v-if="phase === 'INIT'" class="loading-screen">
      <div class="spinner"></div>
      <p>게임 준비 중...</p>
    </div>
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
            @show-info="showPlayerInfo"
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
        :currentPlayerName="orderedPlayers[currentTurn]?.nickname || orderedPlayers[currentTurn]?.name"
        :isMyTurn="isMyTurn"
      />

      <!-- 🔥 [삭제] 중앙 덱 (사용자 요청으로 제거, 애니메이션은 화면 중앙 좌표 사용) -->

      
    </div>

    <div v-if="me && seatMap[me.sid] === 'bottom'">
      <div class="deck-piles">
      <div id="deck-black" class="deck black">
        <span class="deck-count">{{ piles.black }}</span>
        <span class="deck-label">BLACK</span>
      </div>
      <div id="deck-white" class="deck white">
        <span class="deck-count">{{ piles.white }}</span>
        <span class="deck-label">WHITE</span>
      </div>
    </div>
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
          @show-info="showPlayerInfo"
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
      :cards="flyingCards"
      @animation-complete="handleFlyComplete"
    />

    <GameOverModal
      :isVisible="showGameOverModal"
      :myResult="myPayoutResult"
      @close="handleGameOverClose"
    />

    <!-- 🔥 [NEW] Player Info Modal - Teleport로 body로 이동 -->
    <Teleport to="body">
      <PlayerInfoModal
        :isOpen="showPlayerInfoModal"
        :player="selectedPlayerInfo"
        @close="closePlayerInfo"
      />
    </Teleport>

    <!-- 🔥 [추가] 나가기 버튼 -->
    <button class="exit-btn" @click="handleExitRoom">
      <span class="icon">🚪</span> 나가기
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
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
import FlyingCardOverlay from "../components/game/FlyingCardOverlay.vue";
import GameOverModal from "../components/game/GameOverModal.vue";
import PlayerInfoModal from "../components/game/PlayerInfoModal.vue";  // 🔥 [NEW]
import UserProfile from "../components/UserProfile.vue"; // 🔥 Import


const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId as string;
const maxTime = ref(20);

const isAnimating = ref(false);
const animIsCorrect = ref(false);
const animGuessedValue = ref<number | string | null>(null);
const animTargetRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const currentAnimData = ref<any>(null);

const showContinueOverlay = ref(false);
const continueTimer = ref(0);



// 🔥 [추가] 게임 종료 모달 상태
const showGameOverModal = ref(false);
const myPayoutResult = ref<any>(null);  // 🔥 [FIXED] Restored myPayoutResult
const isExiting = ref(false); // 🔥 [추가] 종료 진행 중 플래그

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
const piles = ref({ black: 0, white: 0 });
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

// 🔥 [NEW] Player Info Modal State
const showPlayerInfoModal = ref(false);
const selectedPlayerInfo = ref<any | null>(null);

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
    if (target) {
      // 🔥 [수정] 직접 애니메이션 상태를 건드리지 않고, 서버 응답(state_update)에서 처리하도록 함
      // 다만, 클릭한 위치(startRect)를 어딘가에 저장해두고 싶다면 별도 상태로 관리 가능하지만,
      // 현재 로직(deck ID 기반)이 더 안정적이므로 여기서는 아무것도 안 해도 됨.
    }
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
  
  // 🔥 [DEBUG] 플레이어 데이터 확인
  console.log("=== 🔄 State Update Debug ===");
  players.value.forEach(p => {
    console.log(`Player [${p.nickname || p.name}]: major=${p.major}, year=${p.year}, money=${p.money}`);
  });

  // 🔥 [수정] 턴 동기화 로직 개선 (UID 기반)
  if (data.currentTurnUid) {
    // 서버가 보내준 UID와 일치하는 플레이어를 찾음
    const turnPlayer = players.value.find(p => p.uid === data.currentTurnUid);
    if (turnPlayer) {
      currentTurn.value = turnPlayer.id;
    } else {
      currentTurn.value = data.currentTurn ?? 0;
    }
  } else {
    currentTurn.value = data.currentTurn ?? 0;
  }

  if (data.phase) phase.value = data.phase;
  drawnTile.value = data.drawnTile || null;
  piles.value = data.piles || { black: 0, white: 0 };

  // 🔥 [FIX] 서버 시간과 동기화
  if (data.remainingTime !== undefined && data.remainingTime > 0) {
    // 오차 보정 (네트워크 딜레이 고려하여 약간 여유 둠)
    const serverTime = Math.floor(data.remainingTime);
    if (Math.abs(timeLeft.value - serverTime) > 2) { // 2초 이상 차이나면 동기화
      console.log(`⏰ Timer Sync: Local(${timeLeft.value}) -> Server(${serverTime})`);
      startLocalTimer(serverTime);
    }
  }

  // 3. 변경 감지 및 애니메이션 트리거
  players.value.forEach(p => {
    const oldLen = oldHandLengths.get(p.id) || 0;
    const newLen = p.hand.length;
    
    if (newLen > oldLen) {
      // 🔥 [수정] 여러 장이 추가된 경우 순차적으로 애니메이션 (초기 4장 배분 등)
      const addedCount = newLen - oldLen;
      
      for (let i = 0; i < addedCount; i++) {
        // 추가된 카드의 인덱스 (뒤에서부터 i번째)
        const cardIndex = oldLen + i;
        const newCard = p.hand[cardIndex];
        
        // 각 카드마다 딜레이를 줌 (200ms - 천천히)
        setTimeout(() => {
          triggerCardAnimation(p, newCard, cardIndex);
        }, i * 200); // 🔥 [FIX] Slower animation trigger
      }
    }
  });
}

// 🔥 [수정] 다중 카드 애니메이션 상태 관리
interface FlyingCardItem {
  id: string;
  startRect: { top: number; left: number; width: number; height: number };
  endRect: { top: number; left: number; width: number; height: number };
  color: "black" | "white";
  targetDomId: string;
}
const flyingCards = ref<FlyingCardItem[]>([]);

function triggerCardAnimation(p: any, newCard: any, newCardIndex: number) {
  // 소스 덱 찾기 (없으면 화면 중앙)
  const sourceId = newCard.color === 'black' ? 'deck-black' : 'deck-white';
  const sourceEl = document.getElementById(sourceId);
  
  let startRect = { top: window.innerHeight / 2 - 37.5, left: window.innerWidth / 2 - 25, width: 50, height: 75 };

  if (sourceEl) {
    const sRect = sourceEl.getBoundingClientRect();
    startRect = {
      top: sRect.top, left: sRect.left, width: sRect.width, height: sRect.height
    };
  }

  // 타겟 카드 찾기 (DOM 업데이트 대기)
  setTimeout(() => {
    let visualIndex = newCardIndex;
    // Top과 Right만 역순 처리
    if (seatMap.value[p.sid] === 'top' || seatMap.value[p.sid] === 'right') {
      visualIndex = p.hand.length - 1 - newCardIndex;
    }

    const targetId = `player-${p.id}-tile-${visualIndex}`;
    const targetEl = document.getElementById(targetId);

    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      
      // 새 애니메이션 항목 추가
      const animId = `fly-${Date.now()}-${Math.random()}`;
      flyingCards.value.push({
        id: animId,
        startRect,
        endRect: {
          top: tRect.top, left: tRect.left, width: tRect.width, height: tRect.height
        },
        color: newCard.color,
        targetDomId: targetId
      });
      
      // 잠시 숨기기
      targetEl.style.opacity = "0";
    }
  }, 50); // DOM 렌더링 대기
}

function handleFlyComplete(animId: string) {
  // 해당 애니메이션 항목 찾기
  const index = flyingCards.value.findIndex(c => c.id === animId);
  if (index !== -1) {
    const card = flyingCards.value[index];
    if (!card) return; // 🔥 [FIX] Safety check

    // 타겟 요소 보이기
    const el = document.getElementById(card.targetDomId);
    if (el) el.style.opacity = '';
    
    // 리스트에서 제거
    flyingCards.value.splice(index, 1);
  }
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
  if (data.guesserId === me.value?.id) return;
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
  animGuessedValue.value = data.value;
  currentAnimData.value = { 
    roomId: roomId,
    guesserUid: data.guesser_id,  // 🔥 [FIXED] 서버에서 보내는 guesser_id는 이미 UID임
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
    // 🔥 [FIXED] guesserUid는 이미 currentAnimData에 UID로 저장되어 있음
    socket.emit("game:animation_done", {
      roomId: roomId,
      guesserUid: currentAnimData.value.guesserUid,  // 이미 UID임
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

// 🔥 [NEW] Player Info Functions
function showPlayerInfo(player: any) {
  console.log("=== 👁️ showPlayerInfo DEBUG ===");
  console.log("1. Received player:", player);
  console.log("2. Player is truthy?", !!player);
  console.log("3. Modal state BEFORE:", showPlayerInfoModal.value);
  console.log("4. Selected player BEFORE:", selectedPlayerInfo.value);
  console.log("5. PlayerInfoModal in DOM?", document.querySelector('.player-info-modal-overlay'));
  
  selectedPlayerInfo.value = player;
  showPlayerInfoModal.value = true;
  
  console.log("6. Modal state AFTER:", showPlayerInfoModal.value);
  console.log("7. Selected player AFTER:", selectedPlayerInfo.value);
  
  // Force Vue to update and check DOM
  setTimeout(() => {
    const modalEl = document.querySelector('.player-info-modal-overlay');
    console.log("8. DOM check after nextTick:", modalEl);
    if (modalEl) {
      console.log("   - Modal display:", window.getComputedStyle(modalEl).display);
      console.log("   - Modal visibility:", window.getComputedStyle(modalEl).visibility);
      console.log("   - Modal opacity:", window.getComputedStyle(modalEl).opacity);
      console.log("   - Modal z-index:", window.getComputedStyle(modalEl).zIndex);
    } else {
      console.error("   ❌ Modal element NOT found in DOM!");
    }
  }, 100);
}

function closePlayerInfo() {
  showPlayerInfoModal.value = false;
  selectedPlayerInfo.value = null;
}

// 🔥 [추가] 게임 정산 결과 핸들링
function handlePayoutResult(results: any[]) {
  if (!me.value) return;
  const myData = results.find(r => r.uid === me.value.uid);
  if (myData) {
    myPayoutResult.value = myData;
    showGameOverModal.value = true;
  }
}

function handleGameOverClose() {
  // 모달에서 '로비로 돌아가기' 클릭 시
  isExiting.value = false; // 플래그 해제하여 이동 허용
  router.replace("/platform"); // 🔥 플랫폼 화면으로 이동
}

// 🔥 [수정] 나가기 버튼 핸들러 (라우터 가드와 로직 공유)
function handleExitRoom() {
  // router.push를 호출하면 onBeforeRouteLeave가 트리거됨
  router.replace("/platform"); // 🔥 플랫폼 화면으로 이동
}

// 🔥 [추가] 라우터 가드 (뒤로가기 및 나가기 버튼 공통 처리)
onBeforeRouteLeave((to, from, next) => {
  // 1. 이미 종료 모달이 떠있거나, 게임이 끝난 상태라면 바로 이동
  if (!isExiting.value && showGameOverModal.value) {
    next();
    return;
  }

  // 2. 게임 진행 중이 아니라면 바로 이동 (예: 로딩 중 등)
  if (phase.value === 'INIT' || phase.value === 'GAME_OVER') {
    next();
    return;
  }

  // 3. 사용자 확인
  if (confirm("정말 나가시겠습니까? 게임이 진행 중이라면 패배 처리되며 베팅 금액을 잃습니다.")) {
    // 4. 서버에 나가기 요청
    socket.emit("leave_game", { roomId });
    
    // 5. 이동 취소 (모달을 띄워야 하므로)
    isExiting.value = true;
    next(false);
    
    // 6. 서버로부터 game:payout_result가 오면 모달이 뜸 -> 모달 닫기 버튼으로 다시 이동 시도
  } else {
    // 취소 시 이동 안 함
    next(false);
  }
});


onMounted(() => {
  mySid.value = socket.id ?? null;
  socket.on("state_update", handleStateUpdate);
  socket.on("game:turn_phase_start", handleTurnPhaseStart);
  socket.on("game:guess_result", handleGuessResult);
  socket.on("game:guess_attempt", handleGuessAttempt);
  
  socket.on("game:payout_result", handlePayoutResult);

  socket.on("game:start_guess_animation", handleStartGuessAnimation);
  socket.on("game:prompt_continue", handlePromptContinue);
  
  socket.on("game:player_eliminated", (data) => {
    console.log("💀 Player Eliminated:", data);
    socket.emit("request_game_state", { roomId });
  });
});

// 🔥 [FIX] Move logic to a separate async function or use the existing imports
import { auth, db } from "../firebase"; // Ensure this is imported at top
import { doc, getDoc } from "firebase/firestore";

// ... (existing imports)

onMounted(async () => {
  mySid.value = socket.id ?? null;
  
  // ... (socket listeners) ...
  socket.on("state_update", handleStateUpdate);
  socket.on("game:turn_phase_start", handleTurnPhaseStart);
  socket.on("game:guess_result", handleGuessResult);
  socket.on("game:guess_attempt", handleGuessAttempt);
  socket.on("game:payout_result", handlePayoutResult);
  socket.on("game:start_guess_animation", handleStartGuessAnimation);
  socket.on("game:prompt_continue", handlePromptContinue);
  socket.on("game:player_eliminated", (data) => {
    socket.emit("request_game_state", { roomId });
  });

  // 🔥 [FIX] Re-join room logic
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Load user info to send to server (important for reconnect)
      let nickname = user.displayName || "Guest";
      let major = "";
      let year = 0;
      let money = 0;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          nickname = d.nickname || nickname;
          major = d.major || "";
          year = d.year || 0;
          money = d.money || 0;
        }
      } catch (e) {
        console.error("Failed to load profile for reconnect:", e);
      }

      console.log("🔄 Re-entering room:", roomId);
      socket.emit("enter_room", {
        roomId,
        uid: user.uid,
        nickname,
        major,
        year,
        money
      });
    }
  });

  onUnmounted(() => {
    unsubscribe();
  });
});

onUnmounted(() => {
  socket.off("state_update"); socket.off("game:turn_phase_start");
  socket.off("game:guess_result"); socket.off("game:guess_attempt");
  socket.off("game:player_eliminated"); // 🔥 리스너 해제
  if (timerInterval) clearInterval(timerInterval);
  socket.off("game:start_guess_animation");
  socket.off("game:prompt_continue");
  socket.off("game:payout_result"); // 🔥 [추가]
  
  // 🔥 [NEW] 리스너 해제
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

// 🔥 [NEW] 새로고침/닫기 방지 경고
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (phase.value !== 'INIT' && phase.value !== 'GAME_OVER') {
    e.preventDefault();
    e.returnValue = ''; // Chrome requires returnValue to be set
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
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

/* 🔥 [수정] Left/Right Zone - 벽에 붙이기 */
.left-zone {
  position: absolute;
  left: 30px;  /* 벽과의 거리 (top: 20px, bottom: 30px와 유사) */
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.right-zone {
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
  opacity: 0; /* 🔥 [수정] 화면에서 숨김 */
  pointer-events: none; /* 클릭 방지 */
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

/* 🔥 [추가] 나가기 버튼 스타일 */
.exit-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  z-index: 100;
}

.exit-btn:hover {
  background: rgba(255, 71, 87, 0.2);
  border-color: rgba(255, 71, 87, 0.5);
  transform: translateY(-2px);
}

.exit-btn .icon {
  font-size: 1.2rem;
}
</style>