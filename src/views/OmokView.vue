<template>
  <div class="omok-container">
    <!-- 🔥 [NEW] VS Screen -->
    <!-- 🔥 [NEW] VS Screen -->
    <VsScreen 
      v-if="showVsScreen && player1WithProfile && player2WithProfile" 
      :player1="player1WithProfile" 
      :player2="player2WithProfile" 
      @finish="showVsScreen = false"
    />

    <div class="game-header">
      <button class="exit-btn" @click="confirmExit" :disabled="isExiting">
        <span class="icon">🚪</span> 나가기
      </button>
      <h1>⚫ Omok ⚪</h1>

    </div>

    <div class="game-area">
      <!-- Player 1 (Black) - Left -->
      <div class="player-side left" :class="{ active: currentTurn === players[0]?.id }">
        <div class="omok-player-card" v-if="players[0]">
            <div class="avatar-wrapper">
                <CharacterAvatar 
                    v-if="players[0].character"
                    v-bind="players[0].character"
                    :size="120"
                    mode="face"
                />
            </div>
            <div class="player-info">
                <div class="nickname">{{ players[0].nickname || players[0].name }}</div>
                <div class="bet-badge">
                    <span class="bet-icon">⛃</span>
                    <span class="bet-value">{{ (players[0].betAmount || 0).toLocaleString() }}</span>
                </div>
                <button class="info-btn" @click="showPlayerInfo(players[0])">👁️</button>
            </div>
            <!-- Timer Bar -->
            <div class="timer-bar-container" v-if="currentTurn === players[0].id">
                <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
            </div>
        </div>
        <div class="stone-indicator black">⚫</div>
        <div class="turn-badge" v-if="currentTurn === players[0]?.id && players[0]?.sid === mySid">MY TURN</div>
      </div>

      <!-- Board -->
      <div class="board-wrapper">
        <div class="board">
          <!-- Grid Lines -->
          <div v-for="i in 15" :key="`h-${i}`" class="line horizontal" :style="{ top: `${(i - 1) * 50 + 25}px` }"></div>
          <div v-for="i in 15" :key="`v-${i}`" class="line vertical" :style="{ left: `${(i - 1) * 50 + 25}px` }"></div>

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
              :class="{
                'black': board[y-1] && board[y-1]![x-1] === 1,
                'white': board[y-1] && board[y-1]![x-1] === 2,
                'can-place': isMyTurn && board[y-1] && board[y-1]![x-1] === 0,
                'winning': isWinningStone(x-1, y-1)
              }"
              @click="placeStone(x-1, y-1)"
            >
            </div>
          </div>
        </div>
      </div>

      <!-- Player 2 (White) - Right -->
      <div class="player-side right" :class="{ active: currentTurn === players[1]?.id }">
        <div class="omok-player-card" v-if="players[1]">
            <div class="avatar-wrapper">
                <CharacterAvatar 
                    v-if="players[1].character"
                    v-bind="players[1].character"
                    :size="120"
                    mode="face"
                />
            </div>
            <div class="player-info">
                <div class="nickname">{{ players[1].nickname || players[1].name }}</div>
                <div class="bet-badge">
                    <span class="bet-icon">⛃</span>
                    <span class="bet-value">{{ (players[1].betAmount || 0).toLocaleString() }}</span>
                </div>
                <button class="info-btn" @click="showPlayerInfo(players[1])">👁️</button>
            </div>
            <!-- Timer Bar -->
            <div class="timer-bar-container" v-if="currentTurn === players[1].id">
                <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
            </div>
        </div>
        <div class="stone-indicator white">⚪</div>
        <div class="turn-badge" v-if="currentTurn === players[1]?.id && players[1]?.sid === mySid">MY TURN</div>
      </div>
    </div>

    <!-- Game Over Overlay (Davinci Style) -->
    <div v-if="phase === 'GAME_OVER'" class="game-over-overlay">
        <div class="result-card" :class="{ victory: amIWinner, defeat: !amIWinner }">
            <div class="result-icon">{{ amIWinner ? '🏆' : '🏁' }}</div>
            <h2>{{ amIWinner ? 'VICTORY' : 'GAME OVER' }}</h2>
            
            <div class="winner-announce">
                <div class="winner-avatar" v-if="winner?.character">
                    <CharacterAvatar :character="winner.character" :size="100" />
                </div>
                <div class="winner-text">
                    Winner: <span class="winner-name">{{ winner?.nickname || winner?.name }}</span>
                </div>
                <div class="reason-text" v-if="gameOverReason === 'timeout'">
                    (Time Out)
                </div>
                <div class="reason-text" v-if="gameOverReason === 'disconnect'">
                    (Opponent Disconnected)
                </div>
            </div>
            
            <div class="payout-list" v-if="payouts.length > 0">
                <div v-for="p in payouts" :key="p.uid" class="payout-item" :class="{ 'winner': p.rank === 1, 'loser': p.rank > 1 }">
                    <div class="p-info">
                        <span class="p-rank">{{ p.rank === 1 ? '🥇' : '💀' }}</span>
                        <span class="p-name">{{ p.nickname }}</span>
                    </div>
                    <div class="p-result">
                        <span class="p-change" :class="p.net_change > 0 ? 'plus' : 'minus'">
                            {{ p.net_change > 0 ? '+' : '' }}{{ p.net_change.toLocaleString() }}
                        </span>
                        <span class="p-total">
                            (Total: {{ p.new_total.toLocaleString() }})
                        </span>
                    </div>
                </div>
            </div>

            <button class="home-btn" @click="goHome">Lobby</button>
        </div>
    </div>

    <!-- Player Info Modal -->
    <PlayerInfoModal
      :isOpen="!!selectedPlayerInfo"
      :player="selectedPlayerInfo"
      @close="selectedPlayerInfo = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { socket } from '../socket';
