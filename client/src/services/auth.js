export const themeKey = 'habit-theme'

export function setTheme(theme) {
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(themeKey, theme) } catch (_) {}
  } else {
    document.documentElement.removeAttribute('data-theme')
    try { localStorage.removeItem(themeKey) } catch (_) {}
  }
  const btn = document.querySelector('#theme-toggle')
  if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'))
}

export function initThemeFromStorage() {
  let stored = null
  try { stored = localStorage.getItem(themeKey) } catch (_) {}
  if (stored === 'dark' || stored === 'light') {
    setTheme(stored)
    return stored
  }
  setTheme(null)
  return null
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function showToast({ title = 'Notice', body = '', type = 'default', timeout = 3000 } = {}) {
  const container = document.querySelector('#toast-container')
  if (!container) return () => {}
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <div class="toast-title">${escapeHtml(title)}</div>
    ${body ? `<div class="toast-body">${escapeHtml(body)}</div>` : ''}
  `
  container.appendChild(toast)
  const remove = () => {
    if (toast && toast.parentNode) toast.parentNode.removeChild(toast)
  }
  setTimeout(remove, timeout)
  return remove
}

export function passwordStrength(value) {
  let score = 0
  if (value.length >= 8) score++
  if (/[a-zA-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const label = score >= 4 ? 'Strong' : score >= 3 ? 'Medium' : value ? 'Weak' : '—'
  return { score, label }
}

export function validateEmail(value) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(value).toLowerCase())
}

async function postJson(url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function postWithFallback(path, payload) {
  const urls = [`http://localhost:8081${path}`, `http://127.0.0.1:8081${path}`]
  let lastErr
  for (const u of urls) {
    try {
      const res = await postJson(u, payload)
      return res
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

export async function loginRequest({ email, password }) {
  return postWithFallback('/api/user/login', { email, password })
}

export async function signupRequest({ fullName, email, password }) {
  return postWithFallback('/api/signup', { fullName, email, password })
}

export async function startOAuth(provider) {
  showToast({
    title: `OAuth: ${provider}`,
    body: 'Redirect to provider — replace with your backend route.',
  })
  // Example for later:
  // location.href = `/auth/${provider}`
}


