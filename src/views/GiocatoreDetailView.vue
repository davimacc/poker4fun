<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchData, tornei, risultati } from '../store.js'
import { getInitials, toInt, formatDate, buildTournamentResults } from '../utils/helpers.js'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref(null)
const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

/** Restituisce la classe del pos-badge in base alla posizione. */
function posBadgeClass(pos) {
  return pos <= 3 ? `pos-badge--${pos}` : 'pos-badge--other'
}

/** Restituisce l'etichetta testuale della posizione. */
function posLabel(pos) {
  return `${pos}° posto`
}

const player = computed(() => {
  if (!tornei.value || !risultati.value) return null

  const name = route.params.id
  const playerResults = risultati.value.filter(r => r.giocatore === name)
  const totalPoints = playerResults.reduce((sum, r) => sum + toInt(r.punti), 0)
  const wins = playerResults.filter(r => r.posizione === '1').length
  const top3 = playerResults.filter(r => toInt(r.posizione) <= 3).length

  const pointsByPlayer = risultati.value.reduce((acc, r) => {
    acc[r.giocatore] = (acc[r.giocatore] ?? 0) + toInt(r.punti)
    return acc
  }, {})
  const leaderboard = Object.entries(pointsByPlayer).sort(([, a], [, b]) => b - a)
  const rank = leaderboard.findIndex(([n]) => n === name) + 1

  const history = playerResults
    .map(r => {
      const tourney = tornei.value.find(t => t.id === r.torneo)
      const results = buildTournamentResults(risultati.value, r.torneo)
        .map(x => ({ ...x, isCurrentPlayer: x.name === name }))
      return {
        id: r.torneo,
        name: tourney?.nome ?? `Torneo #${r.torneo}`,
        date: tourney?.data ?? '',
        playerCount: results.length,
        pos: toInt(r.posizione),
        points: r.punti,
        results,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  return {
    name,
    totalPoints,
    wins,
    top3,
    tourneysPlayed: playerResults.length,
    rank,
    history,
  }
})

onMounted(async () => {
  try {
    await fetchData()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">

    <!-- Skeleton -->
    <div v-if="loading" class="skeleton">
      <div class="skeleton-row skeleton-row--header">
        <div class="skeleton-circle skeleton-circle--lg" />
        <div class="skeleton-header-lines">
          <div class="skeleton-line" style="width: 45%;" />
          <div class="skeleton-line skeleton-line--sm" style="width: 28%;" />
        </div>
      </div>
      <div class="skeleton-stats">
        <div v-for="i in 4" :key="i" class="skeleton-line skeleton-stat-block" />
      </div>
      <div v-for="i in 4" :key="i" class="skeleton-row">
        <div class="skeleton-line" :style="{ width: `${40 + (i % 3) * 18}%` }" />
      </div>
    </div>

    <div v-else-if="error" class="error">Impossibile caricare i dati del giocatore.</div>

    <div v-else-if="player" class="card">

      <!-- Header -->
      <div class="player-header">
        <button class="back-btn" aria-label="Torna indietro" @click="router.back()">‹</button>
        <div class="avatar avatar--lg">{{ getInitials(player.name) }}</div>
        <div class="player-header-info">
          <div class="player-header-name">{{ player.name }}</div>
        </div>
        <div class="ranking-badge" :class="`ranking-badge--${player.rank <= 3 ? player.rank : 'other'}`">
          <div class="ranking-badge-label">Ranking</div>
          <div class="ranking-badge-num">#{{ player.rank }}</div>
        </div>
      </div>

      <!-- Statistiche -->
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-label">Punti</div>
          <div class="stat-value">{{ player.totalPoints }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Tornei giocati</div>
          <div class="stat-value">{{ player.tourneysPlayed }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Vittorie</div>
          <div class="stat-value">{{ player.wins }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Podi</div>
          <div class="stat-value">{{ player.top3 }}</div>
        </div>
      </div>

      <!-- Storico tornei -->
      <div class="history-title">Storico tornei</div>

      <div v-for="t in player.history" :key="t.id" class="history-item">
        <div class="history-row clickable" @click="toggle(t.id)">
          <div>
            <div class="history-name" :class="{ 'history-name--open': openId === t.id }">{{ t.name }}</div>
            <div class="history-meta">{{ formatDate(t.date) }} · {{ t.playerCount }} giocatori</div>
          </div>
          <div class="history-row-right">
            <span class="pos-badge" :class="posBadgeClass(t.pos)">{{ posLabel(t.pos) }}</span>
            <span class="pts">{{ t.points }} pt</span>
            <span class="chevron" :class="{ 'chevron--open': openId === t.id }">›</span>
          </div>
        </div>

        <Transition name="detail">
          <div v-if="openId === t.id" class="tournament-detail">
            <div v-for="r in t.results" :key="r.name" class="detail-row"
              :class="r.isCurrentPlayer ? 'detail-row--hero' : 'detail-row--dimmed'">
              <div class="detail-rank">{{ r.pos }}</div>
              <div class="avatar avatar--sm" :style="{ background: r.color.bg, color: r.color.fg }">
                {{ getInitials(r.name) }}
              </div>
              <div class="detail-name">{{ r.name }}</div>
              <div class="detail-pts">{{ r.points }} pt</div>
            </div>
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ─── Skeleton ──────────────────────────────────────────────────────────────── */

.skeleton-row--header {
  padding: 1.25rem 1rem;
  gap: 16px;
}

.skeleton-circle--lg {
  width: var(--size-avatar-lg);
  height: var(--size-avatar-lg);
}

.skeleton-header-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line--sm {
  height: 11px;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 1rem;
}

.skeleton-stat-block {
  height: 72px;
  border-radius: 10px;
}

/* ─── Header giocatore ──────────────────────────────────────────────────────── */

.player-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem 1rem 1rem 0.5rem;
  border-bottom: 0.5px solid var(--color-border);
}

.back-btn {
  background: none;
  border: none;
  font-size: 32px;
  line-height: 1;
  color: var(--color-muted);
  cursor: pointer;
  padding: 0 0.25rem;
  flex-shrink: 0;
  transition: var(--transition-color);
}

.back-btn:hover {
  color: var(--color-text);
}

.player-header-info {
  flex: 1;
  min-width: 0;
}

.player-header-name {
  font-size: var(--font-size-lg);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Ranking badge ─────────────────────────────────────────────────────────── */

.ranking-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.ranking-badge-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ranking-badge-num {
  font-size: var(--font-size-xl);
  font-weight: 500;
  line-height: 1.15;
}

.ranking-badge--1 {
  background: var(--podium-1-bg);
}

.ranking-badge--2 {
  background: var(--podium-2-bg);
}

.ranking-badge--3 {
  background: var(--podium-3-bg);
}

.ranking-badge--other {
  background: var(--podium-other-bg);
}

.ranking-badge--1 .ranking-badge-label,
.ranking-badge--1 .ranking-badge-num {
  color: var(--podium-1-fg);
}

.ranking-badge--2 .ranking-badge-label,
.ranking-badge--2 .ranking-badge-num {
  color: var(--podium-2-fg);
}

.ranking-badge--3 .ranking-badge-label,
.ranking-badge--3 .ranking-badge-num {
  color: var(--podium-3-fg);
}

.ranking-badge--other .ranking-badge-label,
.ranking-badge--other .ranking-badge-num {
  color: var(--podium-other-fg);
}

/* ─── Statistiche ───────────────────────────────────────────────────────────── */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 1rem;
}

.stat {
  background: var(--color-bg-subtle);
  border-radius: 10px;
  padding: 1rem;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-bottom: 6px;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: 500;
}

/* ─── Storico tornei ────────────────────────────────────────────────────────── */

.history-title {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem 0.5rem;
  border-top: 0.5px solid var(--color-border);
}

.history-item {
  border-bottom: 0.5px solid var(--color-border);
}

.history-item:last-child {
  border-bottom: none;
}

.history-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
}

.history-name {
  font-size: var(--font-size-md);
  font-weight: 500;
}

.history-name--open {
  font-weight: 600;
}

.history-meta {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: 2px;
}

.history-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ─── Detail focus effect ───────────────────────────────────────────────────── */

/* Il giocatore corrente rimane in piena visibilità con accento laterale */
.detail-row--hero {
  border-left: 2.5px solid var(--color-accent);
  padding-left: calc(1rem - 2.5px);
  border-radius: 0 6px 6px 0;
}

/* Gli altri giocatori sono leggermente sfumati */
.detail-row--dimmed {
  opacity: 0.35;
  filter: blur(0.3px);
  transform: scale(0.985);
  transition: opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease;
}

.tournament-detail:hover .detail-row--dimmed:hover {
  opacity: 0.65;
  filter: none;
  transform: scale(1);
}
</style>
