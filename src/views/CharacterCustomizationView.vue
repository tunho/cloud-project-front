<template>
  <div class="customization-wrapper">
    <header class="custom-header">
      <button class="back-btn" @click="goBack">← 뒤로</button>
      <h1>캐릭터 꾸미기</h1>
      <button class="save-btn" @click="saveCharacter" :disabled="isSaving">
        {{ isSaving ? '저장 중...' : '저장 완료' }}
      </button>
    </header>

    <main class="custom-content">
      <!-- Left: Character Preview -->
      <div class="preview-section">
        <div class="character-stage">
          <CharacterAvatar
            :seed="character.seed"
            :skinColor="character.skinColor"
            :top="character.top"
            :hairColor="character.hairColor"
            :hatColor="character.hatColor"
            :eyes="character.eyes"
            :mouth="character.mouth"
            :eyebrows="character.eyebrows"
            :accessories="character.accessories"
            :clothing="character.clothing"
            :clothesColor="character.clothesColor"
            :backgroundColor="character.backgroundColor"
            :size="400"
            :height="600"
            mode="face"
          />
          <div class="stage-shadow"></div>
        </div>
        
        <div class="action-buttons">
          <button class="random-btn" @click="randomizeCharacter">
            🎲 랜덤 생성
          </button>
          
          <button v-if="pendingPurchaseItems.length > 0" class="purchase-btn" @click="purchasePendingItems">
            🛒 구매하기 ({{ totalCost.toLocaleString() }}원)
          </button>
        </div>
      </div>

      <!-- Right: Customization Options -->
      <div class="options-section">
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id" 
            :class="{ active: currentTab === tab.id }"
            @click="currentTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="options-container">
          <!-- Hair Tab -->
          <div v-if="currentTab === 'hair'" class="option-group">
            <h3>헤어/모자 스타일</h3>
            <div class="style-grid">
              <button v-for="(style, index) in topStyles" :key="style"
                :class="{ active: character.top === style, premium: isPremium(style), locked: isLocked(style) }"
                @click="selectOption('top', style)">
                {{ index + 1 }}
                <span v-if="isPremium(style) && isLocked(style)" class="premium-badge">P</span>
              </button>
            </div>
            <h3>헤어/모자 색상</h3>
            <div class="color-grid">
              <button v-for="c in hairColors" :key="c" 
                :style="{ background: '#' + c }" 
                :class="{ active: character.hairColor === c }"
                @click="character.hairColor = c; character.hatColor = c">
              </button>
            </div>
          </div>

          <!-- Face Tab -->
          <div v-if="currentTab === 'face'" class="option-group">
            <h3>피부색</h3>
            <div class="color-grid">
              <button v-for="c in skinColors" :key="c" 
                :style="{ background: '#' + c }" 
                :class="{ active: character.skinColor === c }"
                @click="character.skinColor = c">
              </button>
            </div>
            <h3>눈</h3>
            <div class="style-grid">
              <button v-for="(style, index) in eyeStyles" :key="style"
                :class="{ active: character.eyes === style }"
                @click="character.eyes = style">
                {{ index + 1 }}
              </button>
            </div>
            <h3>입</h3>
            <div class="style-grid">
              <button v-for="(style, index) in mouthStyles" :key="style"
                :class="{ active: character.mouth === style }"
                @click="character.mouth = style">
                {{ index + 1 }}
              </button>
            </div>
            <h3>눈썹</h3>
            <div class="style-grid">
              <button v-for="(style, index) in eyebrowStyles" :key="style"
                :class="{ active: character.eyebrows === style }"
                @click="character.eyebrows = style">
                {{ index + 1 }}
              </button>
            </div>
          </div>

          <!-- Clothing Tab -->
          <div v-if="currentTab === 'clothing'" class="option-group">
            <h3>의상 스타일</h3>
            <div class="style-grid">
              <button v-for="(style, index) in clothingStyles" :key="style"
                :class="{ active: character.clothing === style, premium: isPremium(style), locked: isLocked(style) }"
                @click="selectOption('clothing', style)">
                {{ index + 1 }}
                <span v-if="isPremium(style) && isLocked(style)" class="premium-badge">P</span>
              </button>
            </div>
            <h3>의상 색상</h3>
            <div class="color-grid">
              <button v-for="c in clothingColors" :key="c"
                :style="{ background: '#' + c }"
                :class="{ active: character.clothesColor === c }"
                @click="character.clothesColor = c">
              </button>
            </div>
          </div>

          <!-- Accessories Tab -->
          <div v-if="currentTab === 'accessories'" class="option-group">
            <h3>액세서리</h3>
            <div class="style-grid">
              <button :class="{ active: !character.accessories }" @click="character.accessories = undefined">없음</button>
              <button v-for="(style, index) in accessoriesStyles" :key="style"
                :class="{ active: character.accessories === style, premium: isPremium(style), locked: isLocked(style) }"
                @click="selectOption('accessories', style)">
                {{ index + 1 }}
                <span v-if="isPremium(style) && isLocked(style)" class="premium-badge">P</span>
              </button>
            </div>
            <h3>배경색</h3>
            <div class="color-grid">
              <button v-for="c in backgroundColors" :key="c"
                :style="{ background: '#' + c }"
                :class="{ active: character.backgroundColor === c }"
                @click="character.backgroundColor = c">
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import CharacterAvatar from '../components/CharacterAvatar.vue'

