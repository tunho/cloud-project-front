<template>
  <div class="lobby-wrapper">
    <div v-if="isLoading" class="loading-overlay">

    </div>
    <div v-else class="user-profile-section">
      <UserProfile />
    </div>
    <!-- 🔥 [추가] 뒤로가기 버튼 -->
    <button class="back-btn" @click="goBack">
      <span class="icon">⬅️</span> 플랫폼으로
    </button>

    <div class="lobby-card">
      <div class="header-area">
        <div class="game-icon">🧩</div>
        <h1>Davinci Code</h1>
        <p class="subtitle">숫자 추리 심리전의 정수</p>
      </div>

      <div class="action-area">
        <!-- 🔥 [Enhanced] 배팅 매치 버튼 -->
        <button class="action-btn betting-match-premium" @click="openBettingModal">
          <div class="btn-gradient-border"></div>
          <div class="btn-content">
            <span class="btn-icon">🎲</span>
            <div class="text-group">
              <span class="btn-title">배팅 매치</span>
              <span class="btn-subtitle">승부를 걸어보세요</span>
            </div>
            <span class="btn-arrow">→</span>
          </div>
          <div class="btn-glow-effect"></div>
        </button>

        <button class="action-btn custom-match" @click="goCustomMatch">
          <div class="btn-content">
            <span class="btn-icon">🎮</span>
            <div class="text-group">
              <span class="btn-title">커스텀 매치</span>
              <span class="btn-desc">방을 만들거나 친구와 대결</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- 🔥 [Enhanced] 배팅 금액 입력 모달 -->
    <div v-if="showBettingModal" class="modal-overlay-premium" @click.self="closeBettingModal">
      <div class="modal-content-premium">
        <!-- 🔥 [NEW] Close Button -->
        <button class="close-modal-btn" @click="closeBettingModal">×</button>

        <div class="modal-header">
          <div class="modal-icon">🎲</div>
          <h2>배팅 금액 설정</h2>
          <p class="modal-subtitle">승부를 걸 금액을 선택하세요</p>
        </div>
        
        <div class="money-display">
          <span class="label">보유 금액</span>
          <span class="amount">{{ currentMoney.toLocaleString() }}원</span>
        </div>

        <div class="input-section">
          <div class="input-wrapper">
            <input 
              type="number" 
              v-model.number="betAmount" 
              :placeholder="`10 ~ ${currentMoney}`"
              :max="currentMoney"
              min="10"
              @keyup.enter="confirmBetting"
            />
            <span class="unit-label">원</span>
          </div>
          
          <div class="range-slider">
            <input 
              type="range" 
              v-model.number="betAmount" 
              :min="10" 
              :max="currentMoney || 100"
              step="10"
            />
          </div>
        </div>

        <div class="quick-chips">
          <button class="chip-btn" @click="setBetAmount(1000)">
            <span class="chip-value">1,000</span>
          </button>
          <button class="chip-btn" @click="setBetAmount(5000)">
            <span class="chip-value">5,000</span>
          </button>
          <button class="chip-btn" @click="setBetAmount(10000)">
            <span class="chip-value">10,000</span>
          </button>
          <button class="chip-btn max" @click="setMaxBet">
            <span class="chip-value">MAX</span>
          </button>
        </div>

        <p v-if="errorMessage" class="error-message-premium">⚠️ {{ errorMessage }}</p>

        <div class="modal-actions">
          <!-- 🔥 [FIX] Cancel button removed, Confirm button centered -->
          <button class="confirm-btn" @click="confirmBetting" :disabled="!isValidBet">
            매칭 시작
          </button>
        </div>
      </div>
    </div>
  </div>



</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { socket, gameEntryGuard } from "../socket";
import UserProfile from "../components/UserProfile.vue";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const router = useRouter();

