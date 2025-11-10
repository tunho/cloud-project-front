import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router"; // ✅ 자동으로 index.ts 인식됨

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
