<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { availableYears, fetchData, risultati, selectedYear, tornei } from '../store.js'
import { getAvatarColor, getInitials, toInt } from '../utils/helpers.js'

const router = useRouter()
const loading = ref(true)
const error = ref(null)

// Filtra i risultati in base all'anno selezionato
const filteredResults = computed(() => {
  if (!risultati.value || !tornei.value || !selectedYear.value) return []

  const yearTournaments = new Set(
    tornei.value.filter((t) => t.data?.startsWith(selectedYear.value)).map((t) => t.id),
  )

  return risultati.value.filter((r) => yearTournaments.has(r.torneo))
})

// Calcola la classifica aggregando i punti per giocatore
const players = computed(() => {
  if (!filteredResults.value.length) return []

  const pointsMap = {}

  for (const result of filteredResults.value) {
    if (!pointsMap[result.giocatore]) {
      pointsMap[result.giocatore] = { name: result.giocatore, points: 0 }
    }
    pointsMap[result.giocatore].points += toInt(result.punti)
  }

  return Object.values(pointsMap).sort((a, b) => b.points - a.points)
})

// Restituisce le proprietà di stile inline per l'avatar
function avatarStyle(index) {
  const { bg, fg } = getAvatarColor(index)
  return { style: { background: bg, color: fg } }
}

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
    <!-- Filtro anno -->
    <div v-if="!loading && !error" class="year-filter">
      <div class="select-wrapper">
        <select v-model="selectedYear" class="year-select">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <span class="select-chevron" aria-hidden="true" />
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="skeleton">
      <div v-for="i in 6" :key="i" class="skeleton-row">
        <div class="skeleton-circle" />
        <div class="skeleton-line" :style="{ width: `${55 + (i % 3) * 15}%` }" />
      </div>
    </div>

    <!-- Errore -->
    <div v-else-if="error" class="error">Impossibile caricare la classifica.</div>

    <!-- Nessun dato per l'anno selezionato -->
    <div v-else-if="!players.length" class="card">
      <p class="empty-state">Nessun risultato per {{ selectedYear }}.</p>
    </div>

    <!-- Classifica -->
    <div v-else class="card">
      <table>
        <colgroup>
          <col class="col-rank" />
          <col />
          <col class="col-points" />
          <col class="col-chevron" />
        </colgroup>
        <thead>
          <tr>
            <th class="rank-cell">#</th>
            <th>Giocatore</th>
            <th>Punti</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(player, index) in players"
            :key="player.name"
            class="clickable"
            role="button"
            tabindex="0"
            :aria-label="`Vai al profilo di ${player.name}`"
            @click="router.push(`/giocatori/${player.name}`)"
            @keydown.enter="router.push(`/giocatori/${player.name}`)"
          >
            <td class="rank-cell">
              <span v-if="index < 3" class="rank-badge" :class="`rank-badge--${index + 1}`">
                {{ index + 1 }}
              </span>
              <span v-else class="rank-num">{{ index + 1 }}</span>
            </td>
            <td>
              <div class="player-cell">
                <div class="avatar" v-bind="avatarStyle(index)">
                  {{ getInitials(player.name) }}
                </div>
                <span class="player-name">{{ player.name }}</span>
              </div>
            </td>
            <td class="pts">{{ player.points }}</td>
            <td class="rank-cell">
              <span class="chevron" aria-hidden="true" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.col-rank {
  width: 48px;
}
.col-points {
  width: 80px;
}
.col-chevron {
  width: 36px;
}

/* ─── Filtro anno ───────────────────────────────────────────────────────────── */

.year-filter {
  display: flex;
  align-items: center;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.year-select {
  appearance: none;
  -webkit-appearance: none;
  background: white;
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-badge);
  /* Padding verticale adeguato al touch target */
  padding: 10px 36px 10px 14px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  font-family: inherit;
  cursor: pointer;
  min-height: var(--touch-target);
  transition: border-color 0.15s;
}

.year-select:focus {
  outline: none;
  border-color: var(--color-accent);
}

/* Freccia CSS pura al posto del carattere Unicode › */
.select-chevron {
  position: absolute;
  right: 13px;
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--color-muted);
  border-top: 2px solid var(--color-muted);
  transform: rotate(135deg);
  pointer-events: none;
}

/* ─── Empty state ───────────────────────────────────────────────────────────── */

.empty-state {
  text-align: center;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  padding: 2rem 1rem;
}
</style>
