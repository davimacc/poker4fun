import { ref } from 'vue'
import { getTornei, getRisultati } from './services/sheets.js'

const tornei = ref(null)
const risultati = ref(null)

/**
 * Carica tornei e risultati una sola volta per sessione.
 * Le chiamate successive trovano i dati già in memoria e non refetchano.
 */
export async function fetchData() {
  if (tornei.value && risultati.value) return

  const [t, r] = await Promise.all([getTornei(), getRisultati()])
  tornei.value = t
  risultati.value = r
}

export { tornei, risultati }
