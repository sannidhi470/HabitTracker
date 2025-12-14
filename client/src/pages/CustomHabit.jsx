import '../styles/custom.css'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { showToast } from '../services/auth.js'
import { getUserEmail, getUserId, saveUserId } from '../services/session.js'
import { addHabit, addHabitToUser, getHabitIdByName, getUserIdByEmail } from '../services/api.js'
import { resolveCustomHabitImage, computeAccent } from '../services/images.js'

export default function CustomHabit() {
  const location = useLocation()
  const template = location?.state?.template || {}
  const initialName = String(template.name || '').trim()
  const initialUnit = String(template.unit || '').trim()

  const [name, setName] = useState(initialName)
  const [unit, setUnit] = useState(initialUnit)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

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
      </header>

      <main className="custom-main">
        <section className="custom-intro" aria-labelledby="custom-title">
          <h1 id="custom-title" className="custom-title">Add a custom habit</h1>
          <p className="custom-subtitle">Name it and choose a unit to track.</p>
        </section>

        <section className="custom-form" aria-label="Custom habit form">
          <h2 className="plan-title">Plan setup</h2>
          <form
            className="custom-plan-form"
            onSubmit={(e) => {
              e.preventDefault()
              onCreate()
            }}
          >
            <div className="grid">
              <div className="field">
                <label className="label" htmlFor="habitName">Habit name</label>
                <input
                  id="habitName"
                  className="input"
                  type="text"
                  placeholder="e.g., Water Intake"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Habit name"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="habitUnit">Unit</label>
                <input
                  id="habitUnit"
                  className="input"
                  type="text"
                  placeholder="e.g., ml, minutes, reps"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  aria-label="Unit"
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create habit'}
              </button>
              <button className="btn linklike" type="button" onClick={() => navigate('/selection')}>
                Go back to Selection Page
              </button>
            </div>
          </form>
        </section>
      </main>
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}
