<template>
  <div class="timer-container" :style="circleStyle">
    <!-- SVG Ring (Optional visual decoration) -->
    <svg class="timer-svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="90" class="bg-ring" />
    </svg>
    
    <div class="timer-content">
      <div class="turn-label">
        <span class="player-name">{{ currentPlayerName }}</span>
        <span class="turn-text">TURN</span>
      </div>
      <div v-if="isMyTurn" class="my-turn-badge">YOUR TURN</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  circleStyle: any;
  currentPlayerName: string;
  isMyTurn: boolean;
}>();
</script>

<style scoped>
.timer-container {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Ring using Conic Gradient */
.timer-container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    #4285f4 var(--timer-angle), 
    rgba(255, 255, 255, 0.1) 0deg
  );
  mask: radial-gradient(transparent 62%, black 63%);
  -webkit-mask: radial-gradient(transparent 62%, black 63%);
  box-shadow: 0 0 20px rgba(66, 133, 244, 0.3);
  transition: --timer-angle 1s linear; /* If supported, else JS handles updates */
}

/* Inner Glow */
.timer-container::after {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.timer-svg {
  display: none; /* Hiding SVG approach for now to use the prop directly */
}

.timer-content {
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.player-name {
  font-size: 1.8rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  display: block;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.turn-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  letter-spacing: 2px;
}

.my-turn-badge {
  margin-top: 8px;
  background: linear-gradient(45deg, #ff6b6b, #ee5253);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 10px rgba(238, 82, 83, 0.4);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>