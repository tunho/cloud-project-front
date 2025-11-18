<template>
  <div class="game-container">
    <!-- 좌상단 -->
    <div class="corner top-left" v-if="orderedPlayers[0]">
      <PlayerCard
        :player="orderedPlayers[0]"
        :active="orderedPlayers[0].id === currentTurn"
        :isMe="!!(mySid && orderedPlayers[0].sid === mySid)"
        side="left"
      />
    </div>

    <!-- 우상단 -->
    <div class="corner top-right" v-if="orderedPlayers[1]">
      <PlayerCard
        :player="orderedPlayers[1]"
        :active="orderedPlayers[1].id === currentTurn"
        :isMe="!!(mySid && orderedPlayers[1].sid === mySid)"
        side="right"
      />
    </div>

    <!-- 중앙 - 원형 타이머 -->
    <div class="center-area">
      <div class="turn-circle" :style="circleStyle">
        <div class="inner-circle">
          <div class="player-text">
            {{ orderedPlayers[currentTurn]?.name || "대기 중" }} 턴
            <span v-if="orderedPlayers[currentTurn]?.sid === mySid">(나)</span>
          </div>
          <div class="timer-text" v-if="timeLeft > 0">
            {{ Math.max(0, Math.ceil(timeLeft)) }}초
          </div>
        </div>
      </div>
    </div>

    <!-- 좌하단 -->
    <div class="corner bottom-left" v-if="orderedPlayers[3]">
      <PlayerCard
        :player="orderedPlayers[3]"
        :active="orderedPlayers[3].id === currentTurn"
        :isMe="!!(mySid && orderedPlayers[3].sid === mySid)"
        side="left"
      />
    </div>

    <!-- 우하단 -->
    <div class="corner bottom-right" v-if="orderedPlayers[2]">
      <PlayerCard
        :player="orderedPlayers[2]"
        :active="orderedPlayers[2].id === currentTurn"
        :isMe="!!(mySid && orderedPlayers[2].sid === mySid)"
        side="right"
      />
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

type TurnPhase =
  | "INIT"
  | "DRAWING"
  | "PLACE_JOKER"
  | "GUESSING"
  | "POST_SUCCESS_GUESS";

const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId as string;

// -----------------------------
// 상태값
// -----------------------------
const players = ref<any[]>([]);
const currentTurn = ref(0);
const piles = ref<{ black: number; white: number }>({ black: 0, white: 0 });
const drawnTile = ref<any | null>(null);
const phase = ref<TurnPhase>("INIT");
const availablePiles = ref<string[]>([]);
const timeLeft = ref(0);
let timerInterval: number | null = null;

// 🔥 socket.id 는 나중에 들어올 수 있으므로 string | null
const mySid = ref<string | null>(null);

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

// 🔥 원형 타이머 각도: timeLeft가 줄어들수록 초록색이 원을 채움
const MAX_TIME = 30; // 서버 TURN_TIMER_SECONDS랑 맞춰두기
const circleStyle = computed(() => {
  const ratio = Math.min(1, Math.max(0, 1 - timeLeft.value / MAX_TIME)); // 0~1
  const deg = ratio * 360;
  return {
    "--timer-angle": `${deg}deg`,
  } as Record<string, string>;
});

// -----------------------------
// 타이머
// -----------------------------
function startLocalTimer(sec: number) {
  timeLeft.value = sec;

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  timerInterval = window.setInterval(() => {
    timeLeft.value -= 1;
    if (timeLeft.value <= 0 && timerInterval !== null) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }, 1000);
}

// -----------------------------
// 소켓 이벤트 핸들러
// -----------------------------
function handleStateUpdate(data: any) {
  players.value = data.players || [];
  currentTurn.value = data.currentTurn ?? 0;
  piles.value = data.piles || { black: 0, white: 0 };
  drawnTile.value = data.drawnTile || null;
}

function handleTurnPhaseStart(data: any) {
  phase.value = data.phase as TurnPhase;
  availablePiles.value = data.available_piles || [];
  startLocalTimer(data.timer || MAX_TIME);
}

function handleGameOver(data: any) {
  alert(`게임 종료! 승자: ${data.winner.name}`);
  router.push("/davinci-home");
}

// -----------------------------
// 라이프사이클
// -----------------------------
onMounted(() => {
  // 이미 연결되어 있으면 바로 세팅
  if (socket.id) {
    mySid.value = socket.id;
  }

  // 이후 재연결될 때마다 갱신
  const onConnect = () => {
    console.log("⚡ socket connected:", socket.id);
    mySid.value = socket.id ?? null;
  };
  socket.on("connect", onConnect);

  // 게임 상태 & 턴 페이즈 리스너
  socket.on("state_update", handleStateUpdate);
  socket.on("game:turn_phase_start", handleTurnPhaseStart);
  socket.on("game_over", handleGameOver);

  // 언마운트 때 정리
  onUnmounted(() => {
    socket.off("connect", onConnect);
    socket.off("state_update", handleStateUpdate);
    socket.off("game:turn_phase_start", handleTurnPhaseStart);
    socket.off("game_over", handleGameOver);

    if (timerInterval !== null) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  });
});
</script>

<style scoped>
.game-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 2fr 1fr;
  height: 100vh;
  width: 100vw;
}

/* 모서리 */
.corner {
  display: flex;
  justify-content: center;
  align-items: center;
}

.top-left {
  grid-area: 1 / 1;
  transform: translate(150px, 150px);
}
.top-right {
  grid-area: 1 / 3;
  transform: translate(-150px, 150px);
}
.bottom-left {
  grid-area: 3 / 1;
  transform: translate(150px, -150px);
}
.bottom-right {
  grid-area: 3 / 3;
  transform: translate(-150px, -150px);
}

/* 중앙 */
.center-area {
  grid-area: 2 / 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 🔥 원형 타이머 (테두리만 채워지는 링) */
.turn-circle {
  position: relative;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 초록색 링 + 회색 부분을 conic-gradient로 채우고
   가운데는 뚫어서 "테두리만" 보이게 마스크 */
.turn-circle::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    #4caf50 var(--timer-angle, 0deg),
    #dddddd 0deg
  );
  /* 안쪽 구멍 뚫기 (링 효과) */
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 20px),
    #000 calc(100% - 20px)
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 20px),
    #000 calc(100% - 20px)
  );
}

/* 안쪽 내용용 흰색 원 */
.inner-circle {
  position: relative;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 20px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.player-text {
  font-size: 26px;
  font-weight: 800;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.timer-text {
  font-size: 18px;
  font-weight: 600;
  color: #4caf50;
}
</style>
