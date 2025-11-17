<template>
  <div class="game-container">
    <!-- 좌상단 -->
    <div class="corner top-left" v-if="orderedPlayers[0]">
      <PlayerCard
        :player="orderedPlayers[0]"
        :active="orderedPlayers[0].id === currentTurn"
        :isMe="orderedPlayers[0].sid === mySid"
      />
    </div>

    <!-- 우상단 -->
    <div class="corner top-right" v-if="orderedPlayers[1]">
      <PlayerCard
        :player="orderedPlayers[1]"
        :active="orderedPlayers[1].id === currentTurn"
        :isMe="orderedPlayers[1].sid === mySid"
      />
    </div>

    <!-- 중앙 영역 -->
    <div class="center-area">
      <h2>다빈치 코드</h2>

      <p>현재 턴: {{ currentTurn + 1 }}P</p>
      <p>남은 타일: 검정 {{ piles.black }} / 흰색 {{ piles.white }}</p>

      <p>현재 단계: <strong>{{ phaseLabel }}</strong></p>
      <p v-if="timeLeft > 0">남은 시간: <strong>{{ Math.ceil(timeLeft) }}초</strong></p>

      <div v-if="drawnTile">
        <p>
          방금 뽑은 타일:
          <strong v-if="drawnTile.value !== null">
            {{ drawnTile.color }} {{ drawnTile.value }}
          </strong>
          <strong v-else>?</strong>
        </p>
      </div>

      <p v-if="!isMyTurn" class="info-text">
        다른 플레이어가 진행 중입니다…
      </p>

      <!-- 내 턴일 때만 조작 UI -->
      <div v-if="isMyTurn" class="action-box">
        <!-- DRAWING: 색 선택 & 드로우 -->
        <template v-if="phase === 'DRAWING'">
          <h3>타일 뽑기</h3>
          <div class="row">
            <label>색 선택:</label>
            <select v-model="selectColor">
              <option
                value="black"
                :disabled="!availablePiles.includes('black')"
              >
                검정
              </option>
              <option
                value="white"
                :disabled="!availablePiles.includes('white')"
              >
                흰색
              </option>
            </select>
          </div>
          <button @click="drawTile">한 장 뽑기</button>
        </template>

        <!-- PLACE_JOKER: 조커 배치 -->
        <template v-else-if="phase === 'PLACE_JOKER'">
          <h3>조커 배치</h3>
          <p>조커를 어느 위치에 넣을지 인덱스를 선택하세요.</p>
          <div class="row">
            <label>배치 인덱스 (0부터):</label>
            <input
              v-model.number="placeIndex"
              type="number"
              min="0"
              style="width:80px;"
            />
          </div>
          <button
            @click="placeJoker"
            :disabled="!drawnTile || !drawnTile.isJoker"
          >
            조커 배치 완료
          </button>
        </template>

        <!-- GUESSING / POST_SUCCESS_GUESS: 추리 -->
        <template v-else-if="phase === 'GUESSING' || phase === 'POST_SUCCESS_GUESS'">
          <h3>카드 추리</h3>
          <div class="row">
            <label>대상 플레이어:</label>
            <select v-model.number="targetPlayerId">
              <option
                v-for="p in otherPlayers"
                :key="p.id"
                :value="p.id"
              >
                {{ p.name }} (P{{ p.id + 1 }})
              </option>
            </select>
          </div>

          <div class="row">
            <label>카드 인덱스 (0부터):</label>
            <input
              v-model.number="guessIndex"
              type="number"
              min="0"
              style="width:80px;"
            />
          </div>

          <div class="row">
            <label>예상 숫자 (0~11):</label>
            <input
              v-model.number="guessValue"
              type="number"
              min="0"
              max="11"
              style="width:80px;"
            />
          </div>

          <button @click="doGuess">추리하기</button>

          <div v-if="phase === 'POST_SUCCESS_GUESS'" class="row gap-top">
            <p>추리에 성공했습니다. 계속 하시겠습니까?</p>
            <button @click="/* 계속 추리: 그냥 또 doGuess 사용 */ null" disabled>
              (다음 추리를 입력 후 다시 [추리하기] 버튼을 누르세요)
            </button>
            <button @click="stopGuessing">
              그만하고 턴 넘기기
            </button>
          </div>

          <p v-if="lastGuessMessage" class="guess-message">
            {{ lastGuessMessage }}
          </p>
        </template>

        <!-- 기타 단계 (INIT 등) -->
        <template v-else>
          <p>서버에서 턴을 준비 중입니다…</p>
        </template>
      </div>
    </div>

    <!-- 좌하단 -->
    <div class="corner bottom-left" v-if="orderedPlayers[3]">
      <PlayerCard
        :player="orderedPlayers[3]"
        :active="orderedPlayers[3].id === currentTurn"
        :isMe="orderedPlayers[3].sid === mySid"
      />
    </div>

    <!-- 우하단 -->
    <div class="corner bottom-right" v-if="orderedPlayers[2]">
      <PlayerCard
        :player="orderedPlayers[2]"
        :active="orderedPlayers[2].id === currentTurn"
        :isMe="orderedPlayers[2].sid === mySid"
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

// ============================
// 상태
// ============================
const players = ref<any[]>([]);
const piles = ref<{ black: number; white: number }>({ black: 0, white: 0 });
const drawnTile = ref<any | null>(null);
const currentTurn = ref(0);
const pendingPlacement = ref(false);

const mySid = socket.id;

// 턴/페이즈 관련 UI 상태
const phase = ref<TurnPhase>("INIT");
const timeLeft = ref(0);
const availablePiles = ref<string[]>([]); // ["black", "white"]

let timerInterval: number | null = null;

// 행동 관련 상태
const selectColor = ref<"black" | "white">("black");
const placeIndex = ref(0);

