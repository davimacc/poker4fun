// ─── Costanti ────────────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  { bg: '#EEEDFE', fg: '#3C3489' },
  { bg: '#E1F5EE', fg: '#085041' },
  { bg: '#FAEEDA', fg: '#633806' },
  { bg: '#FBEAF0', fg: '#72243E' },
  { bg: '#E6F1FB', fg: '#0C447C' },
  { bg: '#F1EFE8', fg: '#444441' },
  { bg: '#FCEBEB', fg: '#791F1F' },
  { bg: '#EAF3DE', fg: '#27500A' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Restituisce le iniziali di un nome (es. "Mario Rossi" → "MR"). */
export function getInitials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/** Restituisce la coppia di colori avatar per l'indice dato. */
export function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

/** Converte un valore in intero; restituisce 0 se non parsabile. */
export function toInt(value) {
  const n = parseInt(value)
  return isNaN(n) ? 0 : n
}

/** Formatta una data ISO in formato leggibile italiano. */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Costruisce la lista ordinata dei risultati di un singolo torneo.
 * I colori avatar sono raggruppati nell'oggetto `color: { bg, fg }`.
 */
export function buildTournamentResults(allResults, tournamentId) {
  return allResults
    .filter(r => r.torneo === tournamentId)
    .sort((a, b) => toInt(a.posizione) - toInt(b.posizione))
    .map((r, index) => ({
      pos: toInt(r.posizione),
      name: r.giocatore,
      points: r.punti,
      color: getAvatarColor(index),
    }))
}
