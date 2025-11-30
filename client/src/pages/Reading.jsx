import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/reading.css'
import { initThemeFromStorage, setTheme as applyTheme, showToast, logoutRequest } from '../services/auth.js'
import { getHabitIdByName, getUserIdByEmail, addHabitToUser, addPlan } from '../services/api.js'
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

export default function Reading() {
  // Theme init and toggle
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
    ;(async () => {
      try { await logoutRequest() } catch (_) {}
      clearSession()
      navigate('/auth', { replace: true })
    })()
  }

  // Form state
  const todayIso = new Date().toISOString().slice(0, 10)
  const [planMode, setPlanMode] = useState('fixedDailyPages') // 'fixedDailyPages' | 'finishByDate'
  const [pagesPerDay, setPagesPerDay] = useState(10)
  const [planLengthValue, setPlanLengthValue] = useState(30)
  const [planLengthUnit, setPlanLengthUnit] = useState('days') // days | weeks | months
  const [startDate, setStartDate] = useState(todayIso)
  const [targetEndDate, setTargetEndDate] = useState(todayIso)
  const [totalPages, setTotalPages] = useState(300) // only used in finishByDate

  // Helpers
  const addToDate = (iso, value, unit) => {
    const d = new Date(iso + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return iso
    const v = Number(value) || 0
    const copy = new Date(d)
    if (unit === 'days') copy.setDate(copy.getDate() + v)
    else if (unit === 'weeks') copy.setDate(copy.getDate() + v * 7)
    else if (unit === 'months') {
      const day = copy.getDate()
      copy.setMonth(copy.getMonth() + v)
      // Maintain same day if possible, else clamp to last day of month
      if (copy.getDate() !== day) copy.setDate(0)
    }
    return copy.toISOString().slice(0, 10)
  }
  const diffInDays = (fromIso, toIso) => {
    const a = new Date(fromIso + 'T00:00:00')
    const b = new Date(toIso + 'T00:00:00')
    const ms = b.getTime() - a.getTime()
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  }

  // Derived values
  const derivedEndDate = useMemo(() => {
    if (planMode !== 'fixedDailyPages') return ''
    return addToDate(startDate, planLengthValue, planLengthUnit)
  }, [planMode, startDate, planLengthValue, planLengthUnit])

  const derivedPagesPerDay = useMemo(() => {
    if (planMode !== 'finishByDate') return 0
    const days = Math.max(1, diffInDays(startDate, targetEndDate))
    const total = Math.max(1, Number(totalPages) || 0)
    return Math.ceil(total / days)
  }, [planMode, startDate, targetEndDate, totalPages])

  // Validation
  const canSave = useMemo(() => {
    if (!startDate) return false
    if (planMode === 'fixedDailyPages') {
      return Number(pagesPerDay) >= 1 && Number(planLengthValue) >= 1 && !!planLengthUnit
    }
    // finishByDate
    return Boolean(targetEndDate) && Number(totalPages) >= 1
  }, [planMode, startDate, pagesPerDay, planLengthValue, planLengthUnit, targetEndDate, totalPages])

  // Submit
  const onSave = async (e) => {
    e.preventDefault()
    if (!canSave) return
    try {
      console.debug('[SavePlan][Reading] start')
      const habitId = await getHabitIdByName('Reading')
      console.debug('[SavePlan][Reading] habitId', habitId)
      if (!Number.isFinite(habitId)) throw new Error('Invalid habit id')
      saveHabitId(habitId)
      const email = getUserEmail()
      console.debug('[SavePlan][Reading] email', email)
      if (!email) {
        showToast({ title: 'Login required', body: 'Please log in again.', type: 'error', timeout: 2600 })
        return
      }
      const userId = await getUserIdByEmail(email)
      console.debug('[SavePlan][Reading] userId', userId)
      if (!Number.isFinite(userId)) throw new Error('Invalid user id')
      saveUserId(userId)
      console.debug('[SavePlan][Reading] linking user to habit')
      await addHabitToUser({ userId, habitId })
      console.debug('[SavePlan][Reading] user-habit linked, creating plan')

      const planType = planMode === 'fixedDailyPages' ? 'FIXED' : 'DEADLINE'
      const toZ = (d) => `${d}T00:00:00.000Z`
      const endDateIso = planMode === 'fixedDailyPages' ? derivedEndDate : targetEndDate
      const planPayload = {
        userId,
        habitId,
        planType,
        startDate: toZ(startDate),
        endDate: toZ(endDateIso),
        planLength: planMode === 'fixedDailyPages' ? Number(planLengthValue) : Number(totalPages),
        perDay: planMode === 'fixedDailyPages' ? Number(pagesPerDay) : Number(derivedPagesPerDay),
        unit: 'pages',
      }
      const res = await addPlan(planPayload)
      if (res.status === 200) {
        console.debug('[SavePlan][Reading] plan created, redirecting')
        navigate('/dashboard')
        return
      }
      if (res.status === 400) {
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
        showToast({ title: 'Failed to create plan', body: body || 'Bad request', type: 'error', timeout: 3200 })
        return
      }
      showToast({ title: 'Failed to create plan', body: `HTTP ${res.status}`, type: 'error', timeout: 3200 })
      return
    } catch (err) {
      console.error('[SavePlan][Reading] failed', err)
      showToast({ title: 'Failed to save plan', body: 'Please try again.', type: 'error', timeout: 2600 })
      return
    }
  }

  return (
    <div className="reading-page">
      <header className="reading-header" aria-label="Header">
        <div className="reading-brand">
          <span className="reading-brand-text">Habit Tracker</span>
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: 8, justifySelf: 'end' }}>
          <button
            id="theme-toggle"
            className="icon-btn reading-theme-toggle"
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

      <main className="reading-main">
        <section className="reading-intro" aria-labelledby="reading-quote-text">
          <blockquote className="reading-quote" aria-label="Inspirational quote">
            <p id="reading-quote-text" className="reading-quote-text">“Reading is to the mind what exercise is to the body.”</p>
            <cite className="reading-quote-author">— Joseph Addison</cite>
          </blockquote>
        </section>

        <section className="reading-card" role="region" aria-labelledby="plan-title">
          <h2 id="plan-title" className="plan-title">Plan setup</h2>
          <form className="reading-form" onSubmit={onSave}>
            <fieldset className="mode-fieldset">
              <legend className="label">Plan type</legend>
              <label className="radio">
                <input
                  type="radio"
                  name="planMode"
                  value="fixedDailyPages"
                  checked={planMode === 'fixedDailyPages'}
                  onChange={() => setPlanMode('fixedDailyPages')}
                />
                <span>Fixed daily pages</span>
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="planMode"
                  value="finishByDate"
                  checked={planMode === 'finishByDate'}
                  onChange={() => setPlanMode('finishByDate')}
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

              {planMode === 'fixedDailyPages' && (
                <>
                  <div className="field">
                    <label className="label" htmlFor="pagesPerDay">Pages per day</label>
                    <input
                      id="pagesPerDay"
                      className="input"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={pagesPerDay}
                      onChange={(e) => setPagesPerDay(Number(e.target.value))}
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

              {planMode === 'finishByDate' && (
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
                    <label className="label" htmlFor="totalPages">Total pages to complete</label>
                    <input
                      id="totalPages"
                      className="input"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={totalPages}
                      onChange={(e) => setTotalPages(Number(e.target.value))}
                    />
                    <p className="hint">Recommended pages/day: <strong>{derivedPagesPerDay || 0}</strong></p>
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


