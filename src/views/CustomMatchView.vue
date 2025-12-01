<template>
  <UserProfile />
  <button class="back-btn" @click="goBack">
    <span class="icon">⬅️</span> {{ selectedGameType === 'omok' ? '오목 로비' : '다빈치 코드' }}
  </button>
  <div class="custom-container">
    <!-- 🔥 [추가] 뒤로가기 버튼 -->


    <div class="header-section">
      <h1>🎮 커스텀 매치</h1>
      <p class="sub-text">친구와 함께 플레이할 방을 만드세요</p>
    </div>

    <div class="action-section">
      <!-- 🔥 [추가] 게임 선택 -->
      <!-- 🔥 [수정] 게임 모드 표시 (선택 불가) -->
      <div class="game-info-box">
        <span class="game-icon">{{ selectedGameType === 'omok' ? '⚫' : '🧩' }}</span>
        <span class="game-title">{{ selectedGameType === 'omok' ? '오목 (Omok)' : '다빈치 코드 (Davinci Code)' }}</span>
      </div>

      <button class="create-btn" @click="createRoom">
        <span class="btn-icon">➕</span>
        <span class="btn-text">새로운 방 만들기</span>
      </button>

      <div class="divider">
        <span class="line"></span>
        <span class="text">OR</span>
        <span class="line"></span>
      </div>

      <div class="join-box">
        <label for="roomCodeInput" class="input-label">방 코드 입력</label>
        <input
          id="roomCodeInput"
          v-model="roomCode"
          placeholder="코드 6자리를 입력하세요"
          class="room-input"
          @keyup.enter="joinRoom"
        />
        <button class="join-btn" @click="joinRoom">
          <span class="btn-text">🚪 입장하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import { socket } from "../socket";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import UserProfile from "../components/UserProfile.vue";

const router = useRouter();
const route = useRoute(); // 🔥 [추가]
const roomCode = ref("");
const selectedGameType = ref<'davinci' | 'omok'>((route.query.game as 'davinci' | 'omok') || 'davinci'); // 🔥 [수정]

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

function onRoomState(_data: any) {
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
  
  // 🔥 [수정] 방 생성 시 캐릭터 정보 포함
  getDoc(doc(db, "users", currentUid.value)).then((snap) => {
      let userData: any = {};
      if (snap.exists()) {
          userData = snap.data();
      }
      
      socket.emit("create_room", {
        uid: currentUid.value,
        name: nickname.value,
        nickname: nickname.value,
        major: userData.major || "",
        year: userData.year || 0,
        money: userData.money || 0,
        character: userData.character || null, // 🔥 [FIX] Send character
        gameType: selectedGameType.value, // 🔥 [NEW] Send gameType
        roomName: `${nickname.value}'s Room`
      });
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

  // 🔥 [수정] 입장 시에도 상세 정보 전송
  getDoc(doc(db, "users", currentUid.value)).then((snap) => {
    let userData: any = {};
    if (snap.exists()) {
      userData = snap.data();
    }

    socket.emit("enter_room", {
      roomId: code,
      uid: currentUid.value,
      name: nickname.value,
      nickname: nickname.value,
      major: userData.major || "",
      year: userData.year || 0,
      money: userData.money || 0,
      character: userData.character || null // 🔥 [FIX] Send character
    });
  });
}

function goBack() {
  if (selectedGameType.value === 'omok') {
    router.push('/omok-home');
  } else {
    router.push('/davinci-home');
  }
}

// 🔥 [추가] 브라우저 뒤로가기 = 뒤로가기 버튼
onBeforeRouteLeave((_to, _from, next) => {
  next();
});
</script>

<style scoped>
/* 컨테이너 스타일 (유리 질감) */
.custom-container {
  max-width: 420px;
  margin: 100px auto;
  padding: 40px 30px;
  border-radius: 24px;
  background: rgba(15, 12, 41, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: white;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 헤더 영역 */
.header-section h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-shadow: 0 0 15px rgba(66, 133, 244, 0.6);
}

.sub-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin-bottom: 30px;
}

/* 버튼 공통 스타일 */
button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
}

button:hover {
  transform: translateY(-3px);
  filter: brightness(1.1);
}

button:active {
  transform: scale(0.98);
}

/* 방 만들기 버튼 */
.create-btn {
  background: linear-gradient(135deg, #4285f4, #34a853);
  box-shadow: 0 8px 20px rgba(52, 168, 83, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
}

/* 구분선 (OR) */
.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  font-weight: 600;
}

.divider .line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider .text {
  padding: 0 10px;
}

/* 입장하기 영역 */
.join-box {
  text-align: left;
}

.input-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  margin-left: 4px;
}

.room-input {
  width: 100%;
  padding: 16px;
  margin-bottom: 15px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box; /* 패딩 포함 크기 계산 */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  text-align: center;
  letter-spacing: 1px;
}

.room-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-weight: 400;
}

.room-input:focus {
  border-color: #8e44ad;
  box-shadow: 0 0 15px rgba(142, 68, 173, 0.4);
}

/* 입장 버튼 */
.join-btn {
  background: linear-gradient(135deg, #8e44ad, #c0392b);
  box-shadow: 0 8px 20px rgba(192, 57, 43, 0.3);
}

/* 🔥 [추가] 뒤로가기 버튼 스타일 */
.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  width: auto;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  font-size: 0.9rem;
  backdrop-filter: blur(5px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-5px);
}

/* 🔥 [추가] 게임 선택 스타일 */
/* 🔥 [NEW] Game Info Box */
.game-info-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.game-info-box .game-icon {
  font-size: 2rem;
}

.game-info-box .game-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd700;
}

/* Removed game-select-box styles */
</style>