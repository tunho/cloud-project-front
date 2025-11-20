<template>
  <div class="guess-overlay" @click="$emit('cancel')">
    <div class="wheel-container" @click.stop>
      
      <!-- Center Close Button -->
      <div class="center-close-btn" @click="$emit('cancel')">
        <span class="close-icon">✕</span>
      </div>
      
      <!-- Wheel Options -->
      <div v-for="i in 13" 
        class="guess-option" 
        :key="i"
        :style="{ '--i': i }"
        @click="$emit('select-value', i === 13 ? 'joker' : i - 1)"
      >
        <span class="option-text">{{ i === 13 ? '★' : i - 1 }}</span>
      </div>

    </div>
  </div>
</template>

<style scoped>
.guess-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 12, 41, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.wheel-container {
  width: 360px;
  height: 360px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.center-close-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 102;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.center-close-btn:hover {
  background: rgba(244, 67, 54, 0.8);
  transform: scale(1.1) rotate(90deg);
  border-color: transparent;
}

.close-icon {
  font-size: 24px;
  font-weight: bold;
}

.guess-option {
  --radius: 150px;
  --count: 13;
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 -2px 5px rgba(0, 0, 0, 0.1);
  z-index: 101;
  
  /* Circular Positioning */
  transform: rotate(calc(var(--i) * (360deg / var(--count)))) 
             translateY(var(--radius)) 
             rotate(calc(var(--i) * (-360deg / var(--count))));
             
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.guess-option:hover {
  transform: rotate(calc(var(--i) * (360deg / var(--count)))) 
             translateY(var(--radius)) 
             rotate(calc(var(--i) * (-360deg / var(--count))))
             scale(1.2);
  background: #ffd700;
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  z-index: 110;
}

.option-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: #333;
}
</style>