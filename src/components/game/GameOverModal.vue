<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content" :class="{ victory: isVictory, defeat: !isVictory }">
      <div class="result-header">
        <div class="icon">{{ isVictory ? '🏆' : '💀' }}</div>
        <h1>{{ isVictory ? 'VICTORY' : 'GAME OVER' }}</h1>
        <p class="rank-text">{{ myRank }}위로 마감했습니다</p>
      </div>

      <!-- 🔥 [NEW] 전체 순위 및 정산 내역 표시 -->
      <div class="leaderboard">
        <div v-for="p in sortedResults" :key="p.uid" class="leaderboard-item" :class="{ 'me': p.uid === myUid }">
          <div class="rank-badge">{{ p.rank }}위</div>
          <div class="player-info">
            <span class="name">{{ p.nickname }}</span>
            <span class="bet-info">베팅: {{ p.bet.toLocaleString() }}</span>
          </div>
          <div class="money-change" :class="{ positive: p.net_change > 0, negative: p.net_change < 0 }">
            {{ p.net_change > 0 ? '+' : '' }}{{ p.net_change.toLocaleString() }}
          </div>
        </div>
      </div>

      <div class="payout-details" v-if="myResult">
        <div class="total-money">
          내 최종 자산: {{ myResult.new_total.toLocaleString() }} ₩
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
    uid: string;
    nickname: string;
    rank: number;
    bet: number;
    net_change: number;
    new_total: number;
  } | null;
  allResults?: any[]; // 🔥 [NEW] 전체 결과 리스트
}>();

defineEmits(['close']);

const isVictory = computed(() => props.myResult?.rank === 1);
const myRank = computed(() => props.myResult?.rank || '-');
const myUid = computed(() => props.myResult?.uid || '');

// 🔥 [NEW] 순위별 정렬
const sortedResults = computed(() => {
  if (!props.allResults) return props.myResult ? [props.myResult] : [];
  return [...props.allResults].sort((a, b) => a.rank - b.rank);
});
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
  z-index: 10000;
  animation: fadeIn 0.5s ease;
}

.modal-content {
  background: rgba(20, 20, 35, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 30px;
  text-align: center;
  width: 90%;
  max-width: 500px; /* 조금 더 넓게 */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.modal-content.victory { border-color: #ffd700; box-shadow: 0 0 50px rgba(255, 215, 0, 0.3); }
.modal-content.defeat { border-color: #ff4757; box-shadow: 0 0 50px rgba(255, 71, 87, 0.3); }

.result-header { margin-bottom: 1.5rem; }
.icon { font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 2s infinite; }
h1 { font-size: 2.5rem; margin: 0; font-weight: 900; letter-spacing: 2px; background: linear-gradient(to bottom, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.victory h1 { background: linear-gradient(to bottom, #ffd700, #ffaa00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.defeat h1 { background: linear-gradient(to bottom, #ff6b6b, #c0392b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.rank-text { font-size: 1.1rem; color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem; }

/* 🔥 Leaderboard Styles */
.leaderboard {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 10px;
}
.leaderboard-item:last-child { border-bottom: none; }
.leaderboard-item.me { background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3); }

.rank-badge {
  width: 30px; height: 30px;
  background: #333;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 0.8rem;
  color: #fff;
}
.leaderboard-item:nth-child(1) .rank-badge { background: #ffd700; color: #000; }
.leaderboard-item:nth-child(2) .rank-badge { background: #c0c0c0; color: #000; }
.leaderboard-item:nth-child(3) .rank-badge { background: #cd7f32; color: #000; }

.player-info { flex: 1; text-align: left; display: flex; flex-direction: column; }
.player-info .name { font-weight: bold; font-size: 0.95rem; }
.player-info .bet-info { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

.money-change { font-weight: bold; font-size: 1rem; }
.money-change.positive { color: #2ecc71; }
.money-change.negative { color: #ff4757; }

.payout-details { margin-bottom: 1.5rem; }
.total-money { font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); }

.lobby-btn {
  background: white; color: black; border: none; padding: 1rem 2rem;
  font-size: 1.1rem; font-weight: 700; border-radius: 50px; cursor: pointer;
  transition: all 0.3s ease; width: 100%;
}
.lobby-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(255, 255, 255, 0.2); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>
