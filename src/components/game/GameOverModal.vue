<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content" :class="{ victory: isVictory, defeat: !isVictory }">
      <div class="result-header">
        <div class="icon">{{ isVictory ? '🏆' : '💀' }}</div>
        <h1>{{ isVictory ? 'VICTORY' : 'DEFEAT' }}</h1>
        <p class="rank-text">{{ myRank }}위로 마감했습니다</p>
      </div>

      <div class="payout-details">
        <div class="money-change" :class="{ positive: netChange > 0, negative: netChange < 0 }">
          {{ netChange > 0 ? '+' : '' }}{{ netChange.toLocaleString() }} ₩
        </div>
        <div class="total-money">
          보유 자산: {{ newTotal.toLocaleString() }} ₩
        </div>
      </div>

      <div class="action-area">
        <button class="lobby-btn" @click="$emit('close')">로비로 돌아가기</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  isVisible: boolean;
  myResult: {
    rank: number;
    net_change: number;
    new_total: number;
  } | null;
}>();

defineEmits(['close']);

const isVictory = computed(() => props.myResult?.rank === 1);
const myRank = computed(() => props.myResult?.rank || '-');
const netChange = computed(() => props.myResult?.net_change ?? 0); // 🔥 [FIX] Use nullish coalescing to default to 0
const newTotal = computed(() => props.myResult?.new_total ?? 0);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  align-items: center;
  z-index: 10000; /* 🔥 [FIX] Increased z-index */
  animation: fadeIn 0.5s ease;
}

.modal-content {
  background: rgba(20, 20, 35, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 30px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.modal-content.victory {
  border-color: #ffd700;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
}

.modal-content.defeat {
  border-color: #ff4757;
  box-shadow: 0 0 50px rgba(255, 71, 87, 0.3);
}

.result-header {
  margin-bottom: 2rem;
}

.icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

h1 {
  font-size: 3rem;
  margin: 0;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(to bottom, #fff, #aaa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.victory h1 {
  background: linear-gradient(to bottom, #ffd700, #ffaa00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.defeat h1 {
  background: linear-gradient(to bottom, #ff6b6b, #c0392b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.rank-text {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.payout-details {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 2rem;
}

.money-change {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.money-change.positive { color: #2ecc71; text-shadow: 0 0 10px rgba(46, 204, 113, 0.5); }
.money-change.negative { color: #ff4757; text-shadow: 0 0 10px rgba(255, 71, 87, 0.5); }

.total-money {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.lobby-btn {
  background: white;
  color: black;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.lobby-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>