import { useRouter, useRoute } from 'vue-router';
import { auth, db } from '../firebase'; // 🔥 [FIX] Import auth and db
import { doc, getDoc } from 'firebase/firestore'; // 🔥 [NEW] Import firestore functions
import CharacterAvatar from '../components/CharacterAvatar.vue';
import PlayerInfoModal from '../components/game/PlayerInfoModal.vue';
import VsScreen from '../components/game/VsScreen.vue'; // 🔥 [NEW] Import

const router = useRouter();
const route = useRoute();
const roomId = route.params.roomId;

const players = ref<any[]>([]);
const board = ref<number[][]>(Array(15).fill(0).map(() => Array(15).fill(0)));
const pot = ref(0);
const currentTurn = ref(0);
const phase = ref('PLAYING');
const winner = ref<any>(null);
const payouts = ref<any[]>([]);
const gameOverReason = ref<string>('normal'); // 🔥 [NEW] Reason for game over
const mySid = socket.id;
const myUid = computed(() => auth.currentUser?.uid); // 🔥 [FIX] Make reactive
const selectedPlayerInfo = ref<any>(null);
const showVsScreen = ref(true); // 🔥 [NEW] VS Screen state
const winningLine = ref<{x: number, y: number}[]>([]); // 🔥 [NEW] Winning line coordinates

// 🔥 [NEW] Player Profiles Cache (Character Data)
const playerProfiles = ref<Record<string, any>>({});

const player1WithProfile = computed(() => {
    if (!players.value[0]) return null;
    const p = players.value[0];
    const profile = playerProfiles.value[p.uid];
    console.log(`👤 Player 1 (${p.uid}) Profile:`, profile);
    return { ...p, character: profile?.character || p.character };
});

const player2WithProfile = computed(() => {
    if (!players.value[1]) return null;
    const p = players.value[1];
    const profile = playerProfiles.value[p.uid];
    console.log(`👤 Player 2 (${p.uid}) Profile:`, profile);
    return { ...p, character: profile?.character || p.character };
});

// 🔥 [NEW] Watch players to fetch profiles
watch(players, async (newPlayers) => {
  console.log("👥 [OmokView] Players updated:", newPlayers);
  for (const p of newPlayers) {
    if (p.uid) {
        console.log(`🔍 [OmokView] Checking profile for ${p.uid}. Cached:`, playerProfiles.value[p.uid]);
        if (!playerProfiles.value[p.uid]) {
            // Mark as fetching to avoid duplicate requests
            playerProfiles.value[p.uid] = { fetching: true };
            try {
                console.log(`📥 [OmokView] Fetching Firestore profile for ${p.uid}...`);
                const snap = await getDoc(doc(db, 'users', p.uid));
                if (snap.exists()) {
                const data = snap.data();
                console.log(`✅ [OmokView] Fetched profile for ${p.uid}:`, data);
                if (data.character) {
                    playerProfiles.value[p.uid] = { character: data.character };
                } else {
                    delete playerProfiles.value[p.uid]; // No character data
                }
                } else {
                    console.warn(`⚠️ [OmokView] No profile found for ${p.uid}`);
                }
            } catch (e) {
                console.error("Failed to fetch profile for", p.uid, e);
                delete playerProfiles.value[p.uid];
            }
        }
    } else {
        console.warn("⚠️ [OmokView] Player has no UID:", p);
    }
  }
}, { deep: true, immediate: true });

// ... (watchers)

// Computed
const amIWinner = computed(() => {
    if (!winner.value) return false;
    // 🔥 [FIX] Robust comparison
    return winner.value.uid === myUid.value || winner.value.sid === mySid;
});

// ... (timer logic)

function isWinningStone(x: number, y: number) {
    return winningLine.value.some((coord: {x: number, y: number}) => coord.x === x && coord.y === y);
}

