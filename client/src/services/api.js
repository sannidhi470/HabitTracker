export const API_ORIGIN = import.meta?.env?.VITE_API_ORIGIN || 'http://localhost:8081'

async function fetchWithFallback(path, init) {
  const url = API_ORIGIN + path
  try {
    console.debug('[API] request', { url, method: (init && init.method) || 'GET' })
    const res = await fetch(url, { credentials: 'include', ...(init || {}) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.debug('[API] response ok', { url, status: res.status, contentType: res.headers.get('content-type') })
    return res
  } catch (err) {
    console.error('[API] request failed', { url, method: (init && init.method) || 'GET', error: String(err) })
    throw err
  }
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

function todayLocalYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export async function getHabitIdByName(name) {
  console.debug('[API] getHabitIdByName start', { name })
  const res = await fetchWithFallback(`/api/habit/getHabitId?name=${encodeURIComponent(name)}`, { method: 'GET' })
  const id = await parseNumberResponse(res)
  console.debug('[API] getHabitIdByName success', { name, id })
  return id
}

async function deleteWithBody(path, payload) {
  const url = API_ORIGIN + path
  try {
    console.debug('[API] deleteWithBody request', { url, payload })
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const ok = res.status === 200 || res.status === 204 || res.status === 404
    if (!ok) {
      console.warn('[API] deleteWithBody unexpected status', { url, status: res.status })
    }
    if (ok) return true
    throw new Error(`Unexpected status ${res.status}`)
  } catch (err) {
    console.error('[API] deleteWithBody failed', { url, error: String(err) })
    throw err
  }
}

export async function deleteUserHabit({ userId, habitId }) {
  console.debug('[API] deleteUserHabit start', { userId, habitId })
  await deleteWithBody('/api/userhabit/deleteUserHabit', { userId, habitId })
  console.debug('[API] deleteUserHabit success', { userId, habitId })
}

export async function getPlansByUserId(userId) {
  console.debug('[API] getPlansByUserId start', { userId })
  const url = API_ORIGIN + `/api/plan/getPlansByUserId?userId=${encodeURIComponent(userId)}`
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'include' })
    if (res.status === 200) {
      const data = await parseJsonResponse(res)
      const list = Array.isArray(data) ? data : []
      console.debug('[API] getPlansByUserId success', { count: list.length })
      return list
    }
    if (res.status === 404) {
      console.debug('[API] getPlansByUserId not found 404')
      return []
    }
    console.warn('[API] getPlansByUserId unexpected status', { status: res.status })
    throw new Error(`Unexpected status ${res.status}`)
  } catch (err) {
    console.error('[API] getPlansByUserId failed', { url, error: String(err) })
    throw err
  }
}

export async function deletePlan({ userId, habitId }) {
  console.debug('[API] deletePlan start', { userId, habitId })
  await deleteWithBody('/api/plan/deletePlan', { userId, habitId })
  console.debug('[API] deletePlan success', { userId, habitId })
}

export async function deleteProgressRecords({ userId, habitId }) {
  console.debug('[API] deleteProgressRecords start', { userId, habitId })
  await deleteWithBody('/api/progress/deleteRecords', { userId, habitId })
  console.debug('[API] deleteProgressRecords success', { userId, habitId })
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
  const url = API_ORIGIN + '/api/plan/addPlan'
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    })
    console.debug('[API] addPlan response', { url, status: res.status })
    // Return raw response so caller can handle status 200/400 specifically
    return res
  } catch (err) {
    console.error('[API] addPlan failed', { url, error: String(err) })
    throw err
  }
}

export async function addHabit({ key, unit }) {
  console.debug('[API] addHabit start', { key, unit })
  const res = await fetchWithFallback('/api/habit/addHabit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, unit }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] addHabit success', { status: res.status, data })
  return data
}

export async function getUserHabits(userId) {
  console.debug('[API] getUserHabits start', { userId })
  const res = await fetchWithFallback(`/api/userhabit/getHabits?userId=${encodeURIComponent(userId)}`, { method: 'GET', credentials: 'include' })
  const data = await parseJsonResponse(res)
  console.debug('[API] getUserHabits success', { count: Array.isArray(data) ? data.length : 0, raw: data })
  return Array.isArray(data) ? data : []
}

export async function getPlan({ userId, habitId }) {
  console.debug('[API] getPlan start', { userId, habitId })
  const url = API_ORIGIN + '/api/plan/getPlan'
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
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
    throw new Error(`Unexpected status ${res.status}`)
  } catch (err) {
    console.error('[API] getPlan failed', { url, error: String(err) })
    throw err
  }
}

export async function hasPlansForUser(userId) {
  console.debug('[API] hasPlansForUser start', { userId })
  const url = API_ORIGIN + `/api/plan/getPlansByUserId?userId=${encodeURIComponent(userId)}`
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'include' })
    if (res.status === 200) {
      console.debug('[API] hasPlansForUser success 200')
      return true
    }
    if (res.status === 404) {
      console.debug('[API] hasPlansForUser not found 404')
      return false
    }
    console.warn('[API] hasPlansForUser unexpected status', { status: res.status })
    throw new Error(`Unexpected status ${res.status}`)
  } catch (err) {
    console.error('[API] hasPlansForUser failed', { url, error: String(err) })
    throw err
  }
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

export async function addProgress({ userId, habitId, logValue, timestamp }) {
  console.debug('[API] addProgress start', { userId, habitId, logValue, timestamp })
  const normalizedTimestamp = (() => {
    if (timestamp instanceof Date) return timestamp.toISOString()
    if (typeof timestamp === 'number') return new Date(timestamp).toISOString()
    if (typeof timestamp === 'string' && timestamp) return timestamp
    return new Date().toISOString()
  })()
  const res = await fetchWithFallback('/api/progress/addProgress', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId, logValue, timestamp: normalizedTimestamp }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] addProgress success', { status: res.status, data })
  return data
}

export async function getLatestProgress({ userId, habitId, timestamp }) {
  const ymd = (typeof timestamp === 'string' && timestamp) ? timestamp : todayLocalYmd()
  console.debug('[API] getLatestProgress start', { userId, habitId, timestamp: ymd })
  const res = await fetchWithFallback('/api/progress/latest', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId, timestamp: ymd }),
  })
  const data = await parseJsonResponse(res)
  console.debug('[API] getLatestProgress success', { status: res.status, data })
  return data
}

export async function getProgressRecords({ userId, habitId }) {
  console.debug('[API] getProgressRecords start', { userId, habitId })
  const res = await fetchWithFallback('/api/progress/getRecords', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habitId }),
  })
  const data = await parseJsonResponse(res)
  const list = Array.isArray(data) ? data : []
  console.debug('[API] getProgressRecords success', { count: list.length })
  return list
}

export async function getHabitUnit(habitId) {
  console.debug('[API] getHabitUnit start', { habitId })
  const res = await fetchWithFallback(`/api/habit/getHabitUnit?id=${encodeURIComponent(habitId)}`, { method: 'GET', credentials: 'include' })
  // Response may be raw string or object; normalize
  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    try {
      const json = await res.json()
      if (typeof json === 'string') return json
      if (json && typeof json === 'object') {
        return String(json.unit ?? json.habitUnit ?? '').trim()
      }
    } catch (_) {}
    return ''
  }
  try {
    const text = await res.text()
    return String(text || '').trim()
  } catch (_) {
    return ''
  }
}


