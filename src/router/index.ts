import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import GameLobbyView from "../views/GameLobbyView.vue";
import ProfileSetupView from "../views/ProfileSetupView.vue";
import GamePlatformView from "../views/GamePlatformView.vue";
import CustomMatchView from "../views/CustomMatchView.vue";
import MatchingView from "../views/MatchingView.vue";
import CustomRoomView from "../views/CustomRoomView.vue";
import GameView from "../views/GameView.vue";
import ShopView from "../views/ShopView.vue";
import CharacterCustomizationView from "../views/CharacterCustomizationView.vue";
import OmokView from "../views/OmokView.vue";
const routes = [
  { path: "/", component: LoginView },
  { path: "/davinci-home", component: GameLobbyView, props: { gameType: 'davinci' } },
  { path: "/omok-home", component: GameLobbyView, props: { gameType: 'omok' } },
  { path: "/profile-setup", component: ProfileSetupView },
  { path: "/platform", component: GamePlatformView },
  { path: "/custom-match", component: CustomMatchView },
  { path: "/matching", component: MatchingView },
  { path: "/custom-match/:roomId", component: CustomRoomView, },
  { path: "/room/:roomId/play", component: GameView },
  { path: "/shop", component: ShopView },
  { path: "/customization", component: CharacterCustomizationView },
  { path: "/room/:roomId/omok", component: OmokView }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});