<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchData, risultati } from '../store.js'
import { getInitials, getAvatarColor, toInt } from '../utils/helpers.js'

const router = useRouter()
const loading = ref(true)
const error = ref(null)

const players = computed(() => {
  if (!risultati.value) return []
  const map = {}
  for (const r of risultati.value) {
    if (!map[r.giocatore]) {
      map[r.giocatore] = { name: r.giocatore, points: 0 }
    }
    map[r.giocatore].points += toInt(r.punti)
  }
  return Object.values(map).sort((a, b) => b.points - a.points)
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
      <div v-for="i in 6" :key="i" class="skeleton-row">
        <div class="skeleton-circle" />
        <div class="skeleton-line" :style="{ width: `${55 + (i % 3) * 15}%` }" />
      </div>
    </div>

    <div v-else-if="error" class="error">Impossibile caricare la classifica.</div>

    <div v-else class="card">
      <table>
        <colgroup>
          <col class="col-rank">
          <col>
          <col class="col-points">
          <col class="col-chevron">
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
          <tr v-for="(player, index) in players" :key="player.name" class="clickable"
            @click="router.push(`/giocatori/${player.name}`)">
            <td class="rank-cell">
              <span v-if="index < 3" class="rank-badge" :class="`rank-badge--${index + 1}`">
                {{ index + 1 }}
              </span>
              <span v-else class="rank-num">{{ index + 1 }}</span>
            </td>
            <td>
              <div class="player-cell">
                <div class="avatar" :style="{ background: getAvatarColor(index).bg, color: getAvatarColor(index).fg }">
                  {{ getInitials(player.name) }}
                </div>
                <span class="player-name">{{ player.name }}</span>
              </div>
            </td>
            <td class="pts">{{ player.points }}</td>
            <td class="rank-cell"><span class="chevron">›</span></td>
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
  width: 86px;
}

.col-chevron {
  width: 32px;
}
</style>
