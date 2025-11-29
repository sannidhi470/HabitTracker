import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'
import { getUserEmail, getUserId, saveUserId } from '../services/session.js'
import { clearSession } from '../services/session.js'
import { getUserIdByEmail, getPlansByUserId, getHabitIdByName, getProgressRecords } from '../services/api.js'
import ProgressChart from '../components/ProgressChart.jsx'
import { computeAccent } from '../services/images.js'

export default function Progress() {
  const [theme, setTheme] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(0)
  const [visibleHabits, setVisibleHabits] = useState([])
  const [habitIdsByKey, setHabitIdsByKey] = useState({})
  const [plansByKey, setPlansByKey] = useState({})
  const [rawByKey, setRawByKey] = useState({})
  const [busy, setBusy] = useState(false)
  const [period, setPeriod] = useState('week') // week | last7 | last30 | custom
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

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

  useEffect(() => {
    const run = async () => {
      try {
        setBusy(true)
        // Determine user
        let userId = getUserId()
        if (!userId || !Number.isFinite(userId)) {
          const email = getUserEmail()
          if (email) {
            userId = await getUserIdByEmail(email)
            if (Number.isFinite(userId) && userId > 0) saveUserId(userId)
          }
        }
        if (!Number.isFinite(userId) || userId <= 0) {
          navigate('/selection', { replace: true })
          return
        }
        setCurrentUserId(userId)

        // Plans for user; only show these habits
        const plans = await getPlansByUserId(userId)
        if (!Array.isArray(plans) || plans.length === 0) {
          setVisibleHabits([])
          setHabitIdsByKey({})
          setPlansByKey({})
          setRawByKey({})
          return
        }
        const builtins = new Set(['reading', 'meditation', 'workout', 'journaling'])
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
          visible.push({ key: resolvedKey, label, accent: computeAccent(label) })
          planMap[resolvedKey] = {
            planType: String(p?.planType || p?.plan_type || '').toUpperCase(),
            startDate: p?.start_date || p?.startDate || '',
            endDate: p?.end_date || p?.endDate || '',
            planLength: Number(p?.plan_length || p?.planLength || 0),
            perDay: Number(p?.per_day || p?.perDay || 0),
            habitUnit: String(p?.habit_unit || habitObj?.unit || p?.unit || '').toLowerCase(),
            unit: String(p?.habit_unit || habitObj?.unit || p?.unit || '').toLowerCase(),
          }
        }
        setVisibleHabits(visible)
        setHabitIdsByKey(idByKey)
        setPlansByKey(planMap)

        // Progress raw
        const keys = visible.map((v) => v.key)
        const pairsRaw = await Promise.all(keys.map(async (k) => {
          const hid = idByKey[k]
          if (!Number.isFinite(hid) || hid <= 0) return [k, []]
          try {
            const recs = await getProgressRecords({ userId, habitId: hid })
            return [k, Array.isArray(recs) ? recs : []]
          } catch (err) {
            console.error('[Progress] getProgressRecords failed', { key: k, err })
            return [k, []]
          }
        }))
        const rawMap = {}
        for (const [k, v] of pairsRaw) rawMap[k] = v
        setRawByKey(rawMap)
      } catch (err) {
        console.error('[Progress] init failed', err)
        showToast({ title: 'Failed to load progress', body: 'Try again later.', type: 'error', timeout: 2600 })
      } finally {
        setBusy(false)
      }
    }
    run()
  }, [])

  const startOfWeekMonday = (d) => {
    const copy = new Date(d)
    copy.setHours(0, 0, 0, 0)
    const day = copy.getDay()
    const diffFromMonday = (day + 6) % 7
    copy.setDate(copy.getDate() - diffFromMonday)
    return copy
  }
  const toYmd = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  const parseYmd = (s) => {
    const [y, m, d] = String(s || '').split('-').map((v) => Number(v))
    const dt = new Date(y, m - 1, d)
    if (!y || !m || !d || Number.isNaN(dt.getTime())) return null
    dt.setHours(0, 0, 0, 0)
    return dt
  }

  const [rangeStart, rangeEnd] = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (period === 'week') {
      const start = startOfWeekMonday(today)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return [start, end]
    }
    if (period === 'last7') {
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      return [start, today]
    }
    if (period === 'last30') {
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      return [start, today]
    }
    // custom
    const f = parseYmd(from)
    const t = parseYmd(to)
    if (f && t && f.getTime() <= t.getTime()) return [f, t]
    // fallback to last7 if custom invalid
    const fallbackStart = new Date(today)
    fallbackStart.setDate(today.getDate() - 6)
    return [fallbackStart, today]
  }, [period, from, to])

  const aggregateRange = (records, start, end) => {
    try {
      // Track the latest log per local day (not the sum)
      const byDayLatest = new Map() // ymd -> { id: number, value: number }
      for (const r of Array.isArray(records) ? records : []) {
        const ymdRaw = String(r?.date || '').trim()
        const v = Number(r?.logValue) || 0
        const recId = Number(r?.id) || 0
        if (!ymdRaw || !Number.isFinite(v) || v < 0) continue
        const d = parseYmd(ymdRaw)
        if (!d) continue
        if (d < start || d > end) continue
        const ymd = toYmd(d)
        const prev = byDayLatest.get(ymd)
        if (!prev || recId > (prev.id || 0)) {
          byDayLatest.set(ymd, { id: recId, value: v })
        }
      }
      const out = []
      const cursor = new Date(start)
      while (cursor.getTime() <= end.getTime()) {
        const ymd = toYmd(cursor)
        const dd = String(cursor.getDate()).padStart(2, '0')
        const mm = String(cursor.getMonth() + 1).padStart(2, '0')
        const latest = byDayLatest.get(ymd)
        out.push({ date: ymd, dateLabel: `${dd}/${mm}`, value: Number(latest?.value || 0) })
        cursor.setDate(cursor.getDate() + 1)
      }
      return out
    } catch (err) {
      console.error('[Progress] aggregateRange failed', err)
      return []
    }
  }

  const seriesByKey = useMemo(() => {
    const out = {}
    for (const k of Object.keys(rawByKey)) {
      out[k] = aggregateRange(rawByKey[k], rangeStart, rangeEnd)
    }
    return out
  }, [rawByKey, rangeStart, rangeEnd])

  const unitForKey = (key) => {
    return String(plansByKey[key]?.habitUnit || plansByKey[key]?.unit || 'units')
  }

  const computeStreakForRecords = (records, perDay) => {
    try {
      const target = Number(perDay) || 0
      if (target <= 0) return 0
      // Use latest entry per local day (not sum), to match "latest" semantics
      const latestByYmd = new Map() // ymd -> { id: number, value: number }
      for (const r of Array.isArray(records) ? records : []) {
        const ymdRaw = String(r?.date || '').trim()
        const v = Number(r?.logValue) || 0
        const recId = Number(r?.id) || 0
        if (!ymdRaw || !Number.isFinite(v) || v < 0) continue
        const d = parseYmd(ymdRaw)
        if (!d) continue
        const ymd = toYmd(d)
        const prev = latestByYmd.get(ymd)
        if (!prev || recId > (prev.id || 0)) {
          latestByYmd.set(ymd, { id: recId, value: v })
        }
      }
      // Count back from today while meeting/exceeding target
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let streak = 0
      const cursor = new Date(today)
      // Safety cap to avoid infinite loops
      for (let i = 0; i < 366; i++) {
        const ymd = toYmd(cursor)
        const val = Number(latestByYmd.get(ymd)?.value || 0)
        if (val >= target) {
          streak += 1
          cursor.setDate(cursor.getDate() - 1)
          continue
        }
        break
      }
      return streak
    } catch (err) {
      console.error('[Progress] computeStreakForRecords failed', err)
      return 0
    }
  }

  const streakByKey = useMemo(() => {
    const out = {}
    for (const k of Object.keys(rawByKey)) {
      const per = Number(plansByKey[k]?.perDay) || 0
      out[k] = computeStreakForRecords(rawByKey[k], per)
    }
    return out
  }, [rawByKey, plansByKey])

  const rangeLabel = useMemo(() => {
    const toShort = (d) => {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      return `${dd}/${mm}`
    }
    return `${toShort(rangeStart)} → ${toShort(rangeEnd)}`
  }, [rangeStart, rangeEnd])

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
        <section className="dashboard-hero" aria-labelledby="progress-hero-title">
          <h1 id="progress-hero-title" className="hero-title">Progress viewer</h1>
          <p className="hero-subtitle">See all your habits over a chosen period</p>
          <div className="hero-actions">
            <button className="btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          </div>
        </section>

        <section className="overview" aria-labelledby="charts-title">
          <h2 id="charts-title" className="section-title">All habits · {rangeLabel}</h2>
          <div style={{ display: 'grid', gap: 12, justifyItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'grid', gridAutoFlow: 'column', gap: 8 }}>
              <button className={`btn ${period === 'week' ? 'primary' : ''}`} type="button" onClick={() => setPeriod('week')}>Weekly</button>
              <button className={`btn ${period === 'last7' ? 'primary' : ''}`} type="button" onClick={() => setPeriod('last7')}>Last 7 days</button>
              <button className={`btn ${period === 'last30' ? 'primary' : ''}`} type="button" onClick={() => setPeriod('last30')}>Last 30 days</button>
              <button className={`btn ${period === 'custom' ? 'primary' : ''}`} type="button" onClick={() => setPeriod('custom')}>Custom</button>
            </div>
            {period === 'custom' && (
              <div style={{ display: 'grid', gridAutoFlow: 'column', gap: 8, alignItems: 'center' }}>
                <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
                <span style={{ alignSelf: 'center', opacity: 0.7 }}>to</span>
                <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
              </div>
            )}
          </div>
          <div className="overview-grid">
            {visibleHabits.map((h) => (
              <article key={h.key} className="stat-card" style={{ '--accent': h.accent }}>
                <header className="stat-head">
                  <h3 className="stat-title">{h.label}</h3>
                  <span className="stat-meta">
                    {plansByKey[h.key]
                      ? `Target: ${plansByKey[h.key].perDay} ${unitForKey(h.key)}/day`
                      : 'No plan set'}
                    {Number(streakByKey[h.key]) > 0 ? ` · 🔥 ${streakByKey[h.key]}-day streak` : ''}
                  </span>
                </header>
                <div className="stat-body">
                  <ProgressChart
                    data={seriesByKey[h.key] || []}
                    perDay={Number(plansByKey[h.key]?.perDay) || 0}
                    unit={unitForKey(h.key)}
                    accent={h.accent}
                    type={(period === 'week' || period === 'last7') ? 'bar' : 'line'}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}