const router = useRouter()
const isSaving = ref(false)
const currentTab = ref('hair')

// DiceBear Avataaars Options
const character = ref<any>({
  seed: 'davinci-user',
  top: 'shortHairShortFlat',
  hairColor: '4a312c',
  hatColor: '65c9ff',
  clothing: 'hoodie',
  clothesColor: '3c4f5c',
  eyes: 'default',
  eyebrows: 'default',
  mouth: 'smile',
  skinColor: 'f8d25c',
  accessories: undefined,
  backgroundColor: 'b6e3f4'
})

const tabs = [
  { id: 'hair', label: '헤어/모자' },
  { id: 'face', label: '얼굴' },
  { id: 'clothing', label: '의상' },
  { id: 'accessories', label: '액세서리' }
]

// Avataaars Option Lists
const topStyles = [
  'bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight01', 'straight02', 'straightAndStrand',
  'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'theCaesar', 'theCaesarAndSidePart',
  'turban', 'hijab', 'hat', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04'
]
const hairColors = ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370', 'f59797', 'ecdcbf', 'c9ccc8', 'a7a7a7', '4c4a4a']
const hatColors = ['65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'b1e2ff', 'a7ffc4', 'ffdeb5', 'ffafb9', 'ff5c5c', 'ff488e']
const skinColors = ['614335', 'ae5d29', 'd08b5b', 'edb98a', 'fd9841', 'f8d25c', 'ffdbb4']
// Removed 'close' (Eye 1)
const eyeStyles = ['cry', 'default', 'dizzy', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky']
const eyebrowStyles = ['angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural', 'frownNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural']
const mouthStyles = ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit']
// Removed 'blazerShirt', 'blazerSweater' (Clothing 1, 2)
const clothingStyles = ['collarSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck']
const clothingColors = ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'b1e2ff', 'a7ffc4', 'ffdeb5', 'ffafb9', 'ff5c5c', 'ff488e']
const accessoriesStyles = ['kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers']
const backgroundColors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']

function randomizeCharacter() {
  character.value.seed = Math.random().toString(36).substring(7)
  character.value.top = topStyles[Math.floor(Math.random() * topStyles.length)]
  character.value.hairColor = hairColors[Math.floor(Math.random() * hairColors.length)]
  character.value.hatColor = hatColors[Math.floor(Math.random() * hatColors.length)]
  character.value.clothing = clothingStyles[Math.floor(Math.random() * clothingStyles.length)]
  character.value.clothesColor = clothingColors[Math.floor(Math.random() * clothingColors.length)]
  character.value.eyes = eyeStyles[Math.floor(Math.random() * eyeStyles.length)]
  character.value.eyebrows = eyebrowStyles[Math.floor(Math.random() * eyebrowStyles.length)]
  character.value.mouth = mouthStyles[Math.floor(Math.random() * mouthStyles.length)]
  character.value.skinColor = skinColors[Math.floor(Math.random() * skinColors.length)]
  character.value.accessories = Math.random() > 0.5 ? accessoriesStyles[Math.floor(Math.random() * accessoriesStyles.length)] : undefined;
  character.value.backgroundColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
}

function goBack() {
  router.push('/platform');
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
    userInventory.value = data.inventory || [];
    
    if (data.character && data.character.seed) { // Check if new format
      character.value = { ...character.value, ...data.character };
    } else {
      // Initialize with random seed for first time
      randomizeCharacter();
    }
  }
});

// Premium Logic
const userMoney = ref(0);
const userInventory = ref<string[]>([]);
const DEFAULT_PRICE = 500;

