import '../styles/custom.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'
import { getUserEmail, getUserId, saveUserId } from '../services/session.js'
import { addHabit, addHabitToUser, getHabitIdByName, getUserIdByEmail } from '../services/api.js'
import { resolveCustomHabitImage, computeAccent } from '../services/images.js'

export default function CustomHabit() {
  const [theme, setTheme] = useState(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const initial = initThemeFromStorage()
    setTheme(initial)
  }, [])

  const onToggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const ensureUserId = async () => {
    let uid = getUserId()
    if (Number.isFinite(uid) && uid > 0) return uid
    const email = getUserEmail()
    if (email) {
      const fetched = await getUserIdByEmail(email)
      if (Number.isFinite(fetched) && fetched > 0) {
        saveUserId(fetched)
        return fetched
      }
    }
    return 0
  }

  const onCreate = async () => {
    const key = String(name || '').trim()
    const habitUnit = String(unit || '').trim()
    if (!key) {
      showToast({ title: 'Missing name', body: 'Please enter a habit name.', type: 'error', timeout: 2200 })
      return
    }
    if (!habitUnit) {
      showToast({ title: 'Missing unit', body: 'Please enter a unit.', type: 'error', timeout: 2200 })
      return
    }
    try {
      setBusy(true)
      showToast({ title: 'Creating habit…', body: 'Submitting to server.', type: 'info', timeout: 1200 })
      const userId = await ensureUserId()
      await addHabit({ key, unit: habitUnit })
      showToast({ title: 'Habit created', body: 'Fetching habit id…', type: 'success', timeout: 1200 })
      let habitId = 0
      // Always fetch habit id by name after creation per required flow
      habitId = await getHabitIdByName(key)
      console.log('[CustomHabit] getHabitIdByName →', habitId)
      showToast({ title: 'Habit id fetched', body: `ID: ${habitId}`, type: 'success', timeout: 1200 })
      if (Number.isFinite(userId) && userId > 0 && Number.isFinite(habitId) && habitId > 0) {
        console.log('[CustomHabit] Linking user to habit', { userId, habitId })
        showToast({ title: 'Linking…', body: 'Adding habit to your profile.', type: 'info', timeout: 1200 })
        await addHabitToUser({ userId, habitId })
        showToast({ title: 'Linked', body: 'Habit added to your profile.', type: 'success', timeout: 1200 })
      } else {
        console.warn('[CustomHabit] Skipping addHabitToUser due to invalid ids', { userId, habitId })
        const reason =
          !Number.isFinite(userId) || userId <= 0
            ? 'No user session found. Please sign in again.'
            : 'Could not resolve habit id.'
        showToast({ title: 'Could not link habit', body: reason, type: 'error', timeout: 2200 })
      }
      // Pre-resolve and cache visual for selection page (best-effort)
      if (Number.isFinite(userId) && userId > 0) {
        try {
          await resolveCustomHabitImage({ userId, name: key })
          computeAccent(key)
        } catch (_) {}
      }
    } catch (err) {
      console.error('[CustomHabit] create failed', err)
      showToast({ title: 'Create failed', body: String(err?.message || err), type: 'error', timeout: 2500 })
    } finally {
      setBusy(false)
      // Navigate to selection after linking attempt, also pass state to ensure card shows immediately
      navigate('/selection', { replace: true, state: { justCreatedCustom: { name: key, unit: habitUnit } } })
    }
  }

  return (
    <div className="custom-page">
      <header className="custom-header" aria-label="Header">
        <div className="custom-brand">
          <span className="custom-brand-text">Habit Tracker</span>
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: 8, justifySelf: 'end' }}>
          <button
            id="theme-toggle"
            className="icon-btn custom-theme-toggle"
            type="button"
            aria-pressed={String(theme === 'dark')}
            aria-label="Toggle dark mode"
            title="Toggle theme"
            onClick={onToggleTheme}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0 9 9 9 9 0 1 1-9-9z"></path>
            </svg>
          </button>
        </div>
      </header>

      <main className="custom-main">
        <section className="custom-intro" aria-labelledby="custom-title">
          <h1 id="custom-title" className="custom-title">Add a custom habit</h1>
          <p className="custom-subtitle">Name it and choose a unit to track.</p>
        </section>

        <section className="custom-form" aria-label="Custom habit form">
          <label className="field">
            <span className="field-label">Habit name</span>
            <input
              className="input"
              type="text"
              placeholder="e.g., Water Intake"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Habit name"
            />
          </label>
          <label className="field">
            <span className="field-label">Unit</span>
            <input
              className="input"
              type="text"
              placeholder="e.g., ml, minutes, reps"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              aria-label="Unit"
            />
          </label>
          <div className="form-actions">
            <button className="btn primary" type="button" disabled={busy} onClick={onCreate}>
              {busy ? 'Creating…' : 'Create habit'}
            </button>
            <button className="btn linklike" type="button" onClick={() => navigate('/selection')}>
              Go back to Selection Page
            </button>
          </div>
        </section>
      </main>
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}