// ... (socket listeners)
// ... (socket listeners)

// (areProfilesReady and readyToShowVs removed)


  // 4. Listen for game over
  socket.on('game_over', (data) => {
      console.log("🔥 [GAME OVER] Data:", data);
      
      // 🔥 [NEW] Spotlight Effect
      // Check if winningLine exists and has length
      if (data.winningLine && data.winningLine.length > 0) {
          console.log("✨ Winning Line received:", data.winningLine);
          winningLine.value = data.winningLine.map((coord: any) => ({ x: coord[0], y: coord[1] }));
          console.log("✨ Parsed Winning Line:", winningLine.value);
          
          // Delay showing the result overlay
          setTimeout(() => {
              winner.value = data.winner;
              payouts.value = data.payouts || [];
              gameOverReason.value = data.reason || 'normal';
              phase.value = 'GAME_OVER';
              if (timerInterval) clearInterval(timerInterval);
          }, 2000); // 2 seconds delay
      } else {
          console.log("⚠️ No winning line data (Immediate Game Over)");
          // Immediate show if no winning line (e.g. timeout/disconnect)
          winner.value = data.winner;
          payouts.value = data.payouts || [];
          gameOverReason.value = data.reason || 'normal';
          phase.value = 'GAME_OVER';
          if (timerInterval) clearInterval(timerInterval);
      }
  });
// (isMyTurn removed from here, defined below)

// Timer State
const timeLeft = ref(30);
const maxTime = ref(30);
let timerInterval: number | null = null;

const me = computed(() => players.value.find(p => p.sid === socket.id));
const isMyTurn = computed(() => me.value && me.value.id === currentTurn.value);
const myColor = computed(() => {
    if (!me.value) return 0;
    return players.value.findIndex(p => p.sid === socket.id) + 1; // 1: Black, 2: White
});

function startLocalTimer(duration: number) {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft.value = duration;
  maxTime.value = duration;
  
  timerInterval = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, 1000);
}



function placeStone(x: number, y: number) {
  console.log(`Attempting to place stone at ${x}, ${y}`);
  if (!isMyTurn.value) {
      console.log("Not my turn");
      return;
  }
  if (!board.value[y] || board.value[y][x] !== 0) {
      console.log("Invalid position or occupied");
      return;
  }
  
  socket.emit('omok:place_stone', { roomId, x, y });
}

function goHome() {
    router.push('/omok-home');
}

const isExiting = ref(false);

function confirmExit() {
    if (isExiting.value) return;
    
    if (confirm("정말 나가시겠습니까? 게임에서 패배 처리되며 배팅 금액을 잃습니다.")) {
        isExiting.value = true;
        socket.emit('leave_game', { roomId });
        // router.push('/omok-home'); // 🔥 Wait for game_over event to show settlement
    }
}

function showPlayerInfo(player: any) {
    selectedPlayerInfo.value = player;
}

onMounted(() => {
  // 1. Request initial state
  socket.emit('request_game_state', { roomId });

  // 2. Listen for state updates
  socket.on('state_update', (data) => {
    players.value = data.players;
    board.value = data.board;
    pot.value = data.pot;
    currentTurn.value = data.currentTurn;
    phase.value = data.phase;
    winner.value = data.winner;
    
    // Sync timer if provided (though state_update usually doesn't have precise timer)
    if (data.remainingTime) {
        startLocalTimer(data.remainingTime);
    }

    // 🔥 [NEW] If game is already in progress (stones on board), skip VS screen
    const hasStones = data.board.some((row: number[]) => row.some((cell: number) => cell !== 0));
    if (hasStones) {
        showVsScreen.value = false;
    } else {
        // New game or empty board
        winningLine.value = []; // Clear winning line
    }
  });

  // 3. Listen for turn start (for timer and immediate feedback)
  socket.on('omok:turn_start', (data) => {
    // data: { currentTurnUid, timer }
    const turnPlayer = players.value.find(p => p.uid === data.currentTurnUid);
    if (turnPlayer) {
      currentTurn.value = turnPlayer.id;
    }
    if (data.timer) {
        startLocalTimer(data.timer);
    }
  });

  // 5. Listen for board updates
  socket.on('omok:update_board', (data) => {
    // data: { board, lastMove }
    board.value = data.board;
    // Optional: Highlight last move
  });

  // Prevent accidental leave
  window.addEventListener('beforeunload', handleBeforeUnload);
});

function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (phase.value === 'PLAYING') {
        e.preventDefault();
        e.returnValue = '';
    }
}

