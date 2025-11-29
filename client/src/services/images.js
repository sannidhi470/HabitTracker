const CACHE_PREFIX = 'habit:image:'

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '+')
}

function colorFromName(name) {
  const palette = ['#f97316', '#0ea5e9', '#10b981', '#e11d48', '#a855f7', '#22c55e', '#fb923c']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function getCacheKey(userId, name) {
  return `${CACHE_PREFIX}${userId}:${slugify(name)}`
}

export function getCachedHabitImage(userId, name) {
  try {
    const key = getCacheKey(userId, name)
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

export function setCachedHabitImage(userId, name, payload) {
  try {
    const key = getCacheKey(userId, name)
    localStorage.setItem(key, JSON.stringify(payload))
  } catch (_) {}
}

function makeMonogramDataUrl(name) {
  const letter = (String(name || '').trim()[0] || 'H').toUpperCase()
  const accent = colorFromName(name)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#311704" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        font-size="360" fill="rgba(255,255,255,0.92)" font-weight="800">${letter}</text>
</svg>`
  const encoded = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg, 'utf-8').toString('base64')
  return `data:image/svg+xml;base64,${encoded}`
}

export function computeAccent(name) {
  return colorFromName(name)
}

export async function fetchPixabayPreviewUrl({ apiKey, name }) {
  const q = `${slugify(name)}`
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${q}&image_type=photo`
  console.log('url', url)
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`)
  const data = await res.json()
  const hit = Array.isArray(data?.hits) && data.hits.length > 0 ? data.hits[0] : null
  const preview = hit?.previewURL || ''
  if (!preview) throw new Error('No previewURL from Pixabay')
  return preview
}

export async function resolveCustomHabitImage({ userId, name }) {
  const cached = getCachedHabitImage(userId, name)
  if (cached && cached.url) return cached.url
  const apiKey = import.meta?.env?.VITE_PIXABAY_KEY || '53410715-dea2ae00629946451fa5fe902'
  try {
    const previewUrl = await fetchPixabayPreviewUrl({ apiKey, name })
    setCachedHabitImage(userId, name, { url: previewUrl, type: 'pixabay' })
    return previewUrl
  } catch (_) {
    const dataUrl = makeMonogramDataUrl(name)
    setCachedHabitImage(userId, name, { url: dataUrl, type: 'monogram' })
    return dataUrl
  }
}