const targetPlayerId = ref<number | null>(null);
const guessIndex = ref<number | null>(null);
const guessValue = ref<number | null>(null);
const lastGuessMessage = ref("");

// ============================
// 계산 속성
// ============================
const orderedPlayers = computed(() => {
  const arr = [...players.value];
  return arr.sort((a, b) => a.id - b.id);
});

const me = computed(() =>
  players.value.find((p) => p.sid === mySid) || null
);

const isMyTurn = computed(() => {
  if (!me.value) return false;
  return me.value.id === currentTurn.value;
});

const otherPlayers = computed(() =>
  players.value.filter((p) => p.sid !== mySid)
);

const phaseLabel = computed(() => {
  switch (phase.value) {
    case "DRAWING":
      return "타일 뽑기";
    case "PLACE_JOKER":
      return "조커 배치";
    case "GUESSING":
      return "추리";
    case "POST_SUCCESS_GUESS":
      return "추리 성공 – 계속 여부 선택";
    default:
      return "대기";
  }
});

// ============================
// 타이머 UI 관리
// ============================
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

// ============================
// Socket 이벤트 핸들러
// ============================
function handleStateUpdate(data: any) {
  players.value = data.players || [];
  piles.value = data.piles || { black: 0, white: 0 };
  drawnTile.value = data.drawnTile || null;
  pendingPlacement.value = data.pendingPlacement ?? false;
  currentTurn.value = data.currentTurn ?? 0;

  // 내가 상대 추리 대상 선택을 안 했으면 기본값 설정
  if (otherPlayers.value.length > 0 && targetPlayerId.value === null) {
    targetPlayerId.value = otherPlayers.value[0].id;
  }
}

function handleTurnPhaseStart(data: any) {
  phase.value = data.phase as TurnPhase;
  availablePiles.value = data.available_piles || [];
  startLocalTimer(data.timer || 20);
}

function handleGuessResult(payload: {
  guesser_id: number;
  target_id: number;
  index: number;
  value: number;
  correct: boolean;
}) {
  const who = players.value.find((p) => p.id === payload.guesser_id);
  const target = players.value.find((p) => p.id === payload.target_id);
  const whoName = who ? who.name : `P${payload.guesser_id + 1}`;
  const targetName = target ? target.name : `P${payload.target_id + 1}`;

  if (payload.correct) {
    lastGuessMessage.value = `${whoName} 님이 ${targetName}의 카드(${payload.index})를 맞췄습니다!`;
  } else {
    lastGuessMessage.value = `${whoName} 님의 추리가 틀렸습니다. 벌칙으로 자신의 카드가 공개되었습니다.`;
  }
}

function handlePromptContinue(data: any) {
  // 서버가 POST_SUCCESS_GUESS로 phase를 바꾸고, 여기서도 UI 힌트만 띄워줌
  // 실제 '계속 추리'는 그냥 또 doGuess()를 누르게 하고,
  // '그만하기'는 stopGuessing()으로 처리
  // 여기서는 그냥 안내만:
  console.log("추리 성공 – 계속할지 선택 타이머:", data.timer);
}

function handleActionTimeout(payload: { message: string }) {
  alert(payload.message);
  lastGuessMessage.value = payload.message;
}

function handleGameOver(data: any) {
  alert(`게임 종료! 승자: ${data.winner.name}`);
  router.push("/davinci-home");
}

// ============================
// 행동 Emit
// ============================
function drawTile() {
  if (!isMyTurn.value) return;
  socket.emit("draw_tile", {
    roomId,
    color: selectColor.value,
  });
}

function placeJoker() {
  if (!isMyTurn.value) return;
  socket.emit("place_joker", {
    roomId,
    index: placeIndex.value,
  });
}

function doGuess() {
  if (!isMyTurn.value) return;
  if (targetPlayerId.value === null || guessIndex.value === null || guessValue.value === null) {
    alert("대상 / 인덱스 / 숫자를 모두 입력하세요.");
    return;
  }

  socket.emit("guess_value", {
    roomId,
    targetId: targetPlayerId.value,
    index: guessIndex.value,
    value: guessValue.value,
  });
}

function stopGuessing() {
  if (!isMyTurn.value) return;
  socket.emit("stop_guessing", { roomId });
}

// ============================
// 라이프사이클
// ============================
onMounted(() => {
  socket.on("state_update", handleStateUpdate);
  socket.on("game:turn_phase_start", handleTurnPhaseStart);
  socket.on("game:guess_result", handleGuessResult);
  socket.on("game:prompt_continue", handlePromptContinue);
  socket.on("game:action_timeout", handleActionTimeout);
  socket.on("game_over", handleGameOver);
});

onUnmounted(() => {
  socket.off("state_update", handleStateUpdate);
  socket.off("game:turn_phase_start", handleTurnPhaseStart);
  socket.off("game:guess_result", handleGuessResult);
  socket.off("game:prompt_continue", handlePromptContinue);
  socket.off("game:action_timeout", handleActionTimeout);
  socket.off("game_over", handleGameOver);

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
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

/* 모서리 공통 */
.corner {
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.top-left {
  grid-area: 1 / 1;
}
.top-right {
  grid-area: 1 / 3;
}
.bottom-left {
  grid-area: 3 / 1;
  align-items: flex-end;
}
.bottom-right {
  grid-area: 3 / 3;
  align-items: flex-end;
}

/* 중앙 */
.center-area {
  grid-area: 2 / 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.action-box {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  min-width: 260px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gap-top {
  margin-top: 12px;
}

.info-text {
  margin-top: 12px;
  color: #666;
}

.guess-message {
  margin-top: 8px;
  color: #333;
  font-weight: 500;
}
</style>
