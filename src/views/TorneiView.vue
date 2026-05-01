<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchData, tornei, risultati } from '../store.js'
import { getInitials, formatDate, buildTournamentResults } from '../utils/helpers.js'

const loading = ref(true)
const error = ref(null)
const openTorneoId = ref(null)
const openYears = ref(new Set())

function toggleTorneo(id) {
  openTorneoId.value = openTorneoId.value === id ? null : id
}

function toggleYear(year) {
  const next = new Set(openYears.value)
  if (next.has(year)) {
    next.delete(year)
    const t = flatTournaments.value.find((t) => t.id === openTorneoId.value)
    if (t?.year === year) openTorneoId.value = null
  } else {
    next.add(year)
  }
  openYears.value = next
}

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

function torneiLabel(n) {
  return n === 1 ? '1 torneo' : `${n} tornei`
}

onMounted(async () => {
  try {
    await fetchData()
    openYears.value = new Set(groupedByYear.value.map((g) => g.year))
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
      <div v-for="i in 6" :key="i" class="skeleton-row">
        <div class="skeleton-line" :style="{ width: `${45 + (i % 4) * 12}%` }" />
      </div>
    </div>

    <div v-else-if="error" class="error">Impossibile caricare i tornei.</div>

    <template v-else>
      <div v-for="group in groupedByYear" :key="group.year" class="year-group">
        <button class="year-header" @click="toggleYear(group.year)">
          <span class="year-label">{{ group.year }}</span>
          <span class="year-meta">{{ torneiLabel(group.tournaments.length) }}</span>
          <span class="chevron" :class="{ 'chevron--open': openYears.has(group.year) }">›</span>
        </button>

        <Transition name="year-section">
          <div v-if="openYears.has(group.year)" class="card year-card">
            <div
              v-for="tournament in group.tournaments"
              :key="tournament.id"
              class="tournament-item"
            >
              <div class="tournament-row clickable" @click="toggleTorneo(tournament.id)">
                <div>
                  <div
                    class="tournament-name"
                    :class="{ 'tournament-name--open': openTorneoId === tournament.id }"
                  >
                    {{ tournament.name }}
                  </div>
                  <div class="tournament-meta">
                    {{ formatDate(tournament.date) }} · {{ tournament.playerCount }} giocatori
                  </div>
                </div>
                <span class="chevron" :class="{ 'chevron--open': openTorneoId === tournament.id }"
                  >›</span
                >
              </div>

              <Transition name="detail">
                <div v-if="openTorneoId === tournament.id" class="tournament-detail">
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
  padding: 0.75rem 0.25rem;
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

.year-header .chevron {
  font-size: 16px;
}

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
}

.tournament-name {
  font-size: var(--font-size-md);
  font-weight: 500;
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
