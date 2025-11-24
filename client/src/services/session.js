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
  try { return localStorage.getItem(KEYS.userEmail) || '' } catch (_) { return '' }
}

export function saveUserId(id) {
  try { localStorage.setItem(KEYS.userId, String(id)) } catch (_) {}
}

export function getUserId() {
  try {
    const v = localStorage.getItem(KEYS.userId)
    return v ? Number(v) : 0
  } catch (_) {
    return 0
  }
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



