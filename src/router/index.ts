import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import App from "../App.vue"; // 다빈치 코드 메인 화면

// 라우트 타입 명시 (선택이지만 권장)
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "game",
    component: App,
  },
];

// Router 인스턴스 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