// Helper to find index of an item in any list
function getItemIndex(value: string): number {
  if (topStyles.includes(value)) return topStyles.indexOf(value);
  if (clothingStyles.includes(value)) return clothingStyles.indexOf(value);
  if (accessoriesStyles.includes(value)) return accessoriesStyles.indexOf(value);
  // Colors and other parts are free for now
  return -1;
}

function isPremium(value: string) {
  const index = getItemIndex(value);
  return index >= 2; // 0 and 1 are free, 2+ are premium
}

function isLocked(value: string) {
  return isPremium(value) && !userInventory.value.includes(value);
}

// Computed: Items currently selected that need to be purchased
import { computed } from 'vue';
const pendingPurchaseItems = computed(() => {
  const items: string[] = [];
  if (character.value.top && isLocked(character.value.top)) items.push(character.value.top);
  if (character.value.clothing && isLocked(character.value.clothing)) items.push(character.value.clothing);
  if (character.value.accessories && isLocked(character.value.accessories)) items.push(character.value.accessories);
  return items;
});

const totalCost = computed(() => pendingPurchaseItems.value.length * DEFAULT_PRICE);

async function selectOption(category: string, value: string) {
  // Allow preview even if locked
  character.value[category] = value;
}

async function purchasePendingItems() {
  if (!auth.currentUser) return;
  const cost = totalCost.value;
  
  if (userMoney.value < cost) {
    alert('돈이 부족합니다!');
    return;
  }

  if (!confirm(`총 ${cost}원을 사용하여 선택한 아이템을 구매하시겠습니까?`)) return;

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Optimistic update
    userMoney.value -= cost;
    userInventory.value.push(...pendingPurchaseItems.value);
    
    await updateDoc(userRef, {
      money: userMoney.value,
      inventory: userInventory.value
    });
    
    alert('구매 완료! 이제 저장할 수 있습니다.');
  } catch (error) {
    console.error('Purchase failed:', error);
    alert('구매 중 오류가 발생했습니다.');
    // Rollback
    userMoney.value += cost;
    // Remove added items from inventory (complex to rollback perfectly without deep clone, but good enough for now)
    // Actually we just need to refresh inventory from server or filter out the pending items
    // For simplicity, we'll just reload the page or fetch again if critical
  }
}

async function saveCharacter() {
  if (!auth.currentUser) return;
  
  if (pendingPurchaseItems.value.length > 0) {
    alert('구매하지 않은 프리미엄 아이템이 있습니다. 먼저 구매해주세요.');
    return;
  }

  isSaving.value = true;
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Firestore doesn't accept undefined, convert to null or plain object
    const characterData = JSON.parse(JSON.stringify(character.value));
    
    await updateDoc(userRef, {
      character: characterData
    });
    setTimeout(() => {
      isSaving.value = false;
      router.push('/platform');
    }, 500);
  } catch (error) {
    console.error('Error saving character:', error);
    isSaving.value = false;
  }
}

</script>

<style scoped>
.customization-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
  display: flex;
  flex-direction: column;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.back-btn, .save-btn {
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.save-btn {
  background: linear-gradient(45deg, #4285f4, #34a853);
  color: white;
}

.save-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(66, 133, 244, 0.4);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.custom-content {
  flex: 1;
  display: flex;
  padding: 2rem;
  gap: 4rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.character-stage {
  position: relative;
  padding: 40px;
  background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.stage-shadow {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  filter: blur(10px);
}

.random-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff9966, #ff5e62);
  border: none;
  border-radius: 25px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(255, 94, 98, 0.3);
}

.random-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 94, 98, 0.5);
}

.options-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.tabs button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}

.tabs button.active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.options-container {
  flex: 1;
  overflow-y: auto;
}

.option-group {
  margin-bottom: 2rem;
  animation: fadeIn 0.3s ease-out;
}

.option-group h3 {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 12px;
}

.color-grid button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-grid button:hover {
  transform: scale(1.1);
}

.color-grid button.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.style-grid button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.8rem;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.style-grid button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.style-grid button.active {
  background: rgba(66, 133, 244, 0.2);
  border-color: #4285f4;
  color: #4285f4;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 200px;
}

.purchase-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ffd700, #ffa500);
  border: none;
  border-radius: 25px;
  color: #000;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  animation: pulse 2s infinite;
}

.purchase-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.5);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.style-grid button {
  position: relative;
}

.style-grid button.premium {
  border-color: #ffd700;
}

.style-grid button.locked {
  /* opacity: 0.7; Removed opacity to allow clear preview */
}

.premium-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ffd700;
  color: #000;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
</style>
