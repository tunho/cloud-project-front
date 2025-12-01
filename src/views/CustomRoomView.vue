<template>
  <div class="room-wrapper">
    <UserProfile />
    <div class="room-container">
    <div class="header-section">
      <h1>🎮 대기실</h1>

      
      <!-- 🔥 [NEW] Game Type Indicator -->
      <div class="game-type-badge" :class="gameType">
        <span class="icon">{{ gameType === 'omok' ? '⚫' : '🧩' }}</span>
        <span class="text">{{ gameType === 'omok' ? '오목 (Omok)' : '다빈치 코드 (Davinci Code)' }}</span>
      </div>
    </div>

    <div class="code-section">
      <div class="code-box" @click="copyRoomCode">
        <span class="code-text">{{ roomId }}</span>
        <span class="copy-icon" title="복사하기">📋</span>
      </div>
    </div>

    <div class="player-section">
      <h2>참가자 <span class="count">({{ players.length }}/4)</span></h2>
      
      <div class="player-grid">
        <div
          v-for="p in players"
          :key="p.uid"
          class="player-card"
          :class="{ 'is-host': p.id === 0 }"
        >
          <div class="avatar">
            <CharacterAvatar 
                v-if="p.character"
                v-bind="p.character"
                :size="60"
                mode="face"
            />
            <span v-else>{{ p.name ? p.name.charAt(0).toUpperCase() : '?' }}</span>
          </div>
          <div class="player-info">
            <span class="name">{{ p.name }}</span>
            <span v-if="p.id === 0" class="host-badge">👑 방장</span>
            <button class="info-btn" @click.stop="showPlayerInfo(p)">👁️</button> <!-- 🔥 [NEW] Info Button -->
          </div>
        </div>

        <div v-for="i in (4 - players.length)" :key="`empty-${i}`" class="player-card empty">
          <div class="avatar empty-avatar"></div>
          <div class="player-info">
            <span class="name waiting">대기 중...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 [NEW] Player Info Modal -->
    <PlayerInfoModal
      :isOpen="!!selectedPlayer"
      :player="selectedPlayer"
      @close="selectedPlayer = null"
    />

    <div class="action-buttons">
      <button
        v-if="isHost"
        class="start-btn"
        @click="startGame"
        :disabled="players.length < 2"
      >
        <span class="btn-text">🚀 게임 시작</span>
      </button>
      
      <p v-else class="waiting-msg">
        방장이 게임을 시작할 때까지 대기해주세요...
      </p>

      <button class="leave-btn" @click="leaveRoom">
        나가기
      </button>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import { socket, gameEntryGuard } from "../socket";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import UserProfile from "../components/UserProfile.vue"; // 🔥 Import
import CharacterAvatar from "../components/CharacterAvatar.vue"; // 🔥 Import
import PlayerInfoModal from "../components/game/PlayerInfoModal.vue"; // 🔥 Import

const router = useRouter();
const route = useRoute();

const selectedPlayer = ref<any>(null); // 🔥 [NEW] Selected player for info modal

function showPlayerInfo(player: any) {
    selectedPlayer.value = player;
}

// ... (중략) ...

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(roomId);
    alert("방 코드가 복사되었습니다!");
  } catch (err) {
    console.error("클립보드 복사 실패:", err);
  }
}


const roomId = route.params.roomId as string;

// -------------------------
// 반응형 상태
// -------------------------
const currentUid = ref<string | null>(null);
const nickname = ref("Guest");
const players = ref<any[]>([]);
const isHost = ref(false);

// 게임 시작 시 leave_room 방지
const gameHasStarted = ref(false);

// -------------------------
// Firebase Auth 상태 감지
// -------------------------
function bindAuthListener() {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUid.value = user.uid;

      const snap = await getDoc(doc(db, "users", user.uid));
      nickname.value = snap.exists()
        ? snap.data().nickname
        : "Guest";
        
      // 닉네임 로드 후 입장 처리 (새로고침 대응)
      const userData = snap.exists() ? snap.data() : {};
      
      socket.emit("enter_room", {
        roomId,
        uid: user.uid,
        name: nickname.value,
        nickname: nickname.value,
        major: userData.major || "",
        year: userData.year || 0,
        money: userData.money || 0,
        character: userData.character || null, // 🔥 [FIX] Send character data
      });

    } else {
      currentUid.value = null;
      nickname.value = "Guest";
    }
  });
}

// -------------------------
// 소켓 이벤트 핸들러
// -------------------------
const gameType = ref('davinci'); // 🔥 [추가]

function onRoomState(data: any) {
  players.value = data.players || [];
  gameType.value = data.gameType || 'davinci'; // 🔥 [NEW] Capture gameType
  const me = players.value.find((p: any) => p.uid === currentUid.value);
  if (me) isHost.value = me.id === 0;
  if (data.gameType) gameType.value = data.gameType; // 🔥 [추가]
}

