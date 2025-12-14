import '../styles/habit-setup.css'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { showToast, logoutRequest } from '../services/auth.js'
import { getHabitIdByName, getUserIdByEmail, addPlan, getPlan, getUserHabits, getHabitUnit } from '../services/api.js'
import { getUserEmail, saveHabitId, saveUserId, clearSession } from '../services/session.js'

function pad2(n) {
  return String(n).padStart(2, '0')
}
function toIso(y, m, d) {
  // m is 0-based
  const dt = new Date(Date.UTC(y, m, d))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}
function parseIso(iso) {
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  return new Date(Date.UTC(y, m - 1, d))
}
function formatDisplay(iso) {
  if (!iso) return ''
  const d = parseIso(iso)
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}
function daysInMonth(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()
}
function startWeekday(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0, 1)).getUTCDay() // 0..6
}

function BrownDatePicker({ id, label, value, onChange, min }) {
  const selected = value ? parseIso(value) : null
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(selected ? selected.getUTCFullYear() : today.getUTCFullYear())
  const [viewMonth, setViewMonth] = useState(selected ? selected.getUTCMonth() : today.getUTCMonth()) // 0..11

  const isDisabled = (y, m, d) => {
    if (!min) return false
    const minD = parseIso(min)
    const cur = new Date(Date.UTC(y, m, d))
    return cur.getTime() < minD.getTime()
  }

  const gotoMonth = (delta) => {
    let y = viewYear
    let m = viewMonth + delta
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setViewYear(y); setViewMonth(m)
  }
  const onSelect = (d) => {
    const iso = toIso(viewYear, viewMonth, d)
    if (isDisabled(viewYear, viewMonth, d)) return
    onChange(iso)
    setOpen(false)
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const start = startWeekday(viewYear, viewMonth) // 0=Sun..6
  const cells = []
  for (let i = 0; i < start; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const isToday = (d) => {
    return today.getUTCFullYear() === viewYear && today.getUTCMonth() === viewMonth && today.getUTCDate() === d
  }
  const isSelected = (d) => {
    return selected &&
      selected.getUTCFullYear() === viewYear &&
      selected.getUTCMonth() === viewMonth &&
      selected.getUTCDate() === d
  }

  return (
    <div className="date-field">
      {label ? <label className="label" htmlFor={id}>{label}</label> : null}
      <button
        id={id}
        type="button"
        className="input date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen((v) => !v)}
      >
        {formatDisplay(value)}
      </button>
      {open && (
        <div className="calendar" role="dialog" aria-modal="false">
          <div className="cal-header">
            <button className="cal-nav" type="button" onClick={() => gotoMonth(-1)} aria-label="Previous month">‹</button>
            <div className="cal-title">
              {new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </div>
            <button className="cal-nav" type="button" onClick={() => gotoMonth(1)} aria-label="Next month">›</button>
          </div>
          <div className="cal-grid cal-weekdays" aria-hidden="true">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((w) => <div key={w} className="cal-weekday">{w}</div>)}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />
              const disabled = isDisabled(viewYear, viewMonth, d)
              return (
                <button
                  key={d}
                  type="button"
                  className={
                    'cal-day' +
                    (isToday(d) ? ' is-today' : '') +
                    (isSelected(d) ? ' is-selected' : '') +
                    (disabled ? ' is-disabled' : '')
                  }
                  onClick={() => onSelect(d)}
                  disabled={disabled}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
function todayIsoLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
function addToIso(iso, value, unit) {
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  const v = Number(value) || 0
  const copy = new Date(d)
  if (unit === 'days') copy.setDate(copy.getDate() + v)
  else if (unit === 'weeks') copy.setDate(copy.getDate() + v * 7)
  else if (unit === 'months') {
    const day = copy.getDate()
    copy.setMonth(copy.getMonth() + v)
    if (copy.getDate() !== day) copy.setDate(0)
  }
  return copy.toISOString().slice(0, 10)
}
function diffInDays(fromIso, toIso) {
  const a = new Date(fromIso + 'T00:00:00')
  const b = new Date(toIso + 'T00:00:00')
  const ms = b.getTime() - a.getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}
function toZ(iso) {
  return `${iso}T00:00:00.000Z`
}
function humanizeSlug(slug) {
  const s = String(slug || '').replace(/[-_]+/g, ' ').trim()
  if (!s) return 'Custom Habit'
  return s.replace(/\b\w/g, (m) => m.toUpperCase())
}

export default function HabitSetup() {
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()
  const passed = (location && location.state) || {}
  const habitName = String(passed.name || humanizeSlug(params.slug || ''))
  const [unit, setUnit] = useState(String(passed.unit || '').trim())
  const [resolving, setResolving] = useState(true)
  const [habitId, setHabitId] = useState(0)
  const [userId, setUserId] = useState(0)

  // Form state
  const [planMode, setPlanMode] = useState('FIXED') // FIXED | DEADLINE
  const [startDate, setStartDate] = useState(todayIsoLocal())
  const [perDay, setPerDay] = useState(10)
  const [planLengthValue, setPlanLengthValue] = useState(30)
  const [planLengthUnit, setPlanLengthUnit] = useState('days')
  const [targetEndDate, setTargetEndDate] = useState(todayIsoLocal())
  const [totalAmount, setTotalAmount] = useState(300)

  const onLogout = () => {
    ;(async () => {
      try { await logoutRequest() } catch (_) {}
      clearSession()
      navigate('/auth', { replace: true })
    })()
  }

  useEffect(() => {
    const boot = async () => {
      try {
        // Resolve userId
        let uid = 0
        const email = getUserEmail()
        if (email) {
          const fetched = await getUserIdByEmail(email)
          if (Number.isFinite(fetched) && fetched > 0) {
            saveUserId(fetched)
            uid = fetched
            setUserId(fetched)
          }
        }
        // Resolve habitId locally to avoid state race
        let resolvedHabitId = 0
        try {
          const hid = await getHabitIdByName(habitName)
          if (Number.isFinite(hid) && hid > 0) {
            setHabitId(hid)
            saveHabitId(hid)
            resolvedHabitId = hid
          }
        } catch (_) {}
        // Resolve unit (prefer backend endpoint)
        if (!unit && Number.isFinite(resolvedHabitId) && resolvedHabitId > 0) {
          try {
            const u = await getHabitUnit(resolvedHabitId)
            const normalized = String(u || '').trim()
            if (normalized) setUnit(normalized)
          } catch (_) {}
        }
        // Fallback: scan user's habits if still missing unit
        if (!unit && Number.isFinite(uid) && uid > 0) {
          try {
            const habits = await getUserHabits(uid)
            const match = Array.isArray(habits) ? habits.find((h) => {
              const name = String(h?.name ?? h?.key ?? h?.habitName ?? h?.HabitName ?? h?.title ?? '').trim().toLowerCase()
              return name === habitName.trim().toLowerCase()
            }) : null
            if (match) {
              const u = String(match?.unit ?? match?.habitUnit ?? '').trim()
              if (u) setUnit(u)
            }
          } catch (_) {}
        }
        // Optionally prefill from existing plan
        try {
          if (Number.isFinite(uid) && uid > 0 && Number.isFinite(resolvedHabitId) && resolvedHabitId > 0) {
            const existing = await getPlan({ userId: uid, habitId: resolvedHabitId })
            if (existing && typeof existing === 'object') {
              const t = String(existing.planType || '').toUpperCase()
              if (t === 'DEADLINE') {
                setPlanMode('DEADLINE')
                setStartDate(String(existing.startDate || '').slice(0, 10) || todayIsoLocal())
                setTargetEndDate(String(existing.endDate || '').slice(0, 10) || todayIsoLocal())
                const total = Number(existing.planLength) || 0
                if (total > 0) setTotalAmount(total)
              } else {
                setPlanMode('FIXED')
                setStartDate(String(existing.startDate || '').slice(0, 10) || todayIsoLocal())
                const per = Number(existing.perDay) || 0
                if (per > 0) setPerDay(per)
                const len = Number(existing.planLength) || 0
                if (len > 0) setPlanLengthValue(len)
              }
              const uni = String(existing.habitUnit || existing.unit || '').trim()
              if (uni) setUnit(uni)
            }
          }
        } catch (_) {}
      } finally {
        setResolving(false)
      }
    }
    boot()
  }, [])

  const derivedEndDate = useMemo(() => {
    if (planMode !== 'FIXED') return ''
    return addToIso(startDate, planLengthValue, planLengthUnit)
  }, [planMode, startDate, planLengthValue, planLengthUnit])

  const derivedPerDay = useMemo(() => {
    if (planMode !== 'DEADLINE') return 0
    const days = Math.max(1, diffInDays(startDate, targetEndDate))
    const total = Math.max(1, Number(totalAmount) || 0)
    return Math.ceil(total / days)
  }, [planMode, startDate, targetEndDate, totalAmount])

  const unitLower = (unit || 'units').toLowerCase()

  const canSave = useMemo(() => {
    if (!startDate) return false
    if (planMode === 'FIXED') {
      return Number(perDay) >= 1 && Number(planLengthValue) >= 1 && !!planLengthUnit && (Number.isFinite(habitId) && habitId > 0)
    }
    return Boolean(targetEndDate) && Number(totalAmount) >= 1 && (Number.isFinite(habitId) && habitId > 0)
  }, [planMode, startDate, perDay, planLengthValue, planLengthUnit, targetEndDate, totalAmount, habitId])

  const onSave = async (e) => {
    e.preventDefault()
    if (!canSave) return
    try {
      let hid = habitId
      if (!Number.isFinite(hid) || hid <= 0) {
        const resolved = await getHabitIdByName(habitName)
        if (!Number.isFinite(resolved)) throw new Error('Invalid habit id')
        hid = resolved
        setHabitId(resolved)
        saveHabitId(resolved)
      }
      let uid = userId
      if (!Number.isFinite(uid) || uid <= 0) {
        const email = getUserEmail()
        if (!email) {
          showToast({ title: 'Login required', body: 'Please log in again.', type: 'error', timeout: 2600 })
          return
        }
        uid = await getUserIdByEmail(email)
        if (!Number.isFinite(uid)) throw new Error('Invalid user id')
        saveUserId(uid)
        setUserId(uid)
      }
      const planType = planMode === 'FIXED' ? 'FIXED' : 'DEADLINE'
      const endDateIso = planMode === 'FIXED' ? derivedEndDate : targetEndDate
      const payload = {
        userId: uid,
        habitId: hid,
        planType,
        startDate: toZ(startDate),
        endDate: toZ(endDateIso),
        planLength: planMode === 'FIXED' ? Number(planLengthValue) : Number(totalAmount),
        perDay: planMode === 'FIXED' ? Number(perDay) : Number(derivedPerDay),
        unit: unitLower || 'units',
      }
      const res = await addPlan(payload)
      if (res.status === 200) {
        navigate('/dashboard')
        return
      }
      let body = ''
      try {
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const j = await res.json()
          body = typeof j === 'string' ? j : (j.message || j.error || JSON.stringify(j))
        } else {
          body = await res.text()
        }
      } catch (_) {}
      showToast({ title: 'Failed to create plan', body: body || `HTTP ${res.status}`, type: 'error', timeout: 3200 })
    } catch (err) {
      console.error('[HabitSetup] save failed', err)
      showToast({ title: 'Failed to save plan', body: 'Please try again.', type: 'error', timeout: 2600 })
    }
  }

  return (
    <div className="habit-page">
      <header className="habit-header" aria-label="Header">
        <div className="habit-brand">
          <span className="habit-brand-text">Habit Tracker</span>
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: 8, justifySelf: 'end' }}>
          <button className="btn primary" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="habit-main">
        <section className="habit-intro" aria-labelledby="habit-title">
          <h1 id="habit-title" className="habit-title">Set up: {habitName}</h1>
          <p className="habit-subtitle">{resolving ? 'Loading…' : `Plan your ${habitName.toLowerCase()} with ${unitLower}.`}</p>
        </section>

        <section className="habit-card" role="region" aria-labelledby="plan-title">
          <h2 id="plan-title" className="plan-title">Plan setup</h2>
          <form className="habit-form" onSubmit={onSave}>
            <fieldset className="mode-fieldset">
              <legend className="label">Plan type</legend>
              <label className="radio">
                <input
                  type="radio"
                  name="planMode"
                  value="FIXED"
                  checked={planMode === 'FIXED'}
                  onChange={() => setPlanMode('FIXED')}
                />
                <span>Fixed per day</span>
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="planMode"
                  value="DEADLINE"
                  checked={planMode === 'DEADLINE'}
                  onChange={() => setPlanMode('DEADLINE')}
                />
                <span>Finish by date</span>
              </label>
            </fieldset>

            <div className="grid">
              <div className="field">
                <BrownDatePicker
                  id="startDate"
                  label="Start date"
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>

              {planMode === 'FIXED' && (
                <>
                  <div className="field">
                    <label className="label" htmlFor="perDay">{unitLower} per day</label>
                    <input
                      id="perDay"
                      className="input"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={perDay}
                      onChange={(e) => setPerDay(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="planLengthValue">Plan length</label>
                    <div className="inline">
                      <input
                        id="planLengthValue"
                        className="input"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={planLengthValue}
                        onChange={(e) => setPlanLengthValue(Number(e.target.value))}
                      />
                      <select
                        aria-label="Plan unit"
                        className="select"
                        value={planLengthUnit}
                        onChange={(e) => setPlanLengthUnit(e.target.value)}
                      >
                        <option value="days">days</option>
                        <option value="weeks">weeks</option>
                        <option value="months">months</option>
                      </select>
                    </div>
                    <p className="hint">End date: <strong>{derivedEndDate || '—'}</strong></p>
                  </div>
                </>
              )}

              {planMode === 'DEADLINE' && (
                <>
                  <div className="field">
                    <BrownDatePicker
                      id="targetEndDate"
                      label="Target end date"
                      value={targetEndDate}
                      onChange={setTargetEndDate}
                      min={startDate}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="totalAmount">Total ({unitLower})</label>
                    <input
                      id="totalAmount"
                      className="input"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                    />
                    <p className="hint">Recommended per day: <strong>{derivedPerDay || 0}</strong></p>
                  </div>
                </>
              )}
            </div>

            <div className="actions">
              <button className="btn primary" type="submit" disabled={!canSave}>
                <span className="btn-label">Save plan</span>
              </button>
            </div>
          </form>
        </section>
      </main>
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}


