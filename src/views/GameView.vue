<template>
  <div class="game-container">
    
    <template v-for="p in players" :key="'top-' + p.sid">
      <div v-if="seatMap[p.sid] === 'top'">
        <div class="top-player">
          <PlayerCard
            :player="p"
            :isMe="false"
            :active="p.id === currentTurn"
            :phase="phase"
            side="top"
            :isMyTurn="isMyTurn"
            :selectedTarget="selectedTarget"
            @select-tile="handleTileSelected"
          />
        </div>
      </div>
    </template>

    <template v-for="p in players" :key="'left-' + p.sid">
      <div v-if="seatMap[p.sid] === 'left'" class="left-zone">
        <div class="left-hand">
          <PlayerCard
            :player="p"
            :isMe="false"
            :active="p.id === currentTurn"
            :phase="phase"
            side="left"
            :isMyTurn="isMyTurn"
            :selectedTarget="selectedTarget"
            @select-tile="handleTileSelected"
          />
        </div>
      </div>
    </template>

    <template v-for="p in players" :key="'right-' + p.sid">
      <div v-if="seatMap[p.sid] === 'right'" class="right-zone">
        <div class="right-hand">
          <PlayerCard
            :player="p"
            :isMe="false"
            :active="p.id === currentTurn"
            :phase="phase"
            side="right"
            :isMyTurn="isMyTurn"
            :selectedTarget="selectedTarget"
            @select-tile="handleTileSelected"
          />
        </div>
      </div>
    </template>

    <div class="center-area">

      <div v-if="isGuessingUIOpen" class="guess-overlay" @click="cancelSelection">
        <div class="guess-wheel" @click.stop>
          
          <div class="center-cancel-button" @click="cancelSelection">
            X
          </div>
          
          <div v-for="i in 13" 
            class="guess-option" 
            :key="i"
            :style="{ '--i': i }"
            @click="selectGuessValue(i === 13 ? 'joker' : i - 1)"
          >
            {{ i === 13 ? '★' : i - 1 }}
          </div>

        </div>
      </div>

      <div v-if="isMyTurn && phase === 'DRAWING'" class="draw-select">
        <div class="big-card black" @click="pickColor('black')">
          <div class="label">검은 타일</div>
        </div>
        <div class="big-card white" @click="pickColor('white')">
          <div class="label black-text">흰색 타일</div>
        </div>
      </div>

      <div v-else-if="!isGuessingUIOpen" class="turn-circle" :style="circleStyle">
        <div class="player-text">
          {{ orderedPlayers[currentTurn]?.name }} 턴
          <span v-if="orderedPlayers[currentTurn]?.sid === mySid">(나)</span>
        </div>
      </div>
      
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

  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { socket } from "../socket";
import PlayerCard from "../components/PlayerCard.vue";

const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId as string;
const maxTime = ref(20);

// -----------------------------
// 상태값
// -----------------------------
const players = ref<any[]>([]);
const currentTurn = ref(0);
const piles = ref({ black: 0, white: 0 });
const drawnTile = ref(null);
const phase = ref("INIT");
const timeLeft = ref(0);
let timerInterval: number | null = null;
const mySid = ref<string | null>(null);

// 🔥 추리 타겟 상태
const selectedTarget = ref<{ targetId: number; index: number } | null>(null);

// -----------------------------
// 계산 속성
// -----------------------------
const orderedPlayers = computed(() =>
  [...players.value].sort((a, b) => a.id - b.id)
);

const me = computed(() =>
  players.value.find((p) => p.sid === mySid.value) || null
);

const isMyTurn = computed(() => {
  if (!me.value) return false;
  return me.value.id === currentTurn.value;
});

const isGuessingUIOpen = computed(() => {
    return !!selectedTarget.value; // selectedTarget이 null이 아닐 때 UI 표시
});

// 원형 타이머 스타일
const circleStyle = computed(() => {
  const percent = 1 - timeLeft.value / maxTime.value;
  const deg = percent * 360;
  return { "--timer-angle": `${deg}deg` };
});

// -----------------------------
// 타이머
// -----------------------------
function startLocalTimer(sec: number) {
  timeLeft.value = sec;
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = window.setInterval(() => {
    timeLeft.value -= 1;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval!);
      timerInterval = null;
    }
  }, 1000);
}

// -----------------------------
// DRAWING 단계: 색상 선택
// -----------------------------
function pickColor(color: "black" | "white") {
  if (!isMyTurn.value) return;
  socket.emit("draw_tile", { roomId, color });
}

// -----------------------------
// 소켓 이벤트 핸들러
// -----------------------------
function handleStateUpdate(data: any) {
  players.value = data.players || [];
  piles.value = data.piles || { black: 0, white: 0 };
  drawnTile.value = data.drawnTile ?? null;
  currentTurn.value = data.currentTurn ?? 0;
  if (data.phase) phase.value = data.phase;
  console.log("STATE_UPDATE:", JSON.stringify(data.players, null, 2));
}

function handleTurnPhaseStart(data: any) {
  phase.value = data.phase;
  maxTime.value = data.timer || 20;
  startLocalTimer(maxTime.value);
  
  // 턴이 바뀌면 선택 상태 초기화
  cancelSelection();
}

