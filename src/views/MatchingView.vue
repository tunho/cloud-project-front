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
import { useRouter } from "vue-router";
import { socket } from "../socket";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const router = useRouter();

const nickname = ref("...");
const firstLetter = ref("?");
const elapsed = ref(0);
let timer: number;

const queueCount = ref(0);
const queueMax = ref(4);

async function loadUserProfile() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    nickname.value = data.nickname;
    firstLetter.value = data.nickname?.[0]?.toUpperCase() ?? "?";
  }
}

function cancelMatch() {
  socket.emit("leave_queue");   // ❗ uid 보내지 않음
  clearInterval(timer);
  router.push("/davinci-home");
}

function startTimer() {
  timer = setInterval(() => elapsed.value++, 1000);
}

function handleBeforeUnload() {
  socket.emit("leave_queue");   // ❗ same
}

onMounted(async () => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  const uid = auth.currentUser?.uid;

  await loadUserProfile();
  startTimer();

  // 1️⃣ queue 상태 수신
  socket.off("queue_status");
  socket.on("queue_status", (data) => {
    queueCount.value = data.count;
    queueMax.value = data.max;
  });

  // 2️⃣ 매칭 성공 시
  socket.off("match:success");
  socket.on("match:success", ({ roomId }) => {
    clearInterval(timer);
    router.push(`/room/${roomId}/play`); // ← 정답
  });

  // 3️⃣ 매칭 요청
  socket.emit("join_queue", {
  uid,                       // 🔥 uid 필수
  name: nickname.value,      // 🔥 nickname → name으로 변경
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
  text-align: center;
}
.profile-box {
  margin: 20px 0;
}
.profile-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #2196f3;
  color: white;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}
.profile-name {
  font-size: 20px;
  font-weight: bold;
}
.timer-box {
  margin: 20px 0;
  font-size: 16px;
}
.queue-status {
  margin-top: 10px;
  font-weight: bold;
  color: #444;
}
.cancel-btn {
  background: #e53935;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
}
</style>
