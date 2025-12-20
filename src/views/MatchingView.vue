<template>
  <div class="match-container">
    <h1>매칭 중…</h1>

    <div class="profile-box">
      <div class="avatar-wrapper" v-if="character">
        <CharacterAvatar 
            v-bind="character" 
            :size="120" 
            mode="face" 
        />
      </div>
      <div class="profile-circle" v-else>{{ firstLetter }}</div>
      <div class="profile-name">{{ nickname }}</div>
    </div>

    <div class="timer-box">
      <p>경과 시간: <strong>{{ elapsed }}초</strong></p>

      <p class="queue-status">
        대기 중: {{ queueCount }} / {{ queueMax }}
      </p>

      <p><strong>상대 찾는 중...</strong></p>
    </div>

    <button class="cancel-btn" @click="cancelMatch">❌ 취소</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { socket, gameEntryGuard } from "../socket";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getGameConfig } from "../config/games";

const route = useRoute();
const router = useRouter();

const nickname = ref("Guest");
const firstLetter = ref("?");
const elapsed = ref(0);
let timer: number;

const queueCount = ref(0);
const queueMax = ref(4);
const major = ref("");
const year = ref(0);
const money = ref(0);
const character = ref<any>(null); // 🔥 [FIX] Character data
const isMatched = ref(false); // 🔥 [NEW] 매칭 성공 여부 (Top Level)
const gameTitle = computed(() => {
    const gameType = (route.query.game as string) || 'davinci';
    return getGameConfig(gameType).title;
});

import CharacterAvatar from "../components/CharacterAvatar.vue"; // 🔥 Import

// -------------------------
// 사용자 정보 로드
// -------------------------
async function loadUserProfile(uid: string) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      console.log("🔥 Loaded User Profile (Raw):", data); // [DEBUG]
      nickname.value = data.nickname || "Guest";
      firstLetter.value = nickname.value?.[0]?.toUpperCase() ?? "?";
      major.value = data.major || "Unknown"; 
      console.log("✅ Set Major:", major.value); // [DEBUG]
      year.value = data.year || 0;
      money.value = data.money || 0;
      character.value = data.character || null; // 🔥 [FIX] Fetch character
    } else {
      console.warn("⚠️ User profile not found for uid:", uid);
    }
  } catch (e) {
    console.error("Failed to load user profile:", e);
  }
}

function cancelMatch() {
  socket.emit("leave_queue");
  clearInterval(timer);
  const gameType = (route.query.game as string) || 'davinci';
  const config = getGameConfig(gameType);
  router.push(config.lobbyRoute);
}

function startTimer() {
  timer = setInterval(() => elapsed.value++, 1000);
}

function handleBeforeUnload() {
  socket.emit("leave_queue");
}

// 🔥 [추가] 브라우저 뒤로가기 = 취소 버튼
onBeforeRouteLeave((_to, _from, next) => {
  socket.emit("leave_queue");
  clearInterval(timer);
  next();
});

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  startTimer();

  socket.off("queue_status");
  socket.on("queue_status", (data) => {
    console.log("📡 Received queue_status:", data);
    const currentGameType = ((route.query.game as string) || 'davinci').toLowerCase();
    if (data.gameType.toLowerCase() === currentGameType) {
        queueCount.value = data.count;
        queueMax.value = data.max;
    }
  });

  const betAmount = parseInt(route.query.bet as string) || 0; 
  const gameType = (route.query.game as string) || 'davinci';
  const config = getGameConfig(gameType);
  
  // 🔥 [FIX] Initialize queueMax based on game type immediately
  queueMax.value = gameType === 'davinci' ? 4 : 2;

  console.log("🔥 MatchingView mounted. GameType:", gameType, "Bet:", betAmount);

  // 🔥 [FIX] Use onAuthStateChanged to handle page refresh/direct access
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Auth initialized:", user.uid);
      loadUserProfile(user.uid).then(() => {
        console.log("🚀 Emitting join_queue for", gameType);
        socket.emit("join_queue", {
          uid: user.uid,
          name: user.displayName || "Guest",
          nickname: nickname.value,
          betAmount: betAmount,
          major: major.value,
          year: year.value,
          money: money.value,
          gameType: gameType
        });
      });
    } else {
      console.warn("⚠️ No user found in MatchingView");
      // Optional: Redirect to login if needed
      // router.push("/"); 
    }
  });

  socket.off("match:success");
  socket.on("match:success", ({ roomId, players }) => {
    clearInterval(timer);
    isMatched.value = true; 
    gameEntryGuard.allowed = true;
    (window as any).isGameEntryValid = true;
    
    const gameType = (route.query.game as string) || 'davinci';
    const config = getGameConfig(gameType);
    
    // 🔥 Pass initial players data to avoid loading delay
    router.replace({
        path: config.gameRoute(roomId), // It returns a string path
        state: { initialPlayers: players }
    });
  });
});



