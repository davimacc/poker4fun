<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchData, risultati, tornei } from '../store.js'
import { buildTournamentResults, formatDate, getInitials } from '../utils/helpers.js'

const loading = ref(true)
const error = ref(null)
const openTournamentId = ref(null)

// Array di anni aperti — più semplice e reattivo di un ref<Set>
const openYears = ref([])

function toggleTournament(id) {
  openTournamentId.value = openTournamentId.value === id ? null : id
}

function toggleYear(year) {
  const index = openYears.value.indexOf(year)
  if (index !== -1) {
    // Chiude l'anno: se il torneo aperto appartiene a questo anno, lo chiude
    const tournament = flatTournaments.value.find((t) => t.id === openTournamentId.value)
    if (tournament?.year === year) openTournamentId.value = null
    openYears.value = openYears.value.filter((y) => y !== year)
  } else {
    openYears.value = [...openYears.value, year]
  }
}

function isYearOpen(year) {
  return openYears.value.includes(year)
}

function tournamentCountLabel(n) {
  return n === 1 ? '1 torneo' : `${n} tornei`
}

// Lista piatta dei tornei con risultati già calcolati
const flatTournaments = computed(() => {
  if (!tornei.value || !risultati.value) return []

  return tornei.value
    .map((t) => {
      const results = buildTournamentResults(risultati.value, t.id)
      return {
        id: t.id,
        name: t.nome,
        date: t.data,
        year: t.data?.slice(0, 4) ?? 'N/D',
        playerCount: results.length,
        results,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
})

// Tornei raggruppati per anno, dal più recente
const groupedByYear = computed(() => {
  const map = {}
  for (const t of flatTournaments.value) {
    if (!map[t.year]) map[t.year] = []
    map[t.year].push(t)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, tournaments]) => ({ year, tournaments }))
})

onMounted(async () => {
  try {
    await fetchData()
    // Apre di default tutti gli anni disponibili
    openYears.value = groupedByYear.value.map((g) => g.year)
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
      <div v-for="i in 6" :key="i" class="skeleton-row">
        <div class="skeleton-line" :style="{ width: `${45 + (i % 4) * 12}%` }" />
      </div>
    </div>

    <!-- Errore -->
    <div v-else-if="error" class="error">Impossibile caricare i tornei.</div>

    <!-- Lista tornei per anno -->
    <template v-else>
      <div v-for="group in groupedByYear" :key="group.year" class="year-group">
        <button
          class="year-header"
          :aria-expanded="isYearOpen(group.year)"
          :aria-controls="`year-section-${group.year}`"
          @click="toggleYear(group.year)"
        >
          <span class="year-label">{{ group.year }}</span>
          <span class="year-meta">{{ tournamentCountLabel(group.tournaments.length) }}</span>
          <span
            class="chevron"
            :class="{ 'chevron--open': isYearOpen(group.year) }"
            aria-hidden="true"
          />
        </button>

        <Transition name="year-section">
          <div
            v-if="isYearOpen(group.year)"
            :id="`year-section-${group.year}`"
            class="card year-card"
          >
            <div
              v-for="tournament in group.tournaments"
              :key="tournament.id"
              class="tournament-item"
            >
              <div
                class="tournament-row clickable"
                role="button"
                tabindex="0"
                :aria-expanded="openTournamentId === tournament.id"
                :aria-label="`Espandi ${tournament.name}`"
                @click="toggleTournament(tournament.id)"
                @keydown.enter="toggleTournament(tournament.id)"
              >
                <div class="tournament-info">
                  <div
                    class="tournament-name"
                    :class="{ 'tournament-name--open': openTournamentId === tournament.id }"
                  >
                    {{ tournament.name }}
                  </div>
                  <div class="tournament-meta">
                    {{ formatDate(tournament.date) }} · {{ tournament.playerCount }} giocatori
                  </div>
                </div>
                <span
                  class="chevron"
                  :class="{ 'chevron--open': openTournamentId === tournament.id }"
                  aria-hidden="true"
                />
              </div>

              <Transition name="detail">
                <div v-if="openTournamentId === tournament.id" class="tournament-detail">
                  <div v-for="r in tournament.results" :key="r.name" class="detail-row">
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
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
.year-group {
  display: flex;
  flex-direction: column;
}

.year-header {
  display: flex;
  align-items: center;
  gap: 8px;
  /* Touch target: padding verticale per raggiungere i 44px */
  padding: 0.75rem 0.25rem;
  min-height: var(--touch-target);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  width: 100%;
  text-align: left;
}

.year-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.year-meta {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  flex: 1;
}

/* Transizione sezione anno */
.year-section-enter-active,
.year-section-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.year-section-enter-from,
.year-section-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.tournament-item {
  border-bottom: 0.5px solid var(--color-border);
}

.tournament-item:last-child {
  border-bottom: none;
}

.tournament-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  /* Touch target: min-height garantisce area toccabile sufficiente */
  min-height: var(--touch-target);
}

.tournament-info {
  flex: 1;
  min-width: 0;
}

.tournament-name {
  font-size: var(--font-size-md);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tournament-name--open {
  font-weight: 600;
}

.tournament-meta {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: 2px;
}
</style>