// 상태값
const showBettingModal = ref(false);
const betAmount = ref(1000);
const currentMoney = ref(0);
const currentUid = ref("");
const errorMessage = ref("");
const nickname = ref("Guest");
const userProfile = ref({ major: "", year: 0 }); // 🔥 [FIX] Store profile data
const isLoading = ref(true); // 🔥 [추가] 로딩 상태

// 🔥 [NEW] Computed Property for Betting Validation
const isValidBet = computed(() => {
  return (
    betAmount.value >= 10 &&
    betAmount.value <= currentMoney.value &&
    Number.isInteger(betAmount.value)
  );
});

function openBettingModal() {
  betAmount.value = Math.min(1000, currentMoney.value); // 기본값 설정, 보유 금액 초과하지 않도록
  errorMessage.value = "";
  showBettingModal.value = true;
}

function closeBettingModal() {
  showBettingModal.value = false;
}

function setBetAmount(amount: number) {
  betAmount.value = Math.min(amount, currentMoney.value);
}

function setMaxBet() {
  betAmount.value = currentMoney.value;
}

// 🔥 [FIX] 보유 금액이 로드되면 배팅 금액 범위 재설정
import { watch } from "vue";
watch(currentMoney, (newVal) => {
  if (betAmount.value > newVal) {
    betAmount.value = newVal;
  }
  if (betAmount.value === 0 && newVal > 0) {
    betAmount.value = Math.min(1000, newVal);
  }
});

function confirmBetting() {
  if (!betAmount.value || betAmount.value <= 0) {
    errorMessage.value = "배팅 금액을 입력해주세요.";
    return;
  }
  if (betAmount.value < 10) { // 최소 배팅 금액 예시
    errorMessage.value = "최소 10원 이상 배팅해야 합니다.";
    return;
  }
  if (betAmount.value > currentMoney.value) {
    errorMessage.value = "보유 금액을 초과할 수 없습니다.";
    return;
  }

  // 매칭 시작: 소켓 전송은 MatchingView에서 처리하도록 위임 (중복 전송 방지)
  // socket.emit("join_queue", ...); 
  
  closeBettingModal();
  router.push({ path: "/matching", query: { bet: betAmount.value.toString() } }); // 🔥 [FIX] Pass bet amount
}

// 커스텀 매치 페이지로 이동
function goCustomMatch() {
  router.push("/custom-match");
}

function goBack() {
  router.push("/platform");
}

// 🔥 [추가] 브라우저 뒤로가기 = 뒤로가기 버튼 (onBeforeRouteLeave는 제거됨)

socket.on("match:success", (data) => {
  // data = { roomId, opponent }
  (window as any).isGameEntryValid = true; // 🔥 [NEW] Set valid entry flag
  router.push(`/room/${data.roomId}/play`);
});

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUid.value = user.uid;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        currentMoney.value = data.money || 0;
        nickname.value = data.nickname || "Guest";
        userProfile.value = { major: data.major || "", year: data.year || 0 }; // 🔥 [FIX] Load profile
      }
      isLoading.value = false; // 🔥 로딩 완료
    } else {
      // 🔥 로그인 안 된 경우만 이동
      router.push("/login");
    }
  });
});

onUnmounted(() => {
  socket.off("match:success");
});
</script>

<style scoped>
.lobby-wrapper {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: white;
  position: relative;
}

.lobby-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 4rem 3rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  text-align: center;
  position: relative;
  z-index: 1;
  animation: zoomIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.header-area {
  margin-bottom: 3rem;
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.header-area h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #fff, #ccc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
}

.subtitle {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-btn {
  position: relative;
  width: 100%;
  padding: 1.5rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-align: left;
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-icon {
  font-size: 2.5rem;
}

.text-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.btn-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: white;
}

.btn-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Auto Match Button Styles */
.auto-match {
  background: linear-gradient(135deg, #4285f4, #34a853);
  box-shadow: 0 10px 20px rgba(66, 133, 244, 0.3);
}

.auto-match:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(66, 133, 244, 0.5);
}

.auto-match .btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.5s ease;
}

