<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>내 정보 수정</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 🔥 [NEW] Character Preview -->
        <div class="character-preview" v-if="initialData.character">
          <CharacterAvatar 
            :seed="initialData.character.seed"
            :skinColor="initialData.character.skinColor"
            :top="initialData.character.top"
            :hairColor="initialData.character.hairColor"
            :hatColor="initialData.character.hatColor"
            :eyes="initialData.character.eyes"
            :mouth="initialData.character.mouth"
            :eyebrows="initialData.character.eyebrows"
            :accessories="initialData.character.accessories"
            :clothing="initialData.character.clothing"
            :clothesColor="initialData.character.clothesColor"
            :backgroundColor="initialData.character.backgroundColor"
            :size="100"
            mode="face"
          />
        </div>

        <div class="form-group">
          <label>닉네임</label>
          <input type="text" v-model="form.nickname" placeholder="닉네임을 입력하세요" />
        </div>
        
        <div class="form-group">
          <label>전공</label>
          <select v-model="form.major">
            <option disabled value="">전공 선택</option>
            <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>학번</label>
          <select v-model="form.year">
            <option disabled value="">학번 선택</option>
            <option v-for="y in yearList" :key="y" :value="y">{{ y }}학번</option>
          </select>
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
import CharacterAvatar from './CharacterAvatar.vue';

const props = defineProps<{
  isOpen: boolean;
  uid: string;
  initialData: {
    nickname: string;
    major: string;
    year: number;
    character?: any;
  };
}>();

const emit = defineEmits(['close', 'updated']);

// 선택 옵션들 (SetupView와 동일)
const majors = ["컴퓨터공학부", "소프트웨어공학과", "전자공학과", "컴퓨터인공지능학부"];
// 🔥 [FIX] 00 ~ 25 학번 생성
const yearList = Array.from({ length: 26 }, (_, i) => i.toString().padStart(2, '0'));

const form = ref({
  nickname: '',
  major: '',
  year: '' // 문자열로 처리 (00, 01...)
});



const isSaving = ref(false);
const errorMessage = ref('');

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = { 
      nickname: props.initialData.nickname,
      major: props.initialData.major,
      year: props.initialData.year ? props.initialData.year.toString().padStart(2, '0') : ''
    };
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
      year: parseInt(form.value.year) // 저장할 때는 숫자로
    });
    
    emit('updated', {
      ...form.value,
      year: parseInt(form.value.year)
    });
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
}

.modal-body {
  margin-bottom: 2rem;
}

.character-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  width: 120px;
  height: 120px;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 0.9rem;
  font-weight: 600;
}

/* 🔥 [FIX] Input & Select Styling */
.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  background: #2a2a3a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box; /* 🔥 [FIX] Prevent overflow */
}

.form-group input:focus,
.form-group select:focus {
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

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
