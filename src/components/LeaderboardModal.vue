<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="icon">🏆</div>
        <h2>부자 랭킹</h2>
        <p class="subtitle">누가 가장 많은 돈을 모았을까요?</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>랭킹 불러오는 중...</p>
      </div>

      <div v-else class="ranking-list">
        <div v-for="(user, index) in leaders" :key="user.uid" class="ranking-item" :class="{ 'top-rank': index < 3, 'me': user.uid === myUid }">
          <div class="rank-badge">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          
          <div class="user-info">
            <div class="nickname">{{ user.nickname }}</div>
            <div class="major-info">{{ user.major }} {{ user.year }}학번</div>
          </div>
          
          <div class="money">
            {{ user.money.toLocaleString() }} ₩
          </div>
        </div>
      </div>

      <button class="close-btn" @click="$emit('close')">닫기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const props = defineProps<{
  isVisible: boolean;
}>();

defineEmits(['close']);

const leaders = ref<any[]>([]);
const loading = ref(false);
const myUid = auth.currentUser?.uid;

async function fetchLeaderboard() {
  loading.value = true;
  try {
    console.log("🏆 [Leaderboard] Fetching data...");
    // 🔥 [수정] 백엔드 API 호출로 변경
    const response = await fetch("/api/leaderboard");
    if (!response.ok) throw new Error("Failed to fetch leaderboard");
    
    const data = await response.json();
    console.log("🏆 [Leaderboard] Data received:", data);
    leaders.value = data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    // Fallback or error state handling could go here
  } finally {
    loading.value = false;
  }
}

watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    fetchLeaderboard();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 30px 20px 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
}

.icon {
  font-size: 3rem;
  margin-bottom: 10px;
  animation: bounce 2s infinite;
}

h2 {
  color: #ffd700;
  margin: 0;
  font-size: 1.8rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.subtitle {
  color: #aaa;
  margin: 5px 0 0;
  font-size: 0.9rem;
}

.ranking-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: transform 0.2s;
}

.ranking-item:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.1);
}

.ranking-item.me {
  background: rgba(66, 133, 244, 0.2);
  border: 1px solid rgba(66, 133, 244, 0.5);
}

.rank-badge {
  width: 40px;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  color: #fff;
}

.top-rank .rank-badge {
  font-size: 1.5rem;
}

.user-info {
  flex: 1;
  margin-left: 10px;
}

.nickname {
  font-weight: bold;
  color: white;
  font-size: 1.1rem;
}

.major-info {
  font-size: 0.8rem;
  color: #888;
}

.money {
  font-weight: bold;
  color: #ffd700;
  font-size: 1.1rem;
}

.loading-state {
  padding: 50px;
  text-align: center;
  color: #aaa;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.close-btn {
  margin: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
