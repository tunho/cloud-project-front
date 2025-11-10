<template>
  <div style="padding:16px; font-family:system-ui, -apple-system, 'Noto Sans KR', sans-serif;">
    <h1>다빈치 코드 – 로컬 테스트</h1>

    <div style="margin:12px 0;">
      <label>플레이어 수: </label>
      <select v-model.number="num" style="padding:4px;">
        <option :value="2">2</option>
        <option :value="3">3</option>
        <option :value="4">4</option>
      </select>
      <button @click="init" style="margin-left:8px;">게임 초기화/배분</button>
    </div>

    <div style="margin:12px 0;">
      <strong>현재 턴:</strong> {{ store.currentTurn + 1 }}P /
      <strong>더미 남은 장수:</strong>
{{ store.piles.black.length + store.piles.white.length }}
      <span v-if="store.drawnTile">
        &nbsp;| &nbsp;<strong>방금 뽑은:</strong>
        <code>{{ store.drawnTile.color + ' ' + store.drawnTile.value }}</code>
      </span>
    </div>

    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
      <button @click="startTurnAuto()">턴 시작(한 장 뽑기)</button>
      <div>
        <input v-model.number="placeIndex" type="number" min="0" style="width:80px;" />
        <button @click="store.placeDrawnTileAt(placeIndex)" :disabled="!(store.pendingPlacement && store.drawnTile && store.drawnTile.isJoker)">지정 위치 배치</button>
      </div>
      <button @click="store.nextTurn()" :disabled="store.pendingPlacement">다음 턴</button>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
      <div v-for="p in store.players" :key="p.id" :style="playerCardStyle(p.id)">
        <div style="font-weight:700; margin-bottom:8px;">
          {{ p.name }}
          <span v-if="p.id === store.currentTurn"> ← 현재</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <div v-for="(t, i) in p.hand" :key="t.id" :style="tileStyle(t)">
            <span v-if="t.isJoker">★</span>
            <span v-else>{{ t.color === 'black' ? 'B' : 'W' }}{{ t.value }}</span>
            <small style="opacity:.6; display:block;">#{{ i }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useGameStore } from "./stores/game.ts"; // ✅ 확장자 명시!

const store = useGameStore();
const num = ref(4);
const placeIndex = ref(0);

function init() {
  store.initDealing(num.value);
  placeIndex.value = 0;
}
const canAutoPlace = computed(
  () => !!store.pendingPlacement && store.drawnTile && !store.drawnTile.isJoker
);

function playerCardStyle(id) {
  return {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
    background: id === store.currentTurn ? "#f0f7ff" : "#fafafa",
  };
}
function tileStyle(t) {
  const isBlack = t.color === "black";
  return {
    width: "48px",
    height: "60px",
    border: "1px solid #999",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    fontWeight: 700,
    background: isBlack ? "#222" : "#fff",
    color: isBlack ? "#fff" : "#000",
  };
}

function startTurnAuto(){
  const t = store.startTurn();
  if  (t && !t.isJoker){
    store.autoPlaceDrawnTile(); 
  }
}
</script>
