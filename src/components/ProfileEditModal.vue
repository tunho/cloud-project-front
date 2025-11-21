<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>내 정보 수정</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>닉네임</label>
          <input type="text" v-model="form.nickname" placeholder="닉네임을 입력하세요" />
        </div>
        
        <div class="form-group">
          <label>전공</label>
          <input type="text" v-model="form.major" placeholder="전공을 입력하세요" />
        </div>
        
        <div class="form-group">
          <label>학번</label>
          <input type="number" v-model.number="form.year" placeholder="학번을 입력하세요 (예: 20)" />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close">취소</button>
        <button class="btn-save" @click="saveProfile" :disabled="isSaving">
          {{ isSaving ? '저장 중...' : '저장' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps<{
  isOpen: boolean;
  uid: string;
  initialData: {
    nickname: string;
    major: string;
    year: number;
  };
}>();

const emit = defineEmits(['close', 'updated']);

const form = ref({
  nickname: '',
  major: '',
  year: 0
});

const isSaving = ref(false);
const errorMessage = ref('');

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = { ...props.initialData };
    errorMessage.value = '';
  }
});

async function saveProfile() {
  if (!form.value.nickname.trim()) {
    errorMessage.value = '닉네임을 입력해주세요.';
    return;
  }

  isSaving.value = true;
  errorMessage.value = '';

  try {
    const userRef = doc(db, "users", props.uid);
    await updateDoc(userRef, {
      nickname: form.value.nickname,
      major: form.value.major,
      year: form.value.year
    });
    
    emit('updated', form.value);
    emit('close');
  } catch (e) {
    console.error("Profile update error:", e);
    errorMessage.value = '저장 중 오류가 발생했습니다.';
  } finally {
    isSaving.value = false;
  }
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1e1e2e;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  cursor: pointer;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: #2a2a3a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
}

.form-group input:focus {
  border-color: #4CAF50;
  outline: none;
}

.error-message {
  color: #ff4757;
  font-size: 0.9rem;
  margin-top: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #444;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.btn-save {
  padding: 10px 20px;
  background: #4CAF50;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
