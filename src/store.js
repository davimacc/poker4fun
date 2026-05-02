import { ref, computed } from 'vue'
import { getTornei, getRisultati } from './services/sheets.js'

const tornei = ref(null)
const risultati = ref(null)

/**
 * Anno selezionato globalmente. null = tutti gli anni.
 */
export const selectedYear = ref(null)

/**
 * Lista degli anni disponibili, ricavata dai tornei caricati.
 * Ordinata dal più recente al più vecchio.
 */
export const availableYears = computed(() => {
  if (!tornei.value) return []
  const years = [...new Set(
    tornei.value
      .map(t => t.data?.slice(0, 4))
      .filter(Boolean)
  )].sort((a, b) => b.localeCompare(a))
  return years
})

/**
 * Carica tornei e risultati una sola volta per sessione.
 * Le chiamate successive trovano i dati già in memoria e non refetchano.
 */
export async function fetchData() {
  if (tornei.value && risultati.value) return

  const [t, r] = await Promise.all([getTornei(), getRisultati()])
  tornei.value = t
  risultati.value = r

  // Seleziona l'anno più recente come default
  if (availableYears.value.length > 0 && selectedYear.value === null) {
    selectedYear.value = availableYears.value[0]
  }
}

export { tornei, risultati }
