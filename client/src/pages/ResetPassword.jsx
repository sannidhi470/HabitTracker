import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../styles/auth.css'
import { showToast, resetPassword as resetPasswordRequest } from '../services/auth.js'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passErr, setPassErr] = useState('')
  const [confirmErr, setConfirmErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (!password) {
      setPassErr('')
    } else if (password.length < 8) {
      setPassErr('Password must be at least 8 characters.')
    } else {
      setPassErr('')
    }
  }, [password])

  useEffect(() => {
    if (!confirmPassword) {
      setConfirmErr('')
    } else if (confirmPassword !== password) {
      setConfirmErr('Passwords do not match.')
    } else {
      setConfirmErr('')
    }
  }, [confirmPassword, password])

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!token) {
      setMsg('Invalid or missing reset link.')
      return
    }
    if (password.length < 8) {
      setPassErr('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setConfirmErr('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await resetPasswordRequest({ token, newPassword: password })
      if (res.ok) {
        setMsg('Password has been reset. You can now log in.')
        showToast({
          title: 'Password reset',
          body: 'Password has been reset. You can now log in.',
          type: 'default',
        })
        setTimeout(() => {
          navigate('/auth#login', { replace: true })
        }, 1000)
      } else {
        let body = 'Invalid or expired reset link.'
        try {
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            const j = await res.json()
            body = (j && (j.error || j.message)) || body
          } else {
            const t = await res.text()
            if (t) body = t
          }
        } catch (_) {}
        setMsg(body || 'Invalid or expired reset link.')
        showToast({
          title: 'Reset failed',
          body: body || 'Invalid or expired reset link.',
          type: 'default',
        })
      }
    } catch (err) {
      console.error('Reset password failed', err)
      const body = 'Something went wrong. Please try again.'
      setMsg(body)
      showToast({ title: 'Reset failed', body, type: 'default' })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="page">
        <header className="topbar" aria-label="Header">
          <div className="brand">
            <span className="brand-text">Habit Tracker</span>
          </div>
        </header>
        <main className="center-wrap">
          <section className="card" role="alert">
            <h1 className="title">Invalid reset link</h1>
            <p className="subtitle">The password reset link is missing or invalid.</p>
            <button
              className="btn primary"
              type="button"
              onClick={() => navigate('/forgot-password')}
            >
              Request a new link
            </button>
          </section>
        </main>
        <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar" aria-label="Header">
        <div className="brand">
          <span className="brand-text">Habit Tracker</span>
        </div>
      </header>

      <main className="center-wrap">
        <section className="card" role="dialog" aria-labelledby="reset-title" aria-describedby="reset-desc">
          <div className="card-header">
            <h1 id="reset-title" className="title">Reset password</h1>
            <p id="reset-desc" className="subtitle">Choose a new password for your account.</p>
          </div>

          <form className="form" noValidate onSubmit={onSubmit}>
            <div className="field">
              <label className="label" htmlFor="reset-password">New password</label>
              <input
                className="input"
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                aria-describedby="reset-password-error"
                aria-invalid={String(!!passErr)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p id="reset-password-error" className="field-error" aria-live="polite">{passErr}</p>
            </div>

            <div className="field">
              <label className="label" htmlFor="reset-confirm">Confirm password</label>
              <input
                className="input"
                id="reset-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                required
                aria-describedby="reset-confirm-error"
                aria-invalid={String(!!confirmErr)}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <p id="reset-confirm-error" className="field-error" aria-live="polite">{confirmErr}</p>
            </div>

            <div className="actions">
              <button
                className={`btn primary ${loading ? 'is-loading' : ''}`}
                type="submit"
                disabled={loading || !!passErr || !!confirmErr || !password || !confirmPassword}
              >
                <span className="btn-label">Reset password</span>
                <span className="spinner" aria-hidden="true"></span>
              </button>
            </div>

            <div className="form-msg" aria-live="polite">{msg}</div>
          </form>

          <div className="divider" role="separator" aria-label="Back">
            <span>or</span>
          </div>

          <div className="actions">
            <button
              className="btn ghost"
              type="button"
              onClick={() => navigate('/auth#login')}
            >
              Back to login
            </button>
          </div>
        </section>
      </main>

      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}


