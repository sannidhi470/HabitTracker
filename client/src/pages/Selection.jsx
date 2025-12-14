import '../styles/selection.css'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logoutRequest } from '../services/auth.js'
import { clearSession, getUserId, getUserEmail, saveUserId } from '../services/session.js'
import { getUserIdByEmail, getUserHabits, hasPlansForUser } from '../services/api.js'
import { resolveCustomHabitImage, computeAccent } from '../services/images.js'
import readingImg from '../assets/backgrounds/Reading.jpg'
import meditationImg from '../assets/backgrounds/mediatation 2.jpg'
import workoutImg from '../assets/backgrounds/workout.jpg'
import journalingImg from '../assets/backgrounds/journal-16.jpg'

export default function Selection() {
  const [cards, setCards] = useState([])
  const [hasAnyPlans, setHasAnyPlans] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const load = async () => {
      // Built-ins
      const builtin = [
        { key: 'reading', label: 'Reading', accent: '#f97316', image: readingImg },
        { key: 'meditation', label: 'Meditation', accent: '#f97316', image: meditationImg },
        { key: 'workout', label: 'Workout', accent: '#f97316', image: workoutImg },
        { key: 'journaling', label: 'Journaling', accent: '#f97316', image: journalingImg },
      ]
      // Resolve user id
      let userId = getUserId()
      if (!Number.isFinite(userId) || userId <= 0) {
        const email = getUserEmail()
        if (email) {
          try {
            const fetched = await getUserIdByEmail(email)
            if (Number.isFinite(fetched) && fetched > 0) {
              userId = fetched
              saveUserId(fetched)
            }
          } catch (_) {}
        }
      }
      // If user present, merge custom habits
      if (Number.isFinite(userId) && userId > 0) {
        // Check if user already has any plans; show quick navigation to dashboard
        try {
          const exists = await hasPlansForUser(userId)
          setHasAnyPlans(Boolean(exists))
        } catch (_) {
          setHasAnyPlans(false)
        }
        try {
          const list = await getUserHabits(userId)
          const allowed = ['reading','meditation','workout','journaling']
          const toName = (item) => {
            if (!item) return ''
            if (typeof item === 'string') return item
            const n = item?.name ?? item?.key ?? item?.habitName ?? item?.HabitName ?? item?.title ?? ''
            if (n) return String(n)
            const nested = item?.habit || item?.Habit || null
            const nn = nested?.name ?? nested?.key ?? nested?.habitName ?? nested?.title ?? ''
            return String(nn || '')
          }
          const toKey = (name) => {
            const k = String(name || '').toLowerCase().replace(/\s+/g, '')
            if (k.includes('read')) return 'reading'
            if (k.includes('medit')) return 'meditation'
            if (k.includes('work')) return 'workout'
            if (k.includes('journal') || k.includes('write')) return 'journaling'
            return ''
          }
          let customNames = Array.from(new Set(
            list.map(toName)
              .map((n) => String(n || '').trim())
              .filter((n) => n && !allowed.includes(toKey(n)))
          ))
          // Include just-created custom (not yet linked) if provided via navigation state
          const justCreated = location?.state?.justCreatedCustom
          if (justCreated && typeof justCreated.name === 'string') {
            const jc = String(justCreated.name || '').trim()
            if (jc && !customNames.find((n) => n.toLowerCase() === jc.toLowerCase())) {
              customNames = [...customNames, jc]
            }
          }
          if (customNames.length > 0) {
            const images = await Promise.all(customNames.map(async (n) => {
              try { return await resolveCustomHabitImage({ userId, name: n }) } catch (_) { return '' }
            }))
            const customs = customNames.map((n, idx) => {
              const justCreated = location?.state?.justCreatedCustom
              const same = justCreated && String(justCreated.name || '').trim().toLowerCase() === String(n || '').trim().toLowerCase()
              return {
                key: `custom:${n.toLowerCase().replace(/\s+/g, '-')}`,
                label: n,
                accent: computeAccent(n),
                image: images[idx] || '',
                unit: same ? String(justCreated.unit || '').trim() : undefined,
              }
            })
            setCards([...builtin, ...customs])
            return
          }
        } catch (_) {
          // ignore and fall back to builtins
        }
      }
      setCards(builtin)
    }
    load()
  }, [])

  const onLogout = () => {
    ;(async () => {
      try { await logoutRequest() } catch (_) {}
      clearSession()
      navigate('/auth', { replace: true })
    })()
  }

  const onSelect = useCallback((card) => {
    const key = card?.key || ''
    if (key === 'reading') { navigate('/reading'); return }
    if (key === 'meditation') { navigate('/meditation'); return }
    if (key === 'workout') { navigate('/workout'); return }
    if (key === 'journaling') { navigate('/journaling'); return }
    if (key.startsWith('custom:')) {
      const slug = key.slice('custom:'.length)
      navigate(`/habit/${encodeURIComponent(slug)}`, { state: { name: card.label, unit: card.unit } })
      return
    }
  }, [navigate])

  const quickIdeas = [
    { name: 'Water Intake', unit: 'ml' },
    { name: 'Daily Steps', unit: 'steps' },
    { name: 'Sleep Time', unit: 'hours' },
    { name: 'Stretching', unit: 'minutes' },
    { name: 'Screen-Free Time', unit: 'minutes' },
  ]

  return (
    <div className="selection-page">
      <header className="selection-header" aria-label="Header">
        <div className="selection-brand">
          <span className="selection-brand-text">Habit Tracker</span>
        </div>
        <div style={{ gridColumn: 3, justifySelf: 'end', display: 'grid', gridAutoFlow: 'column', gap: 8 }}>
          {hasAnyPlans && (
            <button
              className="btn primary"
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Go to Dashboard"
              title="Go to Dashboard"
            >
              Go to Dashboard
            </button>
          )}
          <button className="btn primary" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="selection-main">
        <section className="selection-intro" aria-labelledby="selection-title">
          <h1 id="selection-title" className="selection-title">What would you like to work on?</h1>
          <p className="selection-subtitle">Pick one to begin. You can add more later.</p>
        </section>

        <section className="cards-grid" aria-label="Habit options">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              className="habit-card"
              style={{ '--accent': c.accent }}
              onClick={() => onSelect(c)}
              aria-label={c.label}
            >
              <span className="habit-visual" aria-hidden="true">
                <span
                  className="habit-thumb"
                  style={{ backgroundImage: `url(${c.image})` }}
                />
              </span>
              <span className="habit-title">{c.label}</span>
            </button>
          ))}
        </section>

        <section className="selection-aux-actions" aria-label="More options">
          <button
            type="button"
            className="aux-link-btn"
            aria-label="Add a custom habit"
            onClick={() => navigate('/custom-habit')}
          >
            Add a custom habit
          </button>
        </section>

        <section className="selection-aux-ideas" aria-label="Quick habit ideas">
          <span className="aux-separator">Or try one of these popular ideas:</span>
          <div className="idea-chip-row">
            {quickIdeas.map((idea) => (
              <button
                key={idea.name}
                type="button"
                className="idea-chip"
                onClick={() => navigate('/custom-habit', { state: { template: idea } })}
                aria-label={`Use idea: ${idea.name}`}
              >
                {idea.name}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
