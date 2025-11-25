import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import { initThemeFromStorage, setTheme as applyTheme, showToast } from '../services/auth.js'
import { getUserEmail, getUserId, saveUserId } from '../services/session.js'
import { getUserIdByEmail, getUserHabits, getPlan, getHabitIdByName, getProgressRecords } from '../services/api.js'
import ProgressChart from '../components/ProgressChart.jsx'

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

        // Read user's habits
        const habits = await getUserHabits(userId)
        const allowed = ['reading', 'meditation', 'workout', 'journaling']
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
          const directCandidates = [item?.habitId, item?.habit_id, item?.HabitId, item?.HabitID]
          for (const c of directCandidates) {
            const n = Number(c)
            if (Number.isFinite(n) && n > 0) return n
          }
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
        const keys = Array.from(new Set((habits || []).map(toKey).filter((k) => allowed.includes(k))))
        if (!keys.length) {
          navigate('/selection', { replace: true })
          return
        }
        const all = [
          { key: 'reading', label: 'Reading', accent: '#f97316' },
          { key: 'meditation', label: 'Meditation', accent: '#f97316' },
          { key: 'workout', label: 'Workout', accent: '#f97316' },
          { key: 'journaling', label: 'Journaling', accent: '#f97316' },
        ]
        setVisibleHabits(all.filter((h) => keys.includes(h.key)))
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

        // Plans
        const pairsPlan = await Promise.all(keys.map(async (k) => {
          const id = idByKey[k]
          if (!Number.isFinite(id) || id <= 0) return [k, null]
          try {
            const plan = await getPlan({ userId, habitId: id })
            return [k, plan]
          } catch (err) {
            console.error('[Progress] getPlan failed', { key: k, err })
            return [k, null]
          }
        }))
        const planMap = {}
        for (const [k, p] of pairsPlan) {
          if (p) planMap[k] = p
        }
        setPlansByKey(planMap)

        // Progress raw
        const pairsRaw = await Promise.all(keys.map(async (k) => {
          const id = idByKey[k]
          if (!Number.isFinite(id) || id <= 0) return [k, []]
          try {
            const recs = await getProgressRecords({ userId, habitId: id })
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
      const byDay = new Map()
      for (const r of Array.isArray(records) ? records : []) {
        const ts = r?.timestamp
        const v = Number(r?.logValue) || 0
        if (!ts || !Number.isFinite(v) || v <= 0) continue
        const d = new Date(ts)
        if (Number.isNaN(d.getTime())) continue
        d.setHours(0, 0, 0, 0)
        if (d < start || d > end) continue
        const ymd = toYmd(d)
        byDay.set(ymd, (byDay.get(ymd) || 0) + v)
      }
      const out = []
      const cursor = new Date(start)
      while (cursor.getTime() <= end.getTime()) {
        const ymd = toYmd(cursor)
        const dd = String(cursor.getDate()).padStart(2, '0')
        const mm = String(cursor.getMonth() + 1).padStart(2, '0')
        out.push({ date: ymd, dateLabel: `${dd}/${mm}`, value: Number(byDay.get(ymd) || 0) })
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
                  <span className="stat-meta">{plansByKey[h.key] ? `Target: ${plansByKey[h.key].perDay} ${unitForKey(h.key)}/day` : 'No plan set'}</span>
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


