<template>
  <div class="overlay">
    <div class="choice-box">
      <div class="card black" v-if="blackCount > 0"  @click="choose('black')">Black</div>
      <div class="card white" v-if="whiteCount > 0"  @click="choose('white')">White</div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  blackCount: Number,
  whiteCount: Number
});



const emit = defineEmits(["choose"]);

const choose = (color) => emit("choose", color);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.choice-box {
  display: flex;
  gap: 40px;
}

.card {
  width: 140px;
  height: 200px;
  border-radius: 16px;
  font-size: 28px;
  font-weight: bold;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  transition: 0.2s;
}

.card.black {
  background: #333;
}

.card.white {
  background: #ddd;
  color: #222;
}

.card:hover {
  transform: scale(1.1);
}
</style>