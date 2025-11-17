<template>
  <div class="custom-container">
    <h1>🎮 커스텀 매치</h1>

    <button class="create-btn" @click="createRoom">
      ➕ 방 만들기
    </button>

    <div class="join-box">
      <input
        v-model="roomCode"
        placeholder="방 코드 입력"
        class="room-input"
      />
      <button class="join-btn" @click="joinRoom">
        🚪 입장하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { socket } from "../socket";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const router = useRouter();
const roomCode = ref("");

// 사용자 표시명
const currentUid = ref<string | null>(null);
const nickname = ref("Guest");

// -------------------------------------------------
// Firebase Auth → 사용자 닉네임 동기화
// -------------------------------------------------
let unsubscribeAuth: () => void;

async function loadNickname(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  nickname.value = snap.exists() ? snap.data().nickname : "Guest";
}

onMounted(() => {
  // Firebase auth listener
  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUid.value = user.uid;
      await loadNickname(user.uid);
    } else {
      currentUid.value = null;
      nickname.value = "Guest";
    }
  });

  // Socket listeners (중복 방지)
  socket.on("room_created", onRoomCreated);
  socket.on("room_state", onRoomState);
  socket.on("error_message", onErrorMessage);
});

onUnmounted(() => {
  unsubscribeAuth?.();

  socket.off("room_created", onRoomCreated);
  socket.off("room_state", onRoomState);
  socket.off("error_message", onErrorMessage);
});

// -------------------------------------------------
// 소켓 핸들러
// -------------------------------------------------
function onRoomCreated({ roomId }: { roomId: string }) {
  router.push(`/custom-match/${roomId}`);
}

function onRoomState(data: any) {
  // 방 상태를 받았다는 것은 입장이 성공했다는 의미
  const code = roomCode.value.trim();
  router.push(`/custom-match/${code}`);
}

function onErrorMessage({ message }: { message: string }) {
  alert(message);
}

// -------------------------------------------------
// 방 만들기
// -------------------------------------------------
function createRoom() {
  if (!currentUid.value) return;

  socket.emit("create_room", {
    uid: currentUid.value,
    name: nickname.value,
  });
}

// -------------------------------------------------
// 방 참여하기
// -------------------------------------------------
function joinRoom() {
  if (!currentUid.value) return;

  const code = roomCode.value.trim();
  if (!code) {
    alert("방 코드를 입력해주세요.");
    return;
  }

  // emit만 실행해야 함 (리스너를 여기 추가 X)
  socket.emit("enter_room", {
    roomId: code,
    uid: currentUid.value,
    name: nickname.value,
  });
}
</script>

<style scoped>
.custom-container {
  max-width: 400px;
  margin: 120px auto;
  text-align: center;
}

.create-btn,
.join-btn {
  padding: 12px 20px;
  border-radius: 10px;
  background: #4caf50;
  color: white;
  border: none;
  margin: 10px 0;
  cursor: pointer;
  font-size: 16px;
}

.join-box {
  margin-top: 20px;
}

.room-input {
  width: 200px;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}
</style>
