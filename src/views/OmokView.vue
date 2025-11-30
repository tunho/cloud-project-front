<template>
  <div class="omok-container">
    <div class="game-header">
      <h1>⚫ Omok ⚪</h1>
      <div class="pot-display">Pot: {{ pot.toLocaleString() }}</div>
    </div>

    <div class="game-area">
      <!-- Player 1 (Black) -->
      <div class="player-side left" :class="{ active: currentTurn === players[0]?.id }">
        <PlayerCard
          v-if="players[0]"
          :player="players[0]"
          :isMe="players[0].sid === mySid"
          :active="players[0].id === currentTurn"
          side="left"
          phase="GAME"
        />
        <div class="stone-indicator black">⚫</div>
      </div>

      <!-- Board -->
      <div class="board-wrapper">
        <div class="board">
          <!-- Grid Lines -->
          <div v-for="i in 14" :key="`h-${i}`" class="line horizontal" :style="{ top: `${i * 40}px` }"></div>
          <div v-for="i in 14" :key="`v-${i}`" class="line vertical" :style="{ left: `${i * 40}px` }"></div>

          <!-- Intersections (Clickable) -->
          <div 
            v-for="y in 15" 
            :key="`row-${y}`" 
            class="row"
          >
            <div 
              v-for="x in 15" 
              :key="`cell-${x}-${y}`" 
              class="cell"
              @click="placeStone(x-1, y-1)"
            >
              <!-- Stone -->
              <div v-if="board[y-1][x-1] === 1" class="stone black"></div>
              <div v-if="board[y-1][x-1] === 2" class="stone white"></div>
              
              <!-- Hover Preview -->
              <div v-if="board[y-1][x-1] === 0 && isMyTurn" class="stone-preview" :class="myColor === 1 ? 'black' : 'white'"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Player 2 (White) -->
      <div class="player-side right" :class="{ active: currentTurn === players[1]?.id }">
        <PlayerCard
          v-if="players[1]"
          :player="players[1]"
          :isMe="players[1].sid === mySid"
          :active="players[1].id === currentTurn"
          side="right"
          phase="GAME"
        />
        <div class="stone-indicator white">⚪</div>
      </div>
    </div>

    <!-- Game Over Overlay -->
    <div v-if="phase === 'GAME_OVER'" class="game-over-overlay">
        <h2>Game Over</h2>
        <p v-if="winner">Winner: {{ winner.nickname }}</p>
        <button @click="goHome">나가기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { socket } from '../socket';
import { useRouter, useRoute } from 'vue-router';
import PlayerCard from '../components/PlayerCard.vue';

const router = useRouter();
const route = useRoute();
const roomId = route.params.roomId;

const players = ref<any[]>([]);
const board = ref<number[][]>(Array(15).fill(0).map(() => Array(15).fill(0)));
const pot = ref(0);
const currentTurn = ref(0);
const phase = ref('PLAYING');
const winner = ref<any>(null);
const mySid = ref(socket.id);

const me = computed(() => players.value.find(p => p.sid === socket.id));
const isMyTurn = computed(() => me.value && me.value.id === currentTurn.value);
const myColor = computed(() => {
    if (!me.value) return 0;
    return players.value.findIndex(p => p.sid === socket.id) + 1; // 1: Black, 2: White
});

function placeStone(x: number, y: number) {
  if (!isMyTurn.value) return;
  if (board.value[y][x] !== 0) return;
  
  socket.emit('omok:place_stone', { roomId, x, y });
}

function goHome() {
    router.push('/platform');
}

onMounted(() => {
  socket.on('state_update', (data) => {
    players.value = data.players;
    board.value = data.board;
    pot.value = data.pot;
    currentTurn.value = data.currentTurn;
    phase.value = data.phase;
    winner.value = data.winner;
  });
});

onUnmounted(() => {
  socket.off('state_update');
});
</script>

<style scoped>
.omok-container {
  height: 100vh;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.game-area {
  display: flex;
  align-items: center;
  gap: 50px;
  margin-top: 20px;
}

.board-wrapper {
  padding: 20px;
  background: #d4a373; /* Wood color */
  border-radius: 5px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.board {
  position: relative;
  width: 600px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.line {
  position: absolute;
  background: #000;
}

.line.horizontal {
  left: 20px;
  right: 20px;
  height: 1px;
}

.line.vertical {
  top: 20px;
  bottom: 20px;
  width: 1px;
}

.row {
  display: flex;
  flex: 1;
}

.cell {
  flex: 1;
  position: relative;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stone {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
  z-index: 2;
}

.stone.black {
  background: radial-gradient(circle at 30% 30%, #555, #000);
}

.stone.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.stone-preview {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  opacity: 0.5;
  z-index: 2;
}

.stone-preview.black { background: #000; }
.stone-preview.white { background: #fff; }

.player-side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    opacity: 0.5;
    transition: opacity 0.3s;
}

.player-side.active {
    opacity: 1;
    transform: scale(1.05);
}

.stone-indicator {
    font-size: 2rem;
}

.game-over-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 200;
}
</style>
