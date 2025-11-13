<template>
  <div class="status-box">
    <strong>{{ store.currentPlayer?.name }}</strong>의 턴입니다  
    <br />
    상대의 카드를 클릭해 추리하세요.
  </div>
  <button @click="emit('turn')">턴 진행</button>
</template>

<script setup>
import { useGameStore } from "../stores/game";
const store = useGameStore();
const emit = defineEmits(["turn"]);
</script>

<style scoped>
.status-box {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 16px;
  background: rgba(255,255,255,0.85);
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  font-size: 18px;
  font-weight: 700;
}
</style>