const seatMap = computed(() => {
  if (!me.value || players.value.length === 0) return {};
  const others = players.value.filter(p => p.sid !== mySid.value);
  const count = others.length;
  const seats: Record<string, string> = {}; 
  seats[me.value.sid] = "bottom";

  if (count === 1) {
    seats[others[0].sid] = "top";
  } else if (count === 2) {
    seats[others[0].sid] = "left";
    seats[others[1].sid] = "right";
  } else if (count === 3) {
    seats[others[0].sid] = "top";
    seats[others[1].sid] = "left";
    seats[others[2].sid] = "right";
  }
  return seats;
});

// -----------------------------
// 예측 (Guessing) 로직
// -----------------------------

// 1. PlayerCard에서 타일 클릭 시 호출됨
function handleTileSelected(data: { targetId: number; index: number }) {
  // 내 턴이고 추리 페이즈일 때만 선택 가능
  if (!isMyTurn.value || phase.value !== 'GUESSING') return;

  selectedTarget.value = data;
}

// 2. 오버레이 닫기 / 선택 취소
function cancelSelection() {
  selectedTarget.value = null;
}

// 3. 원형 휠에서 숫자 선택 시 호출됨
function selectGuessValue(value: number | 'joker') {
  if (!selectedTarget.value) return;

  // 조커는 12로 처리 (서버 로직에 맞춤)
  const guessValue = (value === 'joker') ? 12 : value; 

  sendGuess(guessValue); 
  selectedTarget.value = null; // UI 닫기
}

// 4. 서버로 추리 요청 전송
function sendGuess(value: number | 'joker') {
  if (!selectedTarget.value) return;

  socket.emit("guess_value", {
    roomId: roomId,
    targetId: selectedTarget.value.targetId,
    index: selectedTarget.value.index,
    value: value,
  });
}

// -----------------------------
// 라이프사이클
// -----------------------------
onMounted(() => {
  mySid.value = socket.id ?? null;
  socket.on("state_update", handleStateUpdate);
  socket.on("game:turn_phase_start", handleTurnPhaseStart);
  socket.on("game_over", (d) => {
    alert(`게임 종료! 승자: ${d.winner.name}`);
    router.push("/davinci-home");
  });
});

onUnmounted(() => {
  socket.off("state_update", handleStateUpdate);
  socket.off("game:turn_phase_start", handleTurnPhaseStart);
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
:root {
  --card-gap: 16px;
  --card-width: 70px;
  --card-height: 95px;
}

.game-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 2fr 1fr;
  height: 100vh;
  width: 100vw;
  position: relative;
}

/* ----------------------------------
   플레이어 위치 스타일
---------------------------------- */
.top-player {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  /* 🔥 Top 플레이어 화살표 잘림 방지 */
  padding-bottom: 130px; 
}

.my-hand {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  padding: 10px 0;
  pointer-events: none; 
}
.my-hand .tile { pointer-events: auto; }

.left-hand {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
}

.right-hand {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
}

.center-area {
  grid-area: 2 / 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ----------------------------------
   드로우 UI
---------------------------------- */
.draw-select { display: flex; gap: 40px; }
.big-card {
  width: 180px; height: 260px;
  border-radius: 14px; border: 3px solid #444;
  display: flex; justify-content: center; align-items: center;
  font-size: 26px; font-weight: 800; cursor: pointer;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
  transition: transform 0.15s, box-shadow 0.15s;
}
.big-card:hover { transform: translateY(-8px); box-shadow: 0 12px 26px rgba(0,0,0,0.35); }
.big-card.black { background: #111; color: white; }
.big-card.white { background: #fafafa; color: #333; }
.black-text { color: #111; }

/* ----------------------------------
   턴 타이머
---------------------------------- */
.turn-circle {
  width: 240px; height: 240px;
  border-radius: 50%;
  background: conic-gradient(#4caf50 var(--timer-angle), #ddd 0deg);
  display: flex; justify-content: center; align-items: center;
  transition: background 0.3s linear;
}
.player-text { font-size: 28px; font-weight: 800; color: #222; text-align: center; }

/* ----------------------------------
   추리 오버레이 (원형 UI)
---------------------------------- */
.guess-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 100;
}

.guess-wheel {
  width: 300px; height: 300px;
  position: relative;
  display: flex; justify-content: center; align-items: center;
}

.center-cancel-button {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: #f44336; color: white;
  display: flex; justify-content: center; align-items: center;
  font-size: 30px; font-weight: bold; cursor: pointer;
  z-index: 102;
}

.guess-option {
  --radius: 140px;
  --count: 13;
  
  position: absolute;
  width: 50px; height: 50px;
  border-radius: 50%;
  background: #fff; border: 2px solid #555;
  display: flex; justify-content: center; align-items: center;
  font-weight: bold; cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 101;

  transform: rotate(calc(var(--i) * (360deg / var(--count)))) 
             translateY(var(--radius))
             rotate(calc(var(--i) * (-360deg / var(--count))));
}
.guess-option:hover {
  background: #ffe082;
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.5);
}
</style>