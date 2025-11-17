<template>
  <div class="room-container">
    <h1>🎮 커스텀 매치</h1>

    <p class="room-code">
      방 코드: <strong>{{ roomId }}</strong>
      <button @click="copyRoomCode" class="copy-btn">복사</button>
    </p>

    <h2>참가자</h2>

    <div class="player-list">
      <div
        v-for="p in players"
        :key="p.uid"
        class="player-card"
      >
        <span class="name">
          {{ p.name }}
          <span v-if="p.id === 0">(방장)</span>
        </span>
      </div>
    </div>

    <!-- 방장만 게임 시작 가능 -->
    <button
      v-if="isHost"
      class="start-btn"
      @click="startGame"
    >
      🚀 게임 시작
    </button>

    <button class="leave-btn" @click="leaveRoom">
      나가기
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { socket } from "../socket";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const router = useRouter();
const route = useRoute();
const roomId = route.params.roomId as string;

// -------------------------
// 반응형 상태
// -------------------------
const currentUid = ref<string | null>(null);
const nickname = ref("Guest");
const players = ref<any[]>([]);
const isHost = ref(false);
const mySid = ref(socket.id); // 재접속 대비

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
    } else {
      currentUid.value = null;
      nickname.value = "Guest";
    }
  });
}

// -------------------------
// 소켓 이벤트 핸들러
// -------------------------
function onRoomState(data: any) {
  players.value = data.players || [];

  const me = players.value.find((p: any) => p.uid === currentUid.value);
  if (me) isHost.value = me.id === 0;
}

function onGameStarted(data: any) {
  if (data.roomId === roomId) {
    gameHasStarted.value = true;
    router.push(`/room/${roomId}/play`);
  }
}

function onErrorMessage({ message }: { message: string }) {
  alert(message);
}

// -------------------------
// 방 나가기
// -------------------------
function leaveRoom() {
  if (currentUid.value) {
    socket.emit("leave_room", { roomId, uid: currentUid.value });
  }
  router.push("/custom-match");
}

// 새로고침 / 창 닫기 방지
function handleBeforeUnload() {
  if (currentUid.value && !gameHasStarted.value) {
    socket.emit("leave_room", { roomId, uid: currentUid.value });
  }
}

// -------------------------
// 게임 시작
// -------------------------
function startGame() {
  socket.emit("start_game", { roomId });
}

// -------------------------
// onMounted
// -------------------------
let unsubscribeAuth: () => void;

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);

  unsubscribeAuth = bindAuthListener();

  // 소켓 리스너 등록
  socket.on("room_state", onRoomState);
  socket.on("game_started", onGameStarted);
  socket.on("error_message", onErrorMessage);

  // 방 입장 시 서버에 알림
  if (auth.currentUser?.uid)
    socket.emit("enter_room", {
      roomId,
      uid: auth.currentUser.uid,
      name: nickname.value,
    });
});

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(roomId);
    alert("방 코드가 복사되었습니다!");
  } catch (err) {
    console.error("클립보드 복사 실패:", err);
    alert("복사 실패… 브라우저 권한을 확인해주세요.");
  }
}

// -------------------------
// onUnmounted
// -------------------------
onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);

  unsubscribeAuth?.();

  socket.off("room_state", onRoomState);
  socket.off("game_started", onGameStarted);
  socket.off("error_message", onErrorMessage);

  // 로비에서 화면 이동 시에만 leave_room 실행
  if (!gameHasStarted.value && currentUid.value) {
    socket.emit("leave_room", {
      roomId,
      uid: currentUid.value,
    });
  }
});
</script>

<style scoped>
.room-container {
  max-width: 500px;
  margin: 100px auto;
  text-align: center;
}
.room-code {
  font-size: 18px;
  margin-bottom: 20px;
}
.copy-btn {
  margin-left: 10px;
  padding: 4px 8px;
  font-size: 14px;
}
.player-list {
  margin: 20px 0;
}
.player-card {
  background: #f0f0f0;
  padding: 12px;
  margin: 10px;
  border-radius: 8px;
}
.name {
  font-size: 18px;
}
.start-btn {
  background: #4caf50;
  color: white;
  padding: 14px 20px;
  font-size: 18px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 20px;
}
.leave-btn {
  background: #e53935;
  color: white;
  padding: 12px 20px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  margin-top: 20px;
  cursor: pointer;
}
</style>
