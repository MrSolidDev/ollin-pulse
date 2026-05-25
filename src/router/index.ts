import { createRouter, createWebHashHistory } from "vue-router";
import OperatorView from "@/views/OperatorView.vue";
import PublicDisplayView from "@/views/PublicDisplayView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: () => (window.ollinPulse?.getWindowRole() === "public" ? "/public" : "/operator") },
    { path: "/operator", component: OperatorView },
    { path: "/public", component: PublicDisplayView }
  ]
});