onUnmounted(() => {
  if (!isMatched.value) { // 🔥 [NEW] 매칭 성공 시에는 대기열 이탈 요청 안 함
    socket.emit("leave_queue");
  }
  clearInterval(timer);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  socket.off("match:success"); // 🔥 [NEW] 리스너 해제
});


</script>



<style scoped>
.match-container {
  max-width: 400px;
  margin: 120px auto;
  padding: 40px; /* 패딩 추가 */
  border-radius: 20px;
  background: rgba(15, 12, 41, 0.7); /* 어두운 배경에 살짝 투명도 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); /* 그림자 */
  text-align: center;
  color: #e0e0e0; /* 기본 텍스트 색상 밝게 */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; /* 폰트 통일 */
}

h1 {
  font-size: 2.8rem; /* 제목 크기 키움 */
  font-weight: 800;
  color: #f0f0f0; /* 흰색에 가까운 밝은 색 */
  margin-bottom: 30px;
  text-shadow: 0 0 15px rgba(66, 133, 244, 0.5); /* 파란색 그림자 추가 */
}

.profile-box {
  margin: 30px 0;
}

.profile-circle {
  width: 90px; /* 크기 약간 키움 */
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4285f4, #2196f3); /* 그라데이션 파란색 */
  color: white;
  font-size: 38px; /* 폰트 크기 키움 */
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  box-shadow: 0 0 15px rgba(66, 133, 244, 0.6); /* 빛나는 효과 */
  border: 3px solid rgba(255, 255, 255, 0.3); /* 테두리 추가 */
}

.profile-name {
  font-size: 24px; /* 폰트 크기 키움 */
  font-weight: bold;
  color: #add8e6; /* 밝은 하늘색 */
  text-shadow: 0 1px 5px rgba(0,0,0,0.3);
}

.timer-box {
  margin: 30px 0;
  font-size: 1.1rem; /* 폰트 크기 키움 */
  color: #c0c0c0; /* 회색조 */
}

.timer-box strong {
  color: #ffd700; /* 경과 시간 황금색으로 강조 */
  font-size: 1.2rem;
}

.queue-status {
  margin-top: 15px;
  font-weight: bold;
  font-size: 1.2rem;
  color: #90ee90; /* 밝은 녹색 */
  background: rgba(0, 128, 0, 0.2); /* 투명한 녹색 배경 */
  padding: 8px 15px;
  border-radius: 8px;
  border: 1px solid rgba(144, 238, 144, 0.5);
  display: inline-block; /* 배경이 텍스트에만 적용되도록 */
  box-shadow: 0 0 8px rgba(144, 238, 144, 0.4);
}

.timer-box p:last-of-type { /* '상대 찾는 중...' 문구 */
  margin-top: 20px;
  font-size: 1.3rem;
  color: #f0f0f0;
  animation: pulseGlow 1.5s infinite alternate; /* 깜빡이는 효과 */
}

@keyframes pulseGlow {
  from { text-shadow: 0 0 5px rgba(255, 255, 255, 0.3); opacity: 0.8; }
  to { text-shadow: 0 0 15px rgba(255, 255, 255, 0.8); opacity: 1; }
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 30px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  margin-top: 20px;
}

.cancel-btn:hover {
  background: rgba(255, 71, 87, 0.15);
  border-color: #ff4757;
  color: #ff4757;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 71, 87, 0.2);
}

.cancel-btn:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>