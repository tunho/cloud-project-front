<template>
  <div class="overlay" @click.self="close">
    <div class="circle-container">

      <!-- 중앙 EXIT -->
      <div class="center" @click="close">
        ❌
      </div>

      <!-- 주변 값들 (0~11 + Joker) -->
      <div
        v-for="(item, i) in items"
        :key="i"
        class="circle-item"
        :style="getStyle(i)"
        @click="select(item)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["select", "close"]);

const items = [0,1,2,3,4,5,6,7,8,9,10,11,"*"];
const radius = 130;

const getStyle = (i) => {
  const angle = (i / items.length) * 2 * Math.PI;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return {
    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`
  };
};

const select = (value) => emit("select", value);
const close  = () => emit("close");
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

.circle-container {
  position: relative;
  width: 350px;
  height: 350px;
  border-radius: 50%;
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #ffdddd;
  border: 2px solid #aa0000;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
}

.circle-item {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background: #86a7d3;
  border: 2px solid #456;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: 0.15s;
}

.circle-item:hover {
  transform: translate(-50%, -50%) scale(1.2);
}
</style>