onUnmounted(() => {
  socket.off('state_update');
  socket.off('omok:turn_start');
  socket.off('omok:update_board');
  socket.off('game_over');
  if (timerInterval) clearInterval(timerInterval);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.omok-container {
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.game-header {
    position: absolute;
    top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%; /* Ensure header spans full width for absolute positioning of children */
}

.exit-btn {
  position: absolute;
  top: 0;
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

.exit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.timer-display {
    margin-top: 10px;
}

.game-area {
  display: flex;
  align-items: center;
  gap: 80px; /* Increased gap */
  margin-top: 60px;
}

.board-wrapper {
  padding: 20px;
  background: #d4a373; /* Wood color */
  border-radius: 5px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.board {
  position: relative;
  width: 750px;
  height: 750px;
  display: flex;
  flex-direction: column;
}

.line {
  position: absolute;
  background: #000;
}

.line.horizontal {
  left: 25px;
  right: 25px;
  height: 1px;
}

.line.vertical {
  top: 25px;
  bottom: 25px;
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

.cell.can-place:hover::after {
    content: '';
    position: absolute;
    width: 80%;
    height: 80%;
    background: rgba(0, 255, 0, 0.3);
    border-radius: 50%;
    pointer-events: none;
}

/* 🔥 [FIX] Winning Stone Spotlight - Pulse the stone itself */
.cell.winning::after {
    box-shadow: 0 0 15px 5px #ffd700 !important; /* Gold glow override */
    animation: pulse 1s infinite alternate;
    z-index: 10 !important; /* Ensure winning stones are on top */
}

@keyframes pulse {
    from { box-shadow: 0 0 10px 2px #ffd700; transform: scale(1); }
    to { box-shadow: 0 0 20px 8px #ffaa00; transform: scale(1.1); }
}

/* 🔥 [FIX] Render stones using pseudo-elements */
.cell.black::after, .cell.white::after {
  content: '';
  display: block; 
  width: 42px;
  height: 42px;
  border-radius: 50%;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
  z-index: 2;
  position: relative; 
  transition: all 0.3s ease; /* Smooth transition for scale */
}

.cell.black::after {
  background: radial-gradient(circle at 30% 30%, #555, #000);
}

.cell.white::after {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.player-side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    opacity: 0.6;
    transition: all 0.3s;
    width: 200px;
}

.player-side.active {
    opacity: 1;
    transform: scale(1.05);
}

.omok-player-card {
    background: rgba(0, 0, 0, 0.6);
    padding: 20px;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: 2px solid transparent;
}

.player-side.active .omok-player-card {
    border-color: #ffd700;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.avatar-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    background: #fff;
    border: 3px solid #fff;
}

.player-info {
    text-align: center;
    width: 100%;
}

.nickname {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bet-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: rgba(0,0,0,0.5);
    padding: 5px 10px;
    border-radius: 20px;
    margin-bottom: 10px;
}

.bet-icon { color: #ffd700; }
.bet-value { color: #fff; font-weight: bold; }

.timer-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 10px;
    position: relative; /* Ensure visibility */
    z-index: 10;
}

.timer-bar {
    height: 100%;
    background: #ffd700;
    transition: width 1s linear;
}

.info-btn {
    background: none;
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    transition: all 0.2s;
}

.info-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: white;
}

.stone-indicator {
    font-size: 3rem;
}

.turn-badge {
    background: #e74c3c;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-weight: bold;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* 🔥 Ensure it's on top of everything */
    backdrop-filter: blur(5px);
    animation: fadeIn 0.5s ease;
}

.result-card {
    background: #2c3e50;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 0 50px rgba(0,0,0,0.5);
    text-align: center;
    border: 2px solid #ffd700;
    min-width: 500px; /* Wider for better layout */
}

.result-card h2 {
    color: #ffd700;
    font-size: 3rem;
    margin-bottom: 30px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.winner-announce {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-bottom: 40px;
}

.winner-text {
    font-size: 1.8rem;
    color: #fff;
}

.winner-name {
    color: #ffd700;
    font-weight: bold;
}

.payout-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 40px;
}

.payout-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    padding: 15px 25px;
    border-radius: 12px;
    font-size: 1.2rem;
}

.payout-item.winner {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.2));
    border: 1px solid rgba(255, 215, 0, 0.5);
}

.payout-item.loser {
    background: linear-gradient(90deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.2));
    border: 1px solid rgba(231, 76, 60, 0.5);
}

.p-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.p-rank { font-size: 1.5rem; }
.p-name { font-weight: bold; color: #fff; }

.p-result {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.p-change {
    font-size: 1.3rem;
    font-weight: bold;
}

.p-change.plus { color: #2ecc71; text-shadow: 0 0 5px rgba(46, 204, 113, 0.5); }
.p-change.minus { color: #e74c3c; }

.p-total {
    font-size: 0.9rem;
    color: #aaa;
}

.home-btn {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    border: none;
    padding: 15px 50px;
    border-radius: 30px;
    font-size: 1.3rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.home-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6);
}
</style>
