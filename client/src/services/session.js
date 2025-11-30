const KEYS = {
  userEmail: 'user:email',
  userId: 'user:id',
  habitId: 'habit:id',
  habitKey: 'habit:key',
}

export function saveUserEmail(email) {
  try { localStorage.setItem(KEYS.userEmail, String(email || '')) } catch (_) {}
}

export function getUserEmail() {
  try {
    const v = localStorage.getItem(KEYS.userEmail)
    if (v) return v
  } catch (_) {}
  try {
    const v = sessionStorage.getItem(KEYS.userEmail)
    return v || ''
  } catch (_) { return '' }
}

export function saveUserId(id) {
  try { localStorage.setItem(KEYS.userId, String(id)) } catch (_) {}
}

export function getUserId() {
  try {
    const v = localStorage.getItem(KEYS.userId)
    return v ? Number(v) : 0
  } catch (_) {
    // fall through
  }
  try {
    const v = sessionStorage.getItem(KEYS.userId)
    return v ? Number(v) : 0
  } catch (_) { return 0 }
}

export function saveHabitId(id) {
  try { localStorage.setItem(KEYS.habitId, String(id)) } catch (_) {}
}

export function getHabitId() {
  try {
    const v = localStorage.getItem(KEYS.habitId)
    return v ? Number(v) : 0
  } catch (_) {
    return 0
  }
}

export function saveHabitKey(key) {
  try { localStorage.setItem(KEYS.habitKey, String(key || '')) } catch (_) {}
}

export function getHabitKey() {
  try { return localStorage.getItem(KEYS.habitKey) || '' } catch (_) { return '' }
}

export function clearSession() {
  try { localStorage.removeItem(KEYS.userEmail) } catch (_) {}
  try { localStorage.removeItem(KEYS.userId) } catch (_) {}
  try { localStorage.removeItem(KEYS.habitId) } catch (_) {}
  try { localStorage.removeItem(KEYS.habitKey) } catch (_) {}
  try { sessionStorage.removeItem(KEYS.userEmail) } catch (_) {}
  try { sessionStorage.removeItem(KEYS.userId) } catch (_) {}
}

// Session-only variants (do not survive browser restart)
export function saveUserEmailSession(email) {
  try { sessionStorage.setItem(KEYS.userEmail, String(email || '')) } catch (_) {}
}
export function saveUserIdSession(id) {
  try { sessionStorage.setItem(KEYS.userId, String(id)) } catch (_) {}
}



