import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'

export default function Dashboard() {
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

  const habits = [
    { key: 'reading', label: 'Reading', accent: '#f97316', setupTo: '/reading' },
    { key: 'meditation', label: 'Meditation', accent: '#f97316', setupTo: '/meditation' },
    { key: 'workout', label: 'Workout', accent: '#f97316', setupTo: '/workout' },
    { key: 'journaling', label: 'Journaling', accent: '#f97316', setupTo: '/journaling' },
  ]

  const onQuickLog = (label) => {
    showToast({
      title: 'Quick log (demo)',
      body: `Logged today for ${label}. Replace with real tracking.`,
      type: 'success',
      timeout: 2200,
    })
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header" aria-label="Header">
        <div className="dashboard-brand">
          <span className="dashboard-brand-text">Habit Tracker</span>
        </div>
        <button
          id="theme-toggle"
          className="icon-btn dashboard-theme-toggle"
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
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="dashboard-hero-title">
          <h1 id="dashboard-hero-title" className="hero-title">Welcome back</h1>
          <p className="hero-subtitle">Your habits at a glance</p>
          <div className="hero-actions">
            <button className="btn primary" type="button" onClick={() => navigate('/selection')}>
              Add a habit
            </button>
            <button className="btn" type="button" onClick={() => navigate('/selection')}>
              Manage habits
            </button>
          </div>
        </section>

        <section className="overview" aria-labelledby="overview-title">
          <h2 id="overview-title" className="section-title">Active habits</h2>
          <div className="overview-grid">
            {habits.map((h) => (
              <article key={h.key} className="stat-card" style={{ '--accent': h.accent }}>
                <header className="stat-head">
                  <h3 className="stat-title">{h.label}</h3>
                </header>
                <div className="stat-body">
                  <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                    <div className="progress-bar" style={{ width: '0%' }} />
                  </div>
                  <p className="stat-meta">No data yet — set up a plan to begin</p>
                </div>
                <footer className="stat-actions">
                  <button className="btn" type="button" onClick={() => navigate(h.setupTo)}>
                    Set up
                  </button>
                  <button className="btn ghost" type="button" onClick={() => onQuickLog(h.label)}>
                    Quick log
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      </main>
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}


