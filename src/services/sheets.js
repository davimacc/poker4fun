const SHEET_ID = '12VGcwWwlA5wQa13Db_H4M3DiO7XPb4OgtXjBVtrftsQ'

function csvUrl(foglio) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(foglio)}`
}

function parseCsv(text) {
  const [headerRow, ...rows] = text.trim().split('\n')
  const headers = headerRow.split(',').map(h => h.replace(/"/g, '').trim())

  return rows.map(row => {
    const valori = row.split(',').map(v => v.replace(/"/g, '').trim())
    return Object.fromEntries(headers.map((h, i) => [h, valori[i] ?? '']))
  })
}

async function fetchCsv(foglio) {
  const res = await fetch(csvUrl(foglio))
  if (!res.ok) throw new Error(`Errore nel caricamento del foglio "${foglio}": ${res.status}`)
  const text = await res.text()
  return parseCsv(text)
}

export async function getTornei() {
  return fetchCsv('Tornei')
}

export async function getRisultati() {
  return fetchCsv('Risultati')
}