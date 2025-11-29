import '../styles/custom.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'
import { getUserEmail, getUserId, saveUserId } from '../services/session.js'
import { addHabit, addHabitToUser, getHabitIdByName, getUserIdByEmail } from '../services/api.js'
import { resolveCustomHabitImage, computeAccent } from '../services/images.js'
import { suggestHabits } from '../services/ai.js'

export default function AIHabitSuggest() {
  const [theme, setTheme] = useState(null)
  const [description, setDescription] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
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

  const onGetSuggestions = async () => {
    const value = String(description || '').trim()
    if (!value) {
      showToast({ title: 'Missing description', body: 'Tell the AI what you want to work on.', type: 'error', timeout: 2200 })
      return
    }
    try {
      setLoading(true)
      setSelected(new Set())
      showToast({ title: 'Getting ideas…', body: 'Asking AI for habits.', type: 'info', timeout: 1200 })
      const list = await suggestHabits({ description: value })
      if (!Array.isArray(list) || list.length === 0) {
        showToast({ title: 'No suggestions', body: 'Try a clearer description.', type: 'error', timeout: 2200 })
        setSuggestions([])
        return
      }
      setSuggestions(list)
      showToast({ title: 'Suggestions ready', body: list.join(', '), type: 'success', timeout: 1500 })
    } catch (err) {
      console.error('[AIHabitSuggest] suggest failed', err)
      showToast({ title: 'AI failed', body: 'Please try again.', type: 'error', timeout: 2400 })
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (name) => {
    const next = new Set(selected)
    const k = String(name || '')
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setSelected(next)
  }

  const onAddSelected = async () => {
    if (selected.size === 0) {
      showToast({ title: 'Nothing selected', body: 'Pick one or more habits.', type: 'error', timeout: 2000 })
      return
    }
    try {
      setAdding(true)
      const userId = await ensureUserId()
      if (!Number.isFinite(userId) || userId <= 0) {
        showToast({ title: 'Login required', body: 'Please sign in again.', type: 'error', timeout: 2400 })
        return
      }
      const chosen = Array.from(selected)
      showToast({ title: 'Adding habits…', body: chosen.join(', '), type: 'info', timeout: 1200 })
      // Sequentially add and link each habit to preserve order and toasts
      for (const key of chosen) {
        const habitName = String(key || '').trim()
        if (!habitName) continue
        try {
          // Default unit for AI-suggested habits
          const unit = 'minutes'
          await addHabit({ key: habitName, unit })
          let habitId = await getHabitIdByName(habitName)
          if (Number.isFinite(habitId) && habitId > 0) {
            await addHabitToUser({ userId, habitId })
            try {
              await resolveCustomHabitImage({ userId, name: habitName })
              computeAccent(habitName)
            } catch (_) {}
          } else {
            console.warn('[AIHabitSuggest] could not resolve habit id', { habitName, habitId })
          }
        } catch (inner) {
          console.error('[AIHabitSuggest] add/link failed', habitName, inner)
        }
      }
      showToast({ title: 'Added', body: 'Habits added to your selection.', type: 'success', timeout: 1600 })
      navigate('/selection', { replace: true, state: { aiAdded: chosen } })
    } catch (err) {
      console.error('[AIHabitSuggest] addSelected failed', err)
      showToast({ title: 'Failed to add', body: 'Please try again.', type: 'error', timeout: 2400 })
    } finally {
      setAdding(false)
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
        <section className="custom-intro" aria-labelledby="ai-title">
          <h1 id="ai-title" className="custom-title">Not sure what to pick?</h1>
          <p className="custom-subtitle">Describe your goal and let AI suggest up to 3 habits.</p>
        </section>

        <section className="custom-form" aria-label="AI habit suggestions">
          <label className="field">
            <span className="field-label">What do you want to work on?</span>
            <input
              className="input"
              type="text"
              placeholder="e.g., get fit, reduce stress, be more mindful"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Goal description"
            />
          </label>
          <div className="form-actions">
            <button className="btn primary" type="button" disabled={loading} onClick={onGetSuggestions}>
              {loading ? 'Getting suggestions…' : 'Get suggestions'}
            </button>
            <button className="btn linklike" type="button" onClick={() => navigate('/selection')}>
              Go back to Selection Page
            </button>
          </div>

          {suggestions.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="field-label">Suggestions</div>
              <div
                role="listbox"
                aria-label="AI habit suggestions"
                style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
              >
                {suggestions.map((s) => {
                  const isSelected = selected.has(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSelect(s)}
                      aria-pressed={String(isSelected)}
                      className="btn"
                      style={{
                        background: isSelected ? '#f97316' : '#311704',
                        borderColor: isSelected ? '#ef6a09' : 'rgba(0,0,0,0.12)',
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>

              <div className="form-actions">
                <button
                  className="btn primary"
                  type="button"
                  disabled={adding || selected.size === 0}
                  onClick={onAddSelected}
                >
                  {adding ? 'Adding…' : `Add selected (${selected.size})`}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}





