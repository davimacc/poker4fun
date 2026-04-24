<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchData, tornei, risultati } from '../store.js'
import { getInitials, formatDate, buildTournamentResults } from '../utils/helpers.js'

const loading = ref(true)
const error = ref(null)
const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

const tournaments = computed(() => {
  if (!tornei.value || !risultati.value) return []
  return tornei.value
    .map(t => {
      const results = buildTournamentResults(risultati.value, t.id)
      return {
        id: t.id,
        name: t.nome,
        date: t.data,
        playerCount: results.length,
        results,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
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
      <div v-for="i in 5" :key="i" class="skeleton-row">
        <div class="skeleton-line" :style="{ width: `${45 + (i % 4) * 12}%` }" />
      </div>
    </div>

    <div v-else-if="error" class="error">Impossibile caricare i tornei.</div>

    <div v-else class="card">
      <div v-for="tournament in tournaments" :key="tournament.id" class="tournament-item">
        <div class="tournament-row clickable" @click="toggle(tournament.id)">
          <div>
            <div class="tournament-name" :class="{ 'tournament-name--open': openId === tournament.id }">
              {{ tournament.name }}
            </div>
            <div class="tournament-meta">
              {{ formatDate(tournament.date) }} · {{ tournament.playerCount }} giocatori
            </div>
          </div>
          <span class="chevron" :class="{ 'chevron--open': openId === tournament.id }">›</span>
        </div>

        <Transition name="detail">
          <div v-if="openId === tournament.id" class="tournament-detail">
            <div v-for="r in tournament.results" :key="r.name" class="detail-row">
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
  padding: 1rem;
}

.tournament-name {
  font-size: var(--font-size-base);
  font-weight: 500;
}

.tournament-name--open {
  font-weight: 600;
}

.tournament-meta {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: 4px;
}
</style>
