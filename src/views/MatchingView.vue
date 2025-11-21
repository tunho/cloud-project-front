<template>
  <div class="match-container">
    <h1>매칭 중…</h1>

    <div class="profile-box">
      <div class="profile-circle">{{ firstLetter }}</div>
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
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { socket } from "../socket";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

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
  router.push("/davinci-home");
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
    queueCount.value = data.count;
    queueMax.value = data.max;
  });

  const betAmount = parseInt(route.query.bet as string) || 0; 

  socket.off("match:success");
  socket.on("match:success", ({ roomId }) => {
    clearInterval(timer);
    router.replace(`/room/${roomId}/play`); 
  });

  // 🔥 [FIX] Wait for Auth to be ready
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      await loadUserProfile(user.uid);
      
      console.log("🚀 Joining Queue with:", {
        uid: user.uid,
        nickname: nickname.value,
        major: major.value,
        year: year.value,
        money: money.value,
        betAmount
      });

      socket.emit("join_queue", {
        uid: user.uid,
        nickname: nickname.value,
        major: major.value,
        year: year.value,
        money: money.value,
        betAmount: betAmount 
      });
    } else {
      console.warn("⚠️ No authenticated user found in MatchingView");
      router.push("/"); // Redirect to login if not auth
    }
  });

  onUnmounted(() => {
    unsubscribe();
  });
});

onUnmounted(() => {
  socket.emit("leave_queue");
  clearInterval(timer);
  window.removeEventListener("beforeunload", handleBeforeUnload);
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
  background: linear-gradient(45deg, #ff6b6b, #e53935); /* 붉은색 그라데이션 */
  color: white;
  border: none;
  padding: 16px 30px; /* 패딩 키움 */
  border-radius: 12px; /* 둥근 모서리 */
  cursor: pointer;
  font-size: 1.1rem; /* 폰트 크기 키움 */
  font-weight: bold;
  box-shadow: 0 5px 15px rgba(229, 57, 53, 0.4); /* 그림자 */
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.cancel-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(229, 57, 53, 0.6);
  background: linear-gradient(45deg, #ff8a80, #ff5252);
}

.cancel-btn:active {
  transform: translateY(0);
  box-shadow: 0 3px 10px rgba(229, 57, 53, 0.4);
}
</style>