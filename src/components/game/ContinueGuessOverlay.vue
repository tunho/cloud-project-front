<template>
  <div v-if="isVisible" class="continue-overlay">
    <div class="modal-card">
      <div class="modal-body">
        <div class="icon-check">✅</div>
        <h3 class="title">정답입니다!</h3>
        <p class="description">턴을 넘기시겠습니까, 계속 하시겠습니까?</p>
        
        <div v-if="timer > 0" class="timer-badge">
          남은 시간: {{ timer }}초
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('pass')">
          턴 넘기기
        </button>
        <button class="btn-primary" @click="$emit('continue')">
          계속하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isVisible: boolean;
  timer: number;
}>();

defineEmits(["continue", "pass"]);
</script>

<style scoped>
/* 배경 오버레이: 단순한 반투명 검정 */
.continue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 블러 제거, 단순 어두움 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* 모달 카드: 흰색 배경, 깔끔한 그림자 */
.modal-card {
  background-color: white;
  width: 320px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.2s ease-out;
}

/* 내용 영역 */
.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon-check {
  font-size: 2rem;
  margin-bottom: 8px;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.description {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

.timer-badge {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #4285f4; /* 포인트 컬러 (파랑) */
  background-color: #e8f0fe;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}

/* 버튼 영역 */
.modal-footer {
  display: flex;
  gap: 10px;
}

button {
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

/* 보조 버튼 (턴 넘기기): 회색 톤 */
.btn-secondary {
  background-color: #f1f3f5;
  color: #495057;
}

.btn-secondary:hover {
  background-color: #e9ecef;
}

/* 메인 버튼 (계속하기): 파란색 톤 (강조) */
.btn-primary {
  background-color: #4285f4;
  color: white;
}

.btn-primary:hover {
  background-color: #3367d6;
}

/* 등장 애니메이션: 살짝 올라오기 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>