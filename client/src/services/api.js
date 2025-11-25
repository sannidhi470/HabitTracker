const BASES = ['http://localhost:8081', 'http://127.0.0.1:8081']

async function fetchWithFallback(path, init) {
  let lastErr
  for (const base of BASES) {
    try {
      console.debug('[API] request', { url: base + path, method: (init && init.method) || 'GET' })
      const res = await fetch(base + path, init)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      console.debug('[API] response ok', { url: base + path, status: res.status, contentType: res.headers.get('content-type') })
      return res
    } catch (err) {
      console.error('[API] request failed', { url: base + path, method: (init && init.method) || 'GET', error: String(err) })
      lastErr = err
    }
  }
  throw lastErr
}

async function parseJsonResponse(res) {
  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    try {
      return await res.json()
    } catch (_) {
      return null
    }
  }
  try {
    const text = await res.text()
    return JSON.parse(text)
  } catch (_) {
    return null
  }
}

async function parseNumberResponse(res) {
  const type = res.headers.get('content-type') || ''
  console.debug('[API] parseNumberResponse content-type', type)
  if (type.includes('application/json')) {
    const data = await res.json()
    console.debug('[API] parseNumberResponse json', data)
    if (typeof data === 'number') return data
    if (data && typeof data === 'object') {
      const candidate =
        data.id ?? data.userId ?? data.habitId ?? (Array.isArray(data) && typeof data[0] === 'number' ? data[0] : undefined)
      const num = Number(candidate)
      if (!Number.isNaN(num)) return num
    }
    const numFromJson = Number(data)
    if (!Number.isNaN(numFromJson)) return numFromJson
  }
  const text = await res.text()
  console.debug('[API] parseNumberResponse text', text)
  const numFromText = Number((text || '').trim())
  if (!Number.isNaN(numFromText)) return numFromText
  throw new Error('Response did not contain a number')
}

export async function getHabitIdByName(name) {
  console.debug('[API] getHabitIdByName start', { name })
  const res = await fetchWithFallback(`/api/habit/getHabitId?name=${encodeURIComponent(name)}`, { method: 'GET' })
  const id = await parseNumberResponse(res)
  console.debug('[API] getHabitIdByName success', { name, id })
  return id
}

export async function getUserIdByEmail(email) {
  console.debug('[API] getUserIdByEmail start (POST)', { email })
  const res = await fetchWithFallback('/api/user/getUserId', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const id = await parseNumberResponse(res)
  console.debug('[API] getUserIdByEmail success (POST)', { email, id })
  return id
}

export async function addHabitToUser({ userId, habitId }) {
  console.debug('[API] addHabitToUser start', { userId, habitId })
  const res = await fetchWithFallback('/api/userhabit/addHabitToUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId }),
  })
  console.debug('[API] addHabitToUser success', { status: res.status })
}

export async function addPlan(plan) {
  console.debug('[API] addPlan start', plan)
  let lastErr
  for (const base of BASES) {
    const url = base + '/api/plan/addPlan'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
      console.debug('[API] addPlan response', { url, status: res.status })
      // Return raw response so caller can handle status 200/400 specifically
      return res
    } catch (err) {
      console.error('[API] addPlan failed', { url, error: String(err) })
      lastErr = err
    }
  }
  throw lastErr
}

export async function getUserHabits(userId) {
  console.debug('[API] getUserHabits start', { userId })
  const res = await fetchWithFallback(`/api/userhabit/getHabits?userId=${encodeURIComponent(userId)}`, { method: 'GET' })
  const data = await parseJsonResponse(res)
  console.debug('[API] getUserHabits success', { count: Array.isArray(data) ? data.length : 0, raw: data })
  return Array.isArray(data) ? data : []
}

export async function getPlan({ userId, habitId }) {
  console.debug('[API] getPlan start', { userId, habitId })
  let lastErr
  for (const base of BASES) {
    const url = base + '/api/plan/getPlan'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, habitId }),
      })
      if (res.status === 200) {
        const data = await parseJsonResponse(res)
        console.debug('[API] getPlan success', { userId, habitId, data })
        return data
      }
      if (res.status === 404) {
        console.debug('[API] getPlan not found', { userId, habitId })
        return null
      }
      console.warn('[API] getPlan unexpected status', { status: res.status })
    } catch (err) {
      console.error('[API] getPlan failed', { url, error: String(err) })
      lastErr = err
    }
  }
  throw lastErr
}

export async function logProgress({ userId, habitId, date, amount, mode = 'add', note = '' }) {
  console.debug('[API] logProgress start', { userId, habitId, date, amount, mode })
  const res = await fetchWithFallback('/api/progress/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId, date, amount, mode, note }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] logProgress success', { status: res.status, data })
  return data
}

export async function getProgressSummaryBatch({ userId, habitIds }) {
  console.debug('[API] getProgressSummaryBatch start', { userId, habitIds })
  const res = await fetchWithFallback('/api/progress/summary/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitIds }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] getProgressSummaryBatch success', { keys: data ? Object.keys(data).length : 0 })
  return data || {}
}

export async function addProgress({ userId, habitId, logValue }) {
  console.debug('[API] addProgress start', { userId, habitId, logValue })
  const res = await fetchWithFallback('/api/progress/addProgress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId, logValue }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] addProgress success', { status: res.status, data })
  return data
}

export async function getLatestProgress({ userId, habitId }) {
  console.debug('[API] getLatestProgress start', { userId, habitId })
  const res = await fetchWithFallback('/api/progress/latest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] getLatestProgress success', { status: res.status, data })
  return data
}

export async function getProgressRecords({ userId, habitId }) {
  console.debug('[API] getProgressRecords start', { userId, habitId })
  const res = await fetchWithFallback('/api/progress/getRecords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId }),
  })
  const data = await parseJsonResponse(res)
  const list = Array.isArray(data) ? data : []
  console.debug('[API] getProgressRecords success', { count: list.length })
  return list
}