.auto-match:hover .btn-glow {
  opacity: 1;
  transform: scale(1);
}

/* Custom Match Button Styles */
.custom-match {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-match:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}

/* 🔥 [추가] 뒤로가기 버튼 스타일 */
.back-btn {
  position: absolute;
  top: 30px;
  left: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  z-index: 10;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-5px);
}

.back-btn .icon {
  font-size: 1.2rem;
}

/* 🔥 ========== PREMIUM BETTING BUTTON ========== */
.betting-match-premium {
  position: relative;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
  box-shadow: 0 15px 35px rgba(245, 87, 108, 0.4);
  overflow: visible !important;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.betting-match-premium::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #ffd700);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;  /* 🔥 Changed from 0.6 to 0 to hide the rotating border */
  animation: none;  /* 🔥 Removed animation */
}

/* @keyframes border-rotate {
  to { transform: rotate(360deg); }
} */  /* 🔥 Commented out - no longer needed */

.betting-match-premium .btn-content {
  justify-content: space-between;
}

.betting-match-premium .btn-arrow {
  font-size: 1.5rem;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.betting-match-premium:hover .btn-arrow {
  transform: translateX(5px);
}

.betting-match-premium .btn-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.betting-match-premium:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 45px rgba(245, 87, 108, 0.6);
}

.btn-glow-effect {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.betting-match-premium:hover .btn-glow-effect {
  opacity: 1;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.6; }
}

/* 🔥 ========== PREMIUM MODAL OVERLAY ========== */
.modal-overlay-premium {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 🔥 ========== PREMIUM MODAL CONTENT ========== */
.modal-content-premium {
  background: rgba(15, 12, 41, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 2.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(245, 87, 108, 0.2);
  animation: modalSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

@keyframes modalSlideIn {
  from { transform: scale(0.9) translateY(30px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

/* 🔥 [NEW] Close Button */
.close-modal-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 10;
}

.close-modal-btn:hover {
  color: white;
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

.modal-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(to right, #ffd700, #ff6b6b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* Money Display */
.money-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  margin-bottom: 1.5rem;
}

.money-display .label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.money-display .amount {
  font-size: 1.3rem;
  font-weight: 800;
  color: #ffd700;
}

/* Input Section */
.input-section {
  margin-bottom: 1.5rem;
}

.input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.input-wrapper input[type="number"] {
  width: 100%;
  padding: 1.2rem 4rem 1.2rem 1.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  outline: none;
  transition: all 0.3s ease;
  text-align: left;
}

.input-wrapper input[type="number"]:focus {
  border-color: #f5576c;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 20px rgba(245, 87, 108, 0.3);
}

.unit-label {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
}

/* Range Slider */
.range-slider input[type="range"] {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  outline: none;
  -webkit-appearance: none;
}

.range-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(245, 87, 108, 0.5);
  transition: all 0.2s ease;
}

.range-slider input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 20px rgba(245, 87, 108, 0.8);
}

/* Quick Chips */
.quick-chips {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.chip-btn {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chip-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #f5576c;
  transform: translateY(-2px);
}

.chip-btn.max {
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  border: none;
}

.chip-btn.max:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
}

.chip-value {
  font-size: 0.9rem;
}

/* Error Message */
.error-message-premium {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 10px;
  padding: 0.8rem 1rem;
  margin-bottom: 1.5rem;
  color: #ff6b6b;
  font-size: 0.9rem;
  text-align: center;
}

/* Modal Footer */
.modal-actions {
  display: flex;
  justify-content: center; /* 🔥 [FIX] Center the button */
  margin-top: 24px;
}

.confirm-btn {
  width: auto; /* 🔥 [FIX] Auto width for better centering */
  min-width: 200px; /* 🔥 [FIX] Min width for touch targets */
  padding: 16px 40px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  border: none;
  border-radius: 15px;
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.6);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}


.btn-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to { left: 100%; }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>
