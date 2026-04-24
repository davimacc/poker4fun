import { createRouter, createWebHistory } from 'vue-router'
import ClassificaView from '../views/ClassificaView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ClassificaView },
    { path: '/tornei', component: () => import('../views/TorneiView.vue') },
    { path: '/giocatori/:id', component: () => import('../views/GiocatoreDetailView.vue') },
  ],
})

export default router