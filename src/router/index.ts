import { createRouter, createWebHistory } from "vue-router";
import GameBoard from "../views/GameBoard.vue";

const routes = [
  {
    path: "/",
    redirect: "/game"
  },
  {
    path: "/game",
    name: "GameBoard",
    component: GameBoard
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
