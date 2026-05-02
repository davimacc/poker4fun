import { createRouter, createWebHistory } from 'vue-router'
import RankingView from '../views/RankingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: RankingView },
    { path: '/tornei', component: () => import('../views/TournamentsView.vue') },
    { path: '/giocatori/:id', component: () => import('../views/PlayerView.vue') },
  ],
})

export default router
