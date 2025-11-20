<template>
  <div v-if="isWaitingForResult" class="loading-overlay">
    <div class="spinner"></div>
    <div class="loading-text">추리 확인 중...</div>
  </div>

  <div v-if="showResultModal && guessResult" class="result-overlay">
    <div class="result-card" :class="{ 'success': guessResult.correct, 'fail': !guessResult.correct }">
      <div class="result-icon">{{ guessResult.correct ? 'O' : 'X' }}</div>
      <div class="result-title">{{ guessResult.correct ? '추리 성공!' : '추리 실패!' }}</div>
      <div class="result-info">
        정답은 <strong>{{ guessResult.value === 12 ? '조커' : guessResult.value }}</strong> 였습니다.
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
defineProps<{
  isWaitingForResult: boolean;
  showResultModal: boolean;
  guessResult: { correct: boolean; value: number } | null;
}>();
</script>

<style scoped>
/* 로딩 스타일 */
.loading-overlay {
  display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 200;
}
.spinner {
  width: 50px; height: 50px; border: 6px solid rgba(255,255,255,0.1); border-top: 6px solid #4285f4;
  border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px;
}
.loading-text { color: white; font-size: 20px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* 결과 모달 스타일 */
.result-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center; z-index: 300; animation: fadeIn 0.3s;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
}
.result-card {
  width: 320px; padding: 40px; border-radius: 24px; 
  background: rgba(30, 30, 40, 0.95); border: 1px solid rgba(255,255,255,0.1);
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6); text-align: center; color: white;
  transform: scale(0.8); animation: popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.result-card.success { border: 2px solid #4CAF50; box-shadow: 0 0 30px rgba(76, 175, 80, 0.3); }
.result-card.fail { border: 2px solid #F44336; box-shadow: 0 0 30px rgba(244, 67, 54, 0.3); }

.result-icon { font-size: 70px; font-weight: 900; margin-bottom: 15px; }
.success .result-icon { color: #4CAF50; text-shadow: 0 0 20px rgba(76, 175, 80, 0.5); }
.fail .result-icon { color: #F44336; text-shadow: 0 0 20px rgba(244, 67, 54, 0.5); }

.result-title { font-size: 32px; font-weight: 800; margin-bottom: 15px; }
.result-info { font-size: 18px; color: #ccc; line-height: 1.5; }
.result-info strong { color: white; font-size: 22px; }

/* 액션 알림창 스타일 */


@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popUp { to { transform: scale(1); } }
@keyframes slideUpFade { 
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); } 
}
</style>