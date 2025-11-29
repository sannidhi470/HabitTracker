import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'
import { getUserId, getUserEmail, saveUserId } from '../services/session.js'
import { clearSession } from '../services/session.js'
import { getUserIdByEmail, getPlansByUserId, getHabitIdByName, addProgress, getLatestProgress, deletePlan, deleteProgressRecords } from '../services/api.js'
import { computeAccent } from '../services/images.js'

export default function Dashboard() {
  const [theme, setTheme] = useState(null)
  const [visibleHabits, setVisibleHabits] = useState([])
  const [currentUserId, setCurrentUserId] = useState(0)
  const [plansByKey, setPlansByKey] = useState({})
  const [habitIdsByKey, setHabitIdsByKey] = useState({})
  const [latestByKey, setLatestByKey] = useState({})
  const [logValuesByKey, setLogValuesByKey] = useState({})
  const [logDatesByKey, setLogDatesByKey] = useState({})
  const [logBusyKey, setLogBusyKey] = useState('')
  const [deleteBusyKey, setDeleteBusyKey] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const initial = initThemeFromStorage()
    setTheme(initial)
    const determineHabits = async () => {
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
        if (!Number.isFinite(userId) || userId <= 0) {
          setVisibleHabits([])
          setPlansByKey({})
          setHabitIdsByKey({})
          setLatestByKey({})
          return
        }
        const plans = await getPlansByUserId(userId)
        if (!Array.isArray(plans) || plans.length === 0) {
          setVisibleHabits([])
          setPlansByKey({})
          setHabitIdsByKey({})
          setLatestByKey({})
          return
        }
        const builtins = new Set(['reading','meditation','workout','journaling'])
        const slugify = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
        const toTitle = (s) => String(s || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase())
        const visible = []
        const idByKey = {}
        const planMap = {}
        for (const p of plans) {
          const habitObj = p?.habit || {}
          const rawKey = String(habitObj?.key || '').trim().toLowerCase()
          if (!rawKey) continue
          const resolvedKey = builtins.has(rawKey) ? rawKey : `custom:${slugify(rawKey)}`
          const label = toTitle(habitObj?.key || rawKey)
          const hidCandidates = [habitObj?.habit_id, habitObj?.habitId, habitObj?.id, p?.habitId]
          let hid = NaN
          for (const c of hidCandidates) {
            const n = Number(c)
            if (Number.isFinite(n) && n > 0) { hid = n; break }
          }
          if (!Number.isFinite(hid) || hid <= 0) continue
          if (!idByKey[resolvedKey]) idByKey[resolvedKey] = hid
          const toPath = builtins.has(rawKey) ? `/${rawKey}` : `/habit/${encodeURIComponent(slugify(label))}`
          visible.push({
            key: resolvedKey,
            label,
            accent: computeAccent(label),
            setupTo: toPath,
          })
          const normalizedPlan = {
            planType: String(p?.planType || p?.plan_type || '').toUpperCase(),
            startDate: p?.start_date || p?.startDate || '',
            endDate: p?.end_date || p?.endDate || '',
            planLength: Number(p?.plan_length || p?.planLength || 0),
            perDay: Number(p?.per_day || p?.perDay || 0),
            habitUnit: String(p?.habit_unit || habitObj?.unit || p?.unit || '').toLowerCase(),
            unit: String(p?.habit_unit || habitObj?.unit || p?.unit || '').toLowerCase(),
          }
          planMap[resolvedKey] = normalizedPlan
        }
        if (visible.length === 0) {
          setVisibleHabits([])
          setPlansByKey({})
          setHabitIdsByKey({})
          setLatestByKey({})
          return
        }
        setVisibleHabits(visible)
        setHabitIdsByKey(idByKey)
        setPlansByKey(planMap)
        const defaults = {}
        for (const k of Object.keys(planMap)) {
          const per = Number((planMap[k] && planMap[k].perDay) || 0)
          if (per > 0) defaults[k] = per
        }
        if (Object.keys(defaults).length) {
          setLogValuesByKey((prev) => ({ ...defaults, ...prev }))
        }
        try {
          const keys = visible.map((v) => v.key)
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
      } catch (err) {
        console.error('[Dashboard] determineHabits failed', err)
        setVisibleHabits([])
        setPlansByKey({})
        setHabitIdsByKey({})
        setLatestByKey({})
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

  const ymdFromLatest = (latest) => {
    if (!latest) return ''
    if (latest.date) {
      return String(latest.date).slice(0, 10)
    }
    if (latest.timestamp) {
      const d = new Date(latest.timestamp)
      if (!Number.isNaN(d.getTime())) {
        return [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0'),
        ].join('-')
      }
    }
    return ''
  }

  const setAmountForKey = (key, value) => {
    setLogValuesByKey((prev) => ({ ...prev, [key]: value }))
  }
  const setDateForKey = (key, ymd) => {
    const val = String(ymd || '').trim()
    setLogDatesByKey((prev) => ({ ...prev, [key]: val }))
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
      const selectedYmd = String(logDatesByKey[key] || todayIso())
      const isToday = selectedYmd === todayIso()
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
    if (isToday && latest) {
      const ymd = ymdFromLatest(latest)
      if (ymd === todayIso()) prevToday = Number(latest.logValue) || 0
      }
      setLogBusyKey(key)
      try {
        await addProgress({
          userId: uid,
          habitId: hid,
          logValue: Number(amount),
          // Use midday to avoid UTC offset rolling date
          timestamp: new Date(`${selectedYmd}T12:00:00`),
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
              timestamp: new Date(`${selectedYmd}T12:00:00`),
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
      if (isToday) {
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
      } else {
        showToast({
          title: `${label}: logged`,
          body: `Added ${amount} ${unit} for ${selectedYmd}.`,
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

  const omitKey = (obj, key) => {
    const { [key]: __ignored, ...rest } = obj || {}
    return rest
  }

  const onDeleteHabit = async (key, label) => {
    try {
      if (!window.confirm(`Delete "${label}" and its plan/progress? This cannot be undone.`)) return
      const uid = currentUserId
      let hid = habitIdsByKey[key]
      if (!Number.isFinite(uid) || uid <= 0) {
        showToast({ title: 'Unable to delete', body: 'Missing user id.', type: 'error', timeout: 2600 })
        return
      }
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
        showToast({ title: 'Unable to delete', body: 'Missing habit id.', type: 'error', timeout: 2600 })
        return
      }
      setDeleteBusyKey(key)
      // Call all deletions; treat any 404 as ok inside API helpers
      await deleteProgressRecords({ userId: uid, habitId: hid })
      await deletePlan({ userId: uid, habitId: hid })
      // Remove from UI
      setVisibleHabits((prev) => prev.filter((v) => v.key !== key))
      setPlansByKey((prev) => omitKey(prev, key))
      setLatestByKey((prev) => omitKey(prev, key))
      setLogValuesByKey((prev) => omitKey(prev, key))
      setHabitIdsByKey((prev) => omitKey(prev, key))
      showToast({ title: `${label}: deleted`, body: 'Plan and progress removed.', type: 'success', timeout: 2400 })
    } catch (err) {
      console.error('[Dashboard] onDeleteHabit failed', err)
      showToast({ title: 'Failed to delete', body: 'Please try again.', type: 'error', timeout: 2800 })
    } finally {
      setDeleteBusyKey('')
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
    if (latest) {
      const ymd = ymdFromLatest(latest)
      if (ymd === todayIso()) todayTotal = Number(latest.logValue) || 0
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
    if (!latest) return 0
    const sameDay = ymdFromLatest(latest) === todayIso()
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
                    style={{ maxWidth: 150 }}
                    type="date"
                    max={todayIso()}
                    value={String(logDatesByKey[h.key] || todayIso())}
                    onChange={(e) => setDateForKey(h.key, e.target.value)}
                    aria-label={`Date to log for ${h.label}`}
                  />
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
                    {logBusyKey === h.key ? 'Logging…' : 'Log'}
                  </button>
                  <button className="btn" type="button" onClick={() => navigate(h.setupTo)}>
                    {plansByKey[h.key] ? 'Edit plan' : 'Set up'}
                  </button>
                  <button className="btn" type="button" disabled={deleteBusyKey === h.key} onClick={() => onDeleteHabit(h.key, h.label)}>
                    {deleteBusyKey === h.key ? 'Deleting…' : 'Delete'}
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


