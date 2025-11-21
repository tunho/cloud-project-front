<template>
  <div class="user-profile-card">
    <div class="profile-content">
      <div class="avatar-wrapper">
        <div class="avatar">👤</div>
        <div class="status-dot"></div>
      </div>
      
      <div class="user-details">
        <div class="nickname-row">
          <div class="nickname">{{ userData?.nickname || 'Guest' }}</div>
          <!-- 🔥 [추가] 정보 수정 버튼 (세련된 아이콘) -->
          <button class="edit-btn" @click="openEditModal" title="정보 수정">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
        <div class="info-row">
          <span class="major">{{ userData?.major || 'N/A' }}</span>
          <span class="divider">•</span>
          <span class="student-id">{{ userData?.year || '' }}학번</span>
        </div>
      </div>

      <div class="money-badge">
        <span class="coin-icon">💰</span>
        <span class="amount">{{ formattedMoney }}</span>
      </div>
    </div>

    <!-- 🔥 [추가] 정보 수정 모달 (자체 포함) -->
    <ProfileEditModal 
      :isOpen="showEditModal"
      :uid="currentUid"
      :initialData="editInitialData"
      @close="closeEditModal"
      @updated="handleProfileUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ProfileEditModal from './ProfileEditModal.vue'; // 🔥 Import

interface UserData {
  nickname: string;
  major: string;
  year: number;
  money: number;
  email: string;
}

const userData = ref<UserData | null>(null);
const currentUid = ref('');
const showEditModal = ref(false);

let unsubscribeSnapshot: (() => void) | null = null;
let unsubscribeAuth: (() => void) | null = null;

const formattedMoney = computed(() => {
  if (!userData.value?.money && userData.value?.money !== 0) return '0';
  return userData.value.money.toLocaleString('ko-KR');
});

const editInitialData = computed(() => ({
  nickname: userData.value?.nickname || '',
  major: userData.value?.major || '',
  year: userData.value?.year || 0
}));

function openEditModal() {
  if (!currentUid.value) return;
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
}

function handleProfileUpdated(newData: any) {
  if (userData.value) {
    userData.value = { ...userData.value, ...newData };
  }
}

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUid.value = user.uid;
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          userData.value = docSnap.data() as UserData;
        }
      });
    } else {
      currentUid.value = '';
      userData.value = null;
    }
  });
});

onUnmounted(() => {
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  if (unsubscribeAuth) unsubscribeAuth();
});
</script>

<style scoped>
.user-profile-card {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 1000;
  animation: slideIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.profile-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 8px 8px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.profile-content:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 2px 10px rgba(118, 75, 162, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #4ade80;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nickname {
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
  line-height: 1.2;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0.5;
  transition: all 0.2s;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.edit-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.divider {
  opacity: 0.4;
}

.money-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.15);
  margin-left: 8px;
}

.coin-icon {
  font-size: 1rem;
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
}

.amount {
  font-weight: 700;
  font-size: 0.9rem;
  color: #ffd700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
