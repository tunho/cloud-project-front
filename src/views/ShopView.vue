<template>
  <div class="shop-wrapper">
    <UserProfile />
    
    <header class="shop-header">
      <button class="back-btn" @click="goBack">← 뒤로</button>
      <h1>🛍️ 상점</h1>
      <div class="balance">💰 {{ userMoney.toLocaleString() }}원</div>
    </header>

    <main class="shop-content">
      <section class="shop-section">
        <h2>👑 칭호</h2>
        <div class="items-grid">
          <div v-for="item in titleItems" :key="item.id" class="shop-item">
            <div class="item-icon">{{ item.value }}</div>
            <h3>{{ item.name }}</h3>
            <p class="description">{{ item.description }}</p>
            <div class="item-footer">
              <span class="price">{{ item.price.toLocaleString() }}원</span>
              <button 
                v-if="!isOwned(item.id)" 
                @click="purchaseItem(item)"
                :disabled="userMoney < item.price"
                class="buy-btn"
              >
                구매
              </button>
              <button v-else @click="equipItem(item)" class="equip-btn">
                {{ isEquipped(item.id) ? '✓ 장착중' : '장착' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="shop-section">
        <h2>🎨 아이콘</h2>
        <div class="items-grid">
          <div v-for="item in iconItems" :key="item.id" class="shop-item">
            <div class="item-icon large">{{ item.value }}</div>
            <h3>{{ item.name }}</h3>
            <p class="description">{{ item.description }}</p>
            <div class="item-footer">
              <span class="price">{{ item.price.toLocaleString() }}원</span>
              <button 
                v-if="!isOwned(item.id)" 
                @click="purchaseItem(item)"
                :disabled="userMoney < item.price"
                class="buy-btn"
              >
                구매
              </button>
              <button v-else @click="equipItem(item)" class="equip-btn">
                {{ isEquipped(item.id) ? '✓ 장착중' : '장착' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="shop-section">
        <h2>🌈 테마</h2>
        <div class="items-grid">
          <div v-for="item in themeItems" :key="item.id" class="shop-item">
            <div class="item-icon theme-preview" :style="{ background: item.value }"></div>
            <h3>{{ item.name }}</h3>
            <p class="description">{{ item.description }}</p>
            <div class="item-footer">
              <span class="price">{{ item.price.toLocaleString() }}원</span>
              <button 
                v-if="!isOwned(item.id)" 
                @click="purchaseItem(item)"
                :disabled="userMoney < item.price"
                class="buy-btn"
              >
                구매
              </button>
              <button v-else @click="equipItem(item)" class="equip-btn">
                {{ isEquipped(item.id) ? '✓ 장착중' : '장착' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { shopItems, type ShopItem } from '../data/shopItems';
import UserProfile from '../components/UserProfile.vue';

const router = useRouter();
const userMoney = ref(0);
const ownedItems = ref<string[]>([]);
const equippedTitle = ref<string | null>(null);
const equippedIcon = ref<string | null>(null);
const equippedTheme = ref<string | null>(null);

const toast = ref({ show: false, message: '', type: 'success' });

const titleItems = computed(() => shopItems.filter(item => item.type === 'title'));
const iconItems = computed(() => shopItems.filter(item => item.type === 'icon'));
const themeItems = computed(() => shopItems.filter(item => item.type === 'theme'));

function goBack() {
  router.push('/platform');
}

function isOwned(itemId: string) {
  return ownedItems.value.includes(itemId);
}

function isEquipped(itemId: string) {
  return itemId === equippedTitle.value || itemId === equippedIcon.value || itemId === equippedTheme.value;
}

async function purchaseItem(item: ShopItem) {
  if (!auth.currentUser) return;
  
  if (userMoney.value < item.price) {
    showToast('잔액이 부족합니다!', 'error');
    return;
  }

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      money: userMoney.value - item.price,
      owned_items: arrayUnion(item.id)
    });

    userMoney.value -= item.price;
    ownedItems.value.push(item.id);
    showToast(`${item.name} 구매 완료!`, 'success');
  } catch (error) {
    console.error('Purchase error:', error);
    showToast('구매 실패. 다시 시도해주세요.', 'error');
  }
}

async function equipItem(item: ShopItem) {
  if (!auth.currentUser) return;

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const fieldName = `equipped_${item.type}`;
    
    await updateDoc(userRef, {
      [fieldName]: item.id
    });

    if (item.type === 'title') equippedTitle.value = item.id;
    else if (item.type === 'icon') equippedIcon.value = item.id;
    else if (item.type === 'theme') equippedTheme.value = item.id;

    showToast(`${item.name} 장착 완료!`, 'success');
  } catch (error) {
    console.error('Equip error:', error);
    showToast('장착 실패. 다시 시도해주세요.', 'error');
  }
}

function showToast(message: string, type: 'success' | 'error') {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
}

onMounted(async () => {
  if (!auth.currentUser) {
    router.push('/');
    return;
  }

  const userRef = doc(db, 'users', auth.currentUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    userMoney.value = data.money || 0;
    ownedItems.value = data.owned_items || [];
    equippedTitle.value = data.equipped_title || null;
    equippedIcon.value = data.equipped_icon || null;
    equippedTheme.value = data.equipped_theme || null;
  }
});
</script>

<style scoped>
.shop-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: white;
  padding-bottom: 2rem;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.shop-header h1 {
  font-size: 1.5rem;
  margin: 0;
}

.balance {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #5a4a00;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 800;
  font-size: 1.1rem;
}

.shop-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.shop-section {
  margin-bottom: 3rem;
}

.shop-section h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.shop-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s;
}

.shop-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.item-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.item-icon.large {
  font-size: 3rem;
}

.theme-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.shop-item h3 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
}

.description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
  flex: 1;
}

.item-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.price {
  font-weight: 700;
  color: #ffd700;
  font-size: 1rem;
}

.buy-btn, .equip-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-btn {
  background: linear-gradient(45deg, #4285f4, #34a853);
  color: white;
}

.buy-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.buy-btn:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(66, 133, 244, 0.4);
}

.equip-btn {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid #ffd700;
}

.equip-btn:hover {
  background: rgba(255, 215, 0, 0.3);
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.toast.success {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
}

.toast.error {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
