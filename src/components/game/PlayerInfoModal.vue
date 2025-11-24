<template>
  <!-- 🔥 [FIX] v-if에서 v-show로 변경 - 반응성 문제 회피 -->
  <div v-show="isOpen && player" class="player-info-modal-overlay" @click.self="$emit('close')">
    <div class="player-info-modal">
      <div class="modal-header">
        <div class="player-avatar">👤</div>
        <h2>{{ player?.nickname || player?.name }}</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="label">이름</span>
          <span class="value">{{ player?.nickname || player?.name }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">학번</span>
          <span class="value">{{ player?.year || '-' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">전공</span>
          <span class="value">{{ player?.major || '-' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">보유 금액</span>
          <span class="value">💰 {{ player?.money?.toLocaleString() ?? 0 }}원</span>
        </div>

        <!-- 🔥 [추가] 베팅 금액 표시 -->
        <div class="info-item" v-if="player?.betAmount">
          <span class="label">베팅 금액</span>
          <span class="value money">⛃ {{ player?.betAmount?.toLocaleString() ?? 0 }}원</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Player {
  id: number;
  nickname?: string;
  name: string;
  major?: string;
  year?: number;
  money: number;
  uid: string;
  betAmount?: number; // 🔥 [추가]
}

const props = defineProps<{
  isOpen: boolean;
  player: Player | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 🔥 [DEBUG] 모달 조건을 watch로 모니터링
import { watch } from 'vue';

watch(() => props.isOpen, (newVal) => {
  console.log('🔔 PlayerInfoModal isOpen changed:', newVal);
  console.log('🔔 PlayerInfoModal player:', props.player);
  console.log('🔔 Should render?', newVal && props.player);
}, { immediate: true });

watch(() => props.player, (newVal) => {
  console.log('🔔 PlayerInfoModal player changed:', newVal);
}, { immediate: true });

function close() {
  console.log('🔔 Modal close() called');
  emit('close');
}
</script>

<style scoped>
.player-info-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* 🔥 [수정] 최대 z-index로 설정 */
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.player-info-modal {
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(20, 20, 40, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  min-width: 350px;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.player-avatar {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  margin: 0;
  background: linear-gradient(to right, #fff, #ccc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.close-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.value {
  font-size: 1.1rem;
  color: white;
  font-weight: 700;
}

.value.money {
  color: #ffd700;
  font-size: 1.2rem;
}
</style>
