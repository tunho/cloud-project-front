<template>
  <div class="draw-container">
    <div class="instruction-text">타일을 선택하세요</div>
    <div class="draw-select">
      <div class="big-card black" @click="(e) => $emit('pick-color', { color: 'black', event: e })">
        <div class="card-inner">
          <div class="label">BLACK</div>
        </div>
      </div>
      <div class="big-card white" @click="(e) => $emit('pick-color', { color: 'white', event: e })">
        <div class="card-inner">
          <div class="label black-text">WHITE</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draw-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.instruction-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  letter-spacing: 1px;
}

.draw-select {
  display: flex;
  gap: 40px;
}

.big-card {
  width: 140px;
  height: 200px;
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-style: preserve-3d;
}

.big-card:hover {
  transform: translateY(-15px) scale(1.05);
  z-index: 10;
}

.card-inner {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 2px;
}

/* Black Card Style */
.big-card.black {
  background: linear-gradient(135deg, #2c3e50, #000000);
  border: 1px solid #444;
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.5),
    inset 0 2px 3px rgba(255,255,255,0.1);
  color: #ffd700;
}

.big-card.black:hover {
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.6),
    0 0 15px rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
}

/* White Card Style */
.big-card.white {
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  border: 1px solid #ccc;
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.3),
    inset 0 2px 3px rgba(255,255,255,0.8);
  color: #333;
}

.big-card.white:hover {
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.4),
    0 0 15px rgba(255, 255, 255, 0.6);
  border-color: white;
}
</style>