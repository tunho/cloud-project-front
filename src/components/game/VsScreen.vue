<template>
  <div class="vs-screen">
    <div class="player-panel left" :class="{ 'slide-in-left': show }">
      <div class="content">
        <div class="avatar-container">
            <CharacterAvatar :character="player1?.character" :size="200" />
        </div>
        <div class="info">
            <h2 class="nickname">{{ player1?.nickname || player1?.name }}</h2>
            <div class="stats">
                <span>⛃ {{ player1?.betAmount?.toLocaleString() }}</span>
            </div>
        </div>
      </div>
    </div>

    <div class="vs-badge" :class="{ 'pop-in': show }">
      <span>VS</span>
    </div>

    <div class="player-panel right" :class="{ 'slide-in-right': show }">
      <div class="content">
        <div class="avatar-container">
            <CharacterAvatar :character="player2?.character" :size="200" />
        </div>
        <div class="info">
            <h2 class="nickname">{{ player2?.nickname || player2?.name }}</h2>
            <div class="stats">
                <span>⛃ {{ player2?.betAmount?.toLocaleString() }}</span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CharacterAvatar from '../CharacterAvatar.vue';

const props = defineProps<{
  player1: any;
  player2: any;
}>();

const emit = defineEmits(['finish']);
const show = ref(false);

onMounted(() => {
  // Trigger animations
  setTimeout(() => {
    show.value = true;
  }, 100);

  // Auto close
  setTimeout(() => {
    emit('finish');
  }, 3500);
});
</script>

<style scoped>
.vs-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  overflow: hidden;
  background: #000;
}

.player-panel {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.player-panel.left {
  background: linear-gradient(135deg, #1a2a6c, #b21f1f);
  transform: translateX(-100%);
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
  width: 55%; /* Overlap slightly */
  position: absolute;
  left: 0;
}

.player-panel.right {
  background: linear-gradient(135deg, #fdbb2d, #22c1c3);
  transform: translateX(100%);
  clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
  width: 55%; /* Overlap slightly */
  position: absolute;
  right: 0;
}

.slide-in-left {
  transform: translateX(0) !important;
}

.slide-in-right {
  transform: translateX(0) !important;
}

.slide-in-right {
  transform: translateX(0) !important;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  z-index: 2;
}

.nickname {
  font-size: 3rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.stats {
    font-size: 1.5rem;
    font-weight: bold;
    background: rgba(0,0,0,0.5);
    padding: 5px 15px;
    border-radius: 20px;
}

.vs-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 150px;
  height: 150px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.8);
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition-delay: 0.6s;
}

.vs-badge span {
  font-size: 4rem;
  font-weight: 900;
  font-style: italic;
  color: #000;
}

.pop-in {
  transform: translate(-50%, -50%) scale(1) !important;
}

.avatar-container {
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
    transition: transform 0.3s;
}

.avatar-container:hover {
    transform: scale(1.05);
}
</style>