function onGameStarted(data: any) {
  if (data.roomId === roomId) {
    gameHasStarted.value = true;
    gameEntryGuard.allowed = true;
    (window as any).isGameEntryValid = true;
    
    // 🔥 [수정] 게임 타입에 따라 라우팅 분기
    if (gameType.value === 'omok') {
        router.replace(`/room/${roomId}/omok`);
    } else {
        router.replace(`/room/${roomId}/play`);
    }
  }
}

function onErrorMessage({ message }: { message: string }) {
  if (message === "존재하지 않는 방입니다.") {
    router.push("/custom-match");
    return;
  }
  alert(message);
}

// -------------------------
// 방 나가기
// -------------------------
function leaveRoom() {
  socket.emit("leave_room", { roomId });
  if (gameType.value === 'omok') {
    router.push('/omok-home');
  } else {
    router.push('/davinci-home');
  }
}

// 🔥 [추가] 브라우저 뒤로가기 = 방 나가기
onBeforeRouteLeave((_to, _from, next) => {
  if (currentUid.value && !gameHasStarted.value) {
    socket.emit("leave_room", { roomId, uid: currentUid.value });
  }
  next();
});

function handleBeforeUnload() {
  if (currentUid.value && !gameHasStarted.value) {
    socket.emit("leave_room", { roomId, uid: currentUid.value });
  }
}

// -------------------------
// 게임 시작
// -------------------------
function startGame() {
  if (players.value.length < 2) {
    alert("게임을 시작하려면 최소 2명의 플레이어가 필요합니다.");
    return;
  }
  socket.emit("start_game", { roomId });

}



// -------------------------
// 라이프사이클
// -------------------------
let unsubscribeAuth: () => void;

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  
  // 소켓 리스너 등록
  socket.on("room_state", onRoomState);
  socket.on("game_started", onGameStarted);
  socket.on("error_message", onErrorMessage);
  
  unsubscribeAuth = bindAuthListener();
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);

  unsubscribeAuth?.();

  socket.off("room_state", onRoomState);
  socket.off("game_started", onGameStarted);
  socket.off("error_message", onErrorMessage);

  if (!gameHasStarted.value && currentUid.value) {
    socket.emit("leave_room", {
      roomId,
      uid: currentUid.value,
    });
  }
});
</script>

<style scoped>
/* 컨테이너 (글래스모피즘) */
.room-container {
  max-width: 800px; /* 🔥 [FIX] Increased width */
  margin: 60px auto;
  padding: 50px 40px;
  border-radius: 24px;
  background: rgba(15, 12, 41, 0.85); /* Slightly darker */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: white;
  animation: fadeIn 0.6s ease-out;
}

/* ... (omitted) ... */

.info-btn {
  background: none;
  border: none;
  font-size: 1.2rem; /* 🔥 [FIX] Smaller icon */
  cursor: pointer;
  opacity: 0.7;
  transition: transform 0.2s, opacity 0.2s;
  padding: 5px;
}

.info-btn:hover {
  transform: scale(1.1);
  opacity: 1;
}

/* 🔥 [NEW] Game Type Badge */
.game-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 10px;
  font-weight: 600;
  font-size: 0.95rem;
}

.game-type-badge.omok {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.game-type-badge.davinci {
  background: rgba(66, 133, 244, 0.2);
  border-color: rgba(66, 133, 244, 0.4);
}

@keyframes scaleUp {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 헤더 */
.header-section h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(66, 133, 244, 0.6);
}

.sub-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 25px;
}

/* 방 코드 섹션 */
.code-section {
  margin-bottom: 30px;
}

.label {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
  display: block;
  margin-bottom: 8px;
}

.code-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-box:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #4285f4;
}

.code-text {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd700;
  letter-spacing: 2px;
}

.copy-icon {
  font-size: 1.2rem;
  opacity: 0.7;
}

/* 플레이어 리스트 섹션 */
.player-section {
  text-align: left;
  margin-bottom: 30px;
}

.player-section h2 {
  font-size: 1.1rem;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.count {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 columns */
  gap: 20px;
}

.player-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.player-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.player-card.is-host {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.05);
}

.player-card.empty {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: transparent;
  opacity: 0.6;
}

.avatar {
  width: 70px; /* 🔥 [FIX] Larger avatar area */
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  color: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.empty-avatar {
  background: rgba(255, 255, 255, 0.1);
}

.player-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.name {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.waiting {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.host-badge {
  font-size: 0.75rem;
  color: #ffd700;
  font-weight: bold;
  margin-top: 2px;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: white;
}

button:active {
  transform: scale(0.98);
}

.start-btn {
  background: linear-gradient(135deg, #4285f4, #34a853);
  box-shadow: 0 8px 20px rgba(52, 168, 83, 0.3);
}

.start-btn:hover {
  transform: translateY(-3px);
  filter: brightness(1.1);
}

.start-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.leave-btn {
  background: transparent;
  border: 1px solid rgba(229, 57, 53, 0.5);
  color: #ff6b6b;
}

.leave-btn:hover {
  background: rgba(229, 57, 53, 0.1);
  border-color: #e53935;
}

.waiting-msg {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  animation: pulse 2s infinite;
  margin-bottom: 10px;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>