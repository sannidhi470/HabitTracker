import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'
import { getUserId, getUserEmail, saveUserId } from '../services/session.js'
import { clearSession } from '../services/session.js'
import { getUserIdByEmail, getUserHabits, getPlan, getHabitIdByName, addProgress, getLatestProgress } from '../services/api.js'

export default function Dashboard() {
  const [theme, setTheme] = useState(null)
  const [visibleHabits, setVisibleHabits] = useState([])
  const [currentUserId, setCurrentUserId] = useState(0)
  const [plansByKey, setPlansByKey] = useState({})
  const [habitIdsByKey, setHabitIdsByKey] = useState({})
  const [latestByKey, setLatestByKey] = useState({})
  const [logValuesByKey, setLogValuesByKey] = useState({})
  const [logBusyKey, setLogBusyKey] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const initial = initThemeFromStorage()
    setTheme(initial)
    const determineHabits = async () => {
      // Static definitions with routing info
      const all = [
        { key: 'reading', label: 'Reading', accent: '#f97316', setupTo: '/reading' },
        { key: 'meditation', label: 'Meditation', accent: '#f97316', setupTo: '/meditation' },
        { key: 'workout', label: 'Workout', accent: '#f97316', setupTo: '/workout' },
        { key: 'journaling', label: 'Journaling', accent: '#f97316', setupTo: '/journaling' },
      ]
      // Always derive from backend
      try {
        let userId = getUserId()
        if (!userId || !Number.isFinite(userId)) {
          const email = getUserEmail()
          if (email) {
            userId = await getUserIdByEmail(email)
            if (Number.isFinite(userId) && userId > 0) saveUserId(userId)
          }
        }
        if (Number.isFinite(userId) && userId > 0) setCurrentUserId(userId)
        if (Number.isFinite(userId) && userId > 0) {
          const habits = await getUserHabits(userId)
          if (Array.isArray(habits) && habits.length > 0) {
            const allowed = ['reading','meditation','workout','journaling']
            const idToKey = { 11: 'reading', 12: 'meditation', 13: 'workout', 14: 'journaling' }
            const toKey = (item) => {
              if (typeof item === 'number') return idToKey[item] || ''
              const byId = Number(item?.habitId ?? item?.id ?? item?.habitID ?? item?.HabitId ?? item?.HabitID)
              if (Number.isFinite(byId) && idToKey[byId]) return idToKey[byId]
              const raw = typeof item === 'string'
                ? item
                : (item?.key ?? item?.name ?? item?.habitName ?? item?.HabitName ?? item?.title ?? '')
              const k = String(raw || '').toLowerCase().replace(/\s+/g, '')
              if (allowed.includes(k)) return k
              if (k.includes('read')) return 'reading'
              if (k.includes('medit')) return 'meditation'
              if (k.includes('work')) return 'workout'
              if (k.includes('journal')) return 'journaling'
              return ''
            }
            const toId = (item) => {
              if (typeof item === 'number') return Number(item)
              if (!item || typeof item !== 'object') return NaN
              // Prefer explicit habitId-like fields; DO NOT use bare 'id' which may be a userHabit id
              const directCandidates = [
                item?.habitId, item?.habit_id, item?.HabitId, item?.HabitID,
              ]
              for (const c of directCandidates) {
                const n = Number(c)
                if (Number.isFinite(n) && n > 0) return n
              }
              // Sometimes the habit object is nested
              const nested = item?.habit || item?.Habit || null
              if (nested && typeof nested === 'object') {
                const nestedCandidates = [nested?.habitId, nested?.habit_id, nested?.id, nested?.HabitId, nested?.HabitID]
                for (const c of nestedCandidates) {
                  const n = Number(c)
                  if (Number.isFinite(n) && n > 0) return n
                }
              }
              return NaN
            }
            const keys = Array.from(new Set(habits.map(toKey).filter((k) => allowed.includes(k))))
            if (keys.length > 0) {
              setVisibleHabits(all.filter((h) => keys.includes(h.key)))
              // Build habitId mapping per key (derive from payload; fallback by name if needed)
              const idByKey = {}
              for (const item of habits) {
                const k = toKey(item)
                if (!allowed.includes(k)) continue
                const id = toId(item)
                if (Number.isFinite(id) && id > 0 && !idByKey[k]) idByKey[k] = id
              }
              const keyToName = { reading: 'Reading', meditation: 'Meditation', workout: 'Workout', journaling: 'Journaling' }
              const missing = keys.filter((k) => !Number.isFinite(idByKey[k]))
              if (missing.length > 0) {
                await Promise.all(missing.map(async (k) => {
                  try {
                    const id = await getHabitIdByName(keyToName[k])
                    if (Number.isFinite(id) && id > 0) idByKey[k] = id
                  } catch (_) {}
                }))
              }
              setHabitIdsByKey(idByKey)
              // Fetch plans for each habit key (ignore errors, keep null if none)
              const pairs = await Promise.all(keys.map(async (k) => {
                const id = idByKey[k]
                if (!Number.isFinite(id) || id <= 0) return [k, null]
                try {
                  const plan = await getPlan({ userId, habitId: id })
                  return [k, plan]
                } catch (err) {
                  console.error('[Dashboard] getPlan failed', { key: k, err })
                  return [k, null]
                }
              }))
              const planMap = {}
              for (const [k, p] of pairs) {
                if (p) planMap[k] = p
              }
              setPlansByKey(planMap)
              // Initialize default log values from plan perDay
              const defaults = {}
              for (const k of keys) {
                const per = Number((planMap[k] && planMap[k].perDay) || 0)
                if (per > 0) defaults[k] = per
              }
              if (Object.keys(defaults).length) {
                setLogValuesByKey((prev) => ({ ...defaults, ...prev }))
              }
              // Fetch latest progress per habit to power progress bars and today's status
              try {
                const pairsLatest = await Promise.all(keys.map(async (k) => {
                  const id = idByKey[k]
                  if (!Number.isFinite(id) || id <= 0) return [k, null]
                  try {
                    const latest = await getLatestProgress({ userId, habitId: id })
                    return [k, latest]
                  } catch (err) {
                    console.error('[Dashboard] getLatestProgress failed', { key: k, err })
                    return [k, null]
                  }
                }))
                const latestMap = {}
                for (const [k, v] of pairsLatest) {
                  if (v) latestMap[k] = v
                }
                setLatestByKey(latestMap)
              } catch (err) {
                console.error('[Dashboard] latest fetch loop failed', err)
              }
              return
            }
          }
        }
        // No habit -> redirect to selection
        navigate('/selection', { replace: true })
      } catch (err) {
        console.error('[Dashboard] determineHabits failed', err)
        navigate('/selection', { replace: true })
      }
    }
    determineHabits()
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

  const todayIso = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  const setAmountForKey = (key, value) => {
    setLogValuesByKey((prev) => ({ ...prev, [key]: value }))
  }

  const refreshLatest = async () => {
    try {
      const uid = currentUserId
      if (!Number.isFinite(uid) || uid <= 0) return
      const keys = Object.keys(habitIdsByKey)
      if (keys.length === 0) return
      const results = await Promise.all(keys.map(async (k) => {
        const id = habitIdsByKey[k]
        if (!Number.isFinite(id) || id <= 0) return [k, null]
        try {
          const v = await getLatestProgress({ userId: uid, habitId: id })
          return [k, v]
        } catch (err) {
          console.error('[Dashboard] refreshLatest getLatestProgress failed', { key: k, err })
          return [k, null]
        }
      }))
      const map = {}
      for (const [k, v] of results) {
        if (v) map[k] = v
      }
      setLatestByKey(map)
    } catch (err) {
      console.error('[Dashboard] refreshLatest failed', err)
    }
  }

  const onLog = async (key, label) => {
    try {
      const uid = currentUserId
      let hid = habitIdsByKey[key]
      if (!Number.isFinite(uid) || uid <= 0) {
        showToast({ title: 'Unable to log', body: 'Missing user id.', type: 'error', timeout: 2400 })
        return
      }
      // Resolve habit id if missing
      if (!Number.isFinite(hid) || hid <= 0) {
        try {
          const resolved = await getHabitIdByName(label)
          if (Number.isFinite(resolved) && resolved > 0) {
            hid = resolved
            setHabitIdsByKey((prev) => ({ ...prev, [key]: resolved }))
          }
        } catch (_) {}
      }
      if (!Number.isFinite(hid) || hid <= 0) {
        showToast({ title: 'Unable to log', body: 'Missing habit id.', type: 'error', timeout: 2400 })
        return
      }
      let amount = Number(logValuesByKey[key])
      if (!Number.isFinite(amount) || amount <= 0) {
        const fallback = Number((plansByKey[key] && plansByKey[key].perDay) || 0)
        amount = fallback > 0 ? fallback : 1
      }
      // Determine current today's total (from latest if same day)
      const latest = latestByKey[key]
      let prevToday = 0
      if (latest && latest.timestamp) {
        const d = new Date(latest.timestamp)
        const isSame = todayIso() === [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0'),
        ].join('-')
        if (isSame) prevToday = Number(latest.logValue) || 0
      }
      setLogBusyKey(key)
      try {
        await addProgress({
          userId: uid,
          habitId: hid,
          logValue: Number(amount),
        })
      } catch (err1) {
        // Fallback: re-resolve habit id by name and retry once
        try {
          const resolved = await getHabitIdByName(label)
          if (Number.isFinite(resolved) && resolved > 0 && resolved !== hid) {
            setHabitIdsByKey((prev) => ({ ...prev, [key]: resolved }))
            hid = resolved
            await addProgress({
              userId: uid,
              habitId: hid,
              logValue: Number(amount),
            })
          } else {
            throw err1
          }
        } catch (err2) {
          throw err2
        }
      }
      await refreshLatest()
      const perDay = Number(plansByKey[key]?.perDay) || 0
      const unit = String(plansByKey[key]?.habitUnit || plansByKey[key]?.unit || 'units')
      const predictedToday = prevToday + amount
      if (perDay > 0 && predictedToday >= perDay) {
        const msg = predictedToday > perDay
          ? 'Congratulations, you have exceeded your daily target!'
          : 'Congratulations, you have met your daily target!'
        celebrateWithConfetti(msg)
      } else {
        showToast({
          title: `${label}: logged`,
          body: `Added ${amount} ${unit} today.`,
          type: 'success',
          timeout: 2200,
        })
      }
    } catch (err) {
      console.error('[Dashboard] onLog failed', err)
      showToast({ title: 'Failed to log', body: 'Please try again.', type: 'error', timeout: 2600 })
    } finally {
      setLogBusyKey('')
    }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = d.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  const planMetaText = (plan) => {
    if (!plan) return 'No data yet — set up a plan to begin'
    const unit = String(plan.habitUnit || plan.unit || '').toLowerCase() || 'units'
    const perDay = Number(plan.perDay) || 0
    const type = String(plan.planType || '').toUpperCase()
    const start = formatDate(plan.startDate)
    const end = formatDate(plan.endDate)
    if (type === 'FIXED') {
      const len = Number(plan.planLength) || 0
      return `${perDay} ${unit}/day · ${len} days · ${start} → ${end}`
    }
    if (type === 'DEADLINE') {
      const total = Number(plan.planLength) || 0
      return `${perDay} ${unit}/day · goal ${total} ${unit} · until ${end}`
    }
    return `Active plan: ${perDay} ${unit}/day · ${start} → ${end}`
  }
  const todayMetaText = (key) => {
    const unit = String(plansByKey[key]?.habitUnit || plansByKey[key]?.unit || '').toLowerCase() || 'units'
    const perDay = Number(plansByKey[key]?.perDay) || 0
    const latest = latestByKey[key]
    let todayTotal = 0
    if (latest && latest.timestamp) {
      const d = new Date(latest.timestamp)
      const sameDay = todayIso() === [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')
      if (sameDay) todayTotal = Number(latest.logValue) || 0
    }
    if (perDay > 0) {
      const pct = Math.min(100, Math.round(((todayTotal || 0) / perDay) * 100))
      return `Today: ${todayTotal}/${perDay} ${unit} (${pct}%)`
    }
    // No plan perDay; show today's raw total or fallback
    if (todayTotal > 0) return `Today: ${todayTotal} ${unit}`
    return 'No data yet — set up a plan to begin'
  }
  const progressPercent = (key) => {
    const perDay = Number(plansByKey[key]?.perDay) || 0
    if (perDay <= 0) return 0
    const latest = latestByKey[key]
    if (!latest || !latest.timestamp) return 0
    const d = new Date(latest.timestamp)
    const sameDay = todayIso() === [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
    if (!sameDay) return 0
    const value = Number(latest.logValue) || 0
    return Math.max(0, Math.min(100, Math.round((value / perDay) * 100)))
  }

  const injectConfettiStylesOnce = () => {
    const id = 'ht-confetti-style'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes ht-confetti-fall {
        0% { transform: translate3d(var(--x,0), -10vh, 0) rotate(0deg); opacity: 1; }
        100% { transform: translate3d(var(--x,0), 110vh, 0) rotate(720deg); opacity: 0.9; }
      }
    `
    document.head.appendChild(style)
  }

  const celebrateWithConfetti = (message) => {
    try {
      injectConfettiStylesOnce()
      showToast({ title: '🎉 Great job!', body: message, type: 'success', timeout: 2800 })
      const container = document.createElement('div')
      container.setAttribute('aria-hidden', 'true')
      container.style.position = 'fixed'
      container.style.left = '0'
      container.style.top = '0'
      container.style.width = '100%'
      container.style.height = '0'
      container.style.overflow = 'visible'
      container.style.zIndex = '9999'
      container.style.pointerEvents = 'none'
      const colors = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#f43f5e']
      const count = 120
      for (let i = 0; i < count; i++) {
        const piece = document.createElement('div')
        const size = 6 + Math.random() * 6
        piece.style.position = 'absolute'
        piece.style.top = '-10vh'
        piece.style.left = Math.round(Math.random() * 100) + 'vw'
        piece.style.width = Math.round(size) + 'px'
        piece.style.height = Math.round(size * 0.6) + 'px'
        piece.style.backgroundColor = colors[i % colors.length]
        piece.style.opacity = (0.85 + Math.random() * 0.15).toString()
        piece.style.transform = 'translateZ(0)'
        piece.style.willChange = 'transform'
        const duration = 1.6 + Math.random() * 1.6
        const delay = Math.random() * 0.2
        piece.style.animation = `ht-confetti-fall ${duration}s cubic-bezier(.2,.8,.2,1) ${delay}s forwards`
        piece.style.setProperty('--x', (Math.random() * 40 - 20) + 'vw')
        container.appendChild(piece)
      }
      document.body.appendChild(container)
      window.setTimeout(() => {
        try {
          document.body.removeChild(container)
        } catch (_) {}
      }, 2600)
    } catch (err) {
      console.error('Confetti render failed', err)
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header" aria-label="Header">
        <div className="dashboard-brand">
          <span className="dashboard-brand-text">Habit Tracker</span>
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: 8, justifySelf: 'end' }}>
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
          <button className="btn" type="button" onClick={onLogout}>Logout</button>
        </div>
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
            <button className="btn" type="button" onClick={() => navigate('/progress')}>
              View progress
            </button>
          </div>
        </section>

        <section className="overview" aria-labelledby="overview-title">
          <h2 id="overview-title" className="section-title">Active habits</h2>
          <div className="overview-grid">
            {visibleHabits.map((h) => (
              <article key={h.key} className="stat-card" style={{ '--accent': h.accent }}>
                <header className="stat-head">
                  <h3 className="stat-title">{h.label}</h3>
                </header>
                <div className="stat-body">
                  <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent(h.key)}>
                    <div className="progress-bar" style={{ width: `${progressPercent(h.key)}%` }} />
                  </div>
                  <p className="stat-meta">{todayMetaText(h.key) || planMetaText(plansByKey[h.key])}</p>
                </div>
                <footer className="stat-actions">
                  <input
                    className="input"
                    style={{ maxWidth: 110 }}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder={String(plansByKey[h.key]?.perDay || 0)}
                    value={Number.isFinite(logValuesByKey[h.key]) ? logValuesByKey[h.key] : (plansByKey[h.key]?.perDay || '')}
                    onChange={(e) => setAmountForKey(h.key, Number(e.target.value))}
                    aria-label={`Amount to log for ${h.label}`}
                  />
                  <button className="btn primary" type="button" disabled={logBusyKey === h.key} onClick={() => onLog(h.key, h.label)}>
                    {logBusyKey === h.key ? 'Logging…' : 'Log today'}
                  </button>
                  <button className="btn" type="button" onClick={() => navigate(h.setupTo)}>
                    {plansByKey[h.key] ? 'Edit plan' : 'Set up'}
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


