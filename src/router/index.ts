import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import DavinciHomeView from "../views/DavinciHomeView.vue";
import ProfileSetupView from "../views/ProfileSetupView.vue";
import GamePlatformView from "../views/GamePlatformView.vue";
import CustomMatchView from "../views/CustomMatchView.vue";
import MatchingView from "../views/MatchingView.vue";
import CustomRoomView from "../views/CustomRoomView.vue";
import GameView from "../views/GameView.vue";
const routes = [
  { path: "/", component: LoginView },
  { path: "/davinci-home", component: DavinciHomeView },
  { path: "/profile-setup", component: ProfileSetupView },
  { path: "/platform", component: GamePlatformView },
  { path: "/custom-match", component: CustomMatchView },
  { path: "/matching", component: MatchingView },
  { path: "/custom-match/:roomId", component: CustomRoomView, },
  { path: "/room/:roomId/play", component: GameView }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});