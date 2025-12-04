import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import GameLobbyView from "../views/GameLobbyView.vue";
import ProfileSetupView from "../views/ProfileSetupView.vue";
import GamePlatformView from "../views/GamePlatformView.vue";
import CustomMatchView from "../views/CustomMatchView.vue";
import MatchingView from "../views/MatchingView.vue";
import CustomRoomView from "../views/CustomRoomView.vue";
import ShopView from "../views/ShopView.vue";
import CharacterCustomizationView from "../views/CharacterCustomizationView.vue";
import OmokView from "../views/OmokView.vue";
const routes = [
  { path: "/", component: LoginView },
  { path: "/davinci-home", component: GameLobbyView, props: { gameType: 'davinci' } },
  { path: "/omok-home", component: GameLobbyView, props: { gameType: 'omok' } },
  { path: "/indian-poker-home", component: GameLobbyView, props: { gameType: 'indian_poker' } },
  { path: "/profile-setup", component: ProfileSetupView },
  { path: "/platform", component: GamePlatformView },
  { path: "/custom-match", component: CustomMatchView },
  { path: "/matching", component: MatchingView },
  { path: "/custom-match/:roomId", component: CustomRoomView, },
  {
    path: '/game-lobby',
    name: 'game-lobby',
    component: GamePlatformView,
    meta: { requiresAuth: true }
  },
  {
    path: '/platform-legacy', // Keep old one just in case
    name: 'platform-legacy',
    component: GamePlatformView,
    meta: { requiresAuth: true }
  },
  {
    path: '/room/:roomId/play',
    name: 'game-room',
    component: () => import('../views/DavinciGameView.vue') // 🔥 [RENAME]
  },
  { path: "/shop", component: ShopView },
  { path: "/customization", component: CharacterCustomizationView },
  { path: "/room/:roomId/omok", component: OmokView },
  { path: "/room/:roomId/indian_poker", component: () => import('../views/IndianPokerView.vue') }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});