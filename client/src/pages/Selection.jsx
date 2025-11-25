import '../styles/selection.css'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initThemeFromStorage, setTheme as applyTheme } from '../services/auth.js'
import { clearSession } from '../services/session.js'
import readingImg from '../assets/backgrounds/Reading.jpg'
import meditationImg from '../assets/backgrounds/mediatation 2.jpg'
import workoutImg from '../assets/backgrounds/workout.jpg'
import journalingImg from '../assets/backgrounds/journal-16.jpg'

export default function Selection() {
  // Theme init and toggle (reuses the same helpers as Auth page)
  const [theme, setTheme] = useState(null)
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
  const onLogout = () => {
    clearSession()
    navigate('/auth', { replace: true })
  }

  const onSelect = useCallback((key) => {
    if (key === 'reading') navigate('/reading')
    if (key === 'meditation') navigate('/meditation')
    if (key === 'workout') navigate('/workout')
    if (key === 'journaling') navigate('/journaling')
    // For other cards, wire up when their setup pages are ready
  }, [navigate])

  const cards = [
    { key: 'reading', label: 'Reading', accent: '#f97316', image: readingImg },
    { key: 'meditation', label: 'Meditation', accent: '#f97316', image: meditationImg },
    { key: 'workout', label: 'Workout', accent: '#f97316', image: workoutImg },
    { key: 'journaling', label: 'Journaling', accent: '#f97316', image: journalingImg },
  ]

  return (
    <div className="selection-page">
      <header className="selection-header" aria-label="Header">
        <div className="selection-brand">
          <span className="selection-brand-text">Habit Tracker</span>
        </div>
        <div style={{ gridColumn: 3, justifySelf: 'end', display: 'grid', gridAutoFlow: 'column', gap: 8 }}>
          <button
            id="theme-toggle"
            className="icon-btn selection-theme-toggle"
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
          <button className="btn" type="button" onClick={onLogout}>Logout</button>
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
              onClick={() => onSelect(c.key)}
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
      </main>
    </div>
  )
}


