import { postWithFallback } from './auth.js'

function toTitleCaseSingleWord(input) {
  const lettersOnly = String(input || '').replace(/[^A-Za-z]/g, '')
  if (!lettersOnly) return ''
  const lower = lettersOnly.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function uniqueStrings(list) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    const key = item.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}

export async function suggestHabits({ description }) {
  const desc = String(description || '').trim()
  if (!desc) throw new Error('Description is required')
  const res = await postWithFallback('/ai/suggest-habits', { description: desc })
  let data = null
  try {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      data = await res.json()
    } else {
      const txt = await res.text()
      data = JSON.parse(txt)
    }
  } catch (_) {
    data = null
  }
  let array = []
  if (Array.isArray(data)) {
    array = data
  } else if (data && typeof data === 'object' && Array.isArray(data.habits)) {
    array = data.habits
  }
  const cleaned = array
    .map((v) => toTitleCaseSingleWord(v))
    .filter((v) => !!v)
  const unique = uniqueStrings(cleaned).slice(0, 3)
  return unique
}





