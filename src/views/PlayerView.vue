<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchData, risultati, selectedYear, tornei } from '../store.js'
import { buildTournamentResults, formatDate, getInitials, toInt } from '../utils/helpers.js'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref(null)
const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

function posBadgeClass(pos) {
  return pos <= 3 ? `pos-badge--${pos}` : 'pos-badge--other'
}

function posLabel(pos) {
  return `${pos}° posto`
}

// Set degli id torneo dell'anno selezionato
const yearTournaments = computed(() => {
  if (!tornei.value || !selectedYear.value) return null
  return new Set(
    tornei.value.filter((t) => t.data?.startsWith(selectedYear.value)).map((t) => t.id),
  )
})

// Dati completi del giocatore per l'anno selezionato
const player = computed(() => {
  if (!tornei.value || !risultati.value) return null

  const name = route.params.id

  const allPlayerResults = risultati.value.filter((r) => r.giocatore === name)
  const playerResults = yearTournaments.value
    ? allPlayerResults.filter((r) => yearTournaments.value.has(r.torneo))
    : allPlayerResults

  const totalPoints = playerResults.reduce((sum, r) => sum + toInt(r.punti), 0)
  const wins = playerResults.filter((r) => r.posizione === '1').length
  const top3 = playerResults.filter((r) => toInt(r.posizione) <= 3).length

  // Calcola il ranking del giocatore nell'anno selezionato
  const filteredResults = yearTournaments.value
    ? risultati.value.filter((r) => yearTournaments.value.has(r.torneo))
    : risultati.value

  const pointsByPlayer = filteredResults.reduce((acc, r) => {
    acc[r.giocatore] = (acc[r.giocatore] ?? 0) + toInt(r.punti)
    return acc
  }, {})

  const leaderboard = Object.entries(pointsByPlayer).sort(([, a], [, b]) => b - a)
  const rank = leaderboard.findIndex(([n]) => n === name) + 1

  // Storico tornei del giocatore, dal più recente
  const history = playerResults
    .map((r) => {
      const tournament = tornei.value.find((t) => t.id === r.torneo)
      const results = buildTournamentResults(risultati.value, r.torneo).map((x) => ({
        ...x,
        isCurrentPlayer: x.name === name,
      }))
      return {
        id: r.torneo,
        name: tournament?.nome ?? `Torneo #${r.torneo}`,
        date: tournament?.data ?? '',
        playerCount: results.length,
        pos: toInt(r.posizione),
        points: r.punti,
        results,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  return { name, totalPoints, wins, top3, tournamentsPlayed: playerResults.length, rank, history }
})

onMounted(async () => {
  try {
    await fetchData()
  } catch (err) {
    error.value = err?.message ?? 'Errore sconosciuto'
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
          <div class="skeleton-line" style="width: 45%" />
          <div class="skeleton-line skeleton-line--sm" style="width: 28%" />
        </div>
      </div>
      <div class="skeleton-stats">
        <div v-for="i in 4" :key="i" class="skeleton-line skeleton-stat-block" />
      </div>
      <div v-for="i in 4" :key="i" class="skeleton-row">
        <div class="skeleton-line" :style="{ width: `${40 + (i % 3) * 18}%` }" />
      </div>
    </div>

    <!-- Errore -->
    <div v-else-if="error" class="error">Impossibile caricare i dati del giocatore.</div>

    <!-- Dettaglio giocatore -->
    <div v-else-if="player" class="card">
      <!-- Header -->
      <div class="player-header">
        <button class="back-btn" aria-label="Torna indietro" @click="router.back()">
          <span class="back-chevron" aria-hidden="true" />
        </button>
        <div class="avatar avatar--lg">{{ getInitials(player.name) }}</div>
        <div class="player-header-info">
          <div class="player-header-name">{{ player.name }}</div>
        </div>
      </div>

      <!-- Titolo sezione stagione -->
      <div class="section-title">Stagione {{ selectedYear }}</div>

      <!-- Statistiche -->
      <div class="stats-grid">
        <div class="stat stat--full">
          <div class="stat-label">Classifica</div>
          <div class="stat-value">{{ player.rank }}°</div>
        </div>
        <div class="stat">
          <div class="stat-label">Punti</div>
          <div class="stat-value">{{ player.totalPoints }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Tornei</div>
          <div class="stat-value">{{ player.tournamentsPlayed }}</div>
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
      <div class="history-title">Tornei</div>

      <template v-if="player.history.length > 0">
        <div v-for="t in player.history" :key="t.id" class="history-item">
          <div
            class="history-row clickable"
            role="button"
            tabindex="0"
            :aria-expanded="openId === t.id"
            :aria-label="`Espandi ${t.name}`"
            @click="toggle(t.id)"
            @keydown.enter="toggle(t.id)"
          >
            <div class="history-info">
              <div class="history-name" :class="{ 'history-name--open': openId === t.id }">
                {{ t.name }}
              </div>
              <div class="history-meta">
                {{ formatDate(t.date) }} · {{ t.playerCount }} giocatori
              </div>
            </div>
            <div class="history-row-right">
              <span class="pos-badge" :class="posBadgeClass(t.pos)">
                {{ posLabel(t.pos) }}
              </span>
              <span class="pts">{{ t.points }} pt</span>
              <span
                class="chevron"
                :class="{ 'chevron--open': openId === t.id }"
                aria-hidden="true"
              />
            </div>
          </div>

          <Transition name="detail">
            <div v-if="openId === t.id" class="tournament-detail">
              <div
                v-for="r in t.results"
                :key="r.name"
                class="detail-row"
                :class="r.isCurrentPlayer ? 'detail-row--hero' : 'detail-row--dimmed'"
              >
                <div class="detail-rank">{{ r.pos }}</div>
                <div
                  class="avatar avatar--sm"
                  :style="{ background: r.color.bg, color: r.color.fg }"
                >
                  {{ getInitials(r.name) }}
                </div>
                <div class="detail-name">{{ r.name }}</div>
                <div class="detail-pts">{{ r.points }} pt</div>
              </div>
            </div>
          </Transition>
        </div>
      </template>

      <!-- Empty state storico -->
      <div v-else class="empty-history">Nessun torneo per la stagione {{ selectedYear }}.</div>
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
  padding: 1rem;
  border-bottom: 0.5px solid var(--color-border);
  /* Altezza minima per touch target */
  min-height: var(--touch-target);
}

/* Bottone back con area toccabile adeguata */
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  width: 24px;
  height: var(--touch-target);
  border-radius: 50%;
  transition: background 0.15s;
}

.back-btn:hover {
  background: var(--color-bg-subtle);
}

/* Freccia sinistra CSS pura */
.back-chevron {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-left: 2px solid var(--color-muted);
  border-bottom: 2px solid var(--color-muted);
  transform: rotate(45deg) translate(2px, -2px);
  transition: border-color 0.15s;
}

.back-btn:hover .back-chevron {
  border-color: var(--color-text);
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

/* ─── Titoli sezione ────────────────────────────────────────────────────────── */

.section-title,
.history-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.section-title {
  padding: 0.75rem 1rem 0;
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

.stat--full {
  grid-column: 1 / -1;
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
  gap: 8px;
  padding: 0.875rem 1rem;
  min-height: var(--touch-target);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: var(--font-size-md);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* ─── Empty state ───────────────────────────────────────────────────────────── */

.empty-history {
  text-align: center;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  padding: 2rem 1rem;
}

/* ─── Highlight giocatore corrente nel dettaglio torneo ─────────────────────── */

.detail-row--hero {
  border-left: 2.5px solid var(--color-accent);
  padding-left: calc(1rem - 2.5px);
}

.detail-row--dimmed {
  opacity: 0.35;
  filter: blur(0.3px);
  transform: scale(0.985);
  transition:
    opacity 0.25s ease,
    filter 0.25s ease,
    transform 0.25s ease;
}

/* Al hover sul pannello, i giocatori non-correnti diventano leggibili */
.tournament-detail:hover .detail-row--dimmed:hover {
  opacity: 0.65;
  filter: none;
  transform: scale(1);
}
</style>
