import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/auth.css'
import { validateEmail, showToast, requestPasswordReset } from '../services/auth.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      setEmailErr('')
      return
    }
    if (!validateEmail(email)) {
      setEmailErr('Enter a valid email address.')
    } else {
      setEmailErr('')
    }
  }, [email])

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!validateEmail(email)) {
      setEmailErr('Enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setMsg('If that email exists, we have sent a reset link.')
      showToast({
        title: 'Reset link sent',
        body: 'If that email exists, we have sent a reset link.',
        type: 'default',
      })
    } catch (err) {
      console.error('Forgot password failed', err)
      // Even on error, keep message generic to avoid leaking info
      setMsg('If that email exists, we have sent a reset link.')
      showToast({
        title: 'Reset password',
        body: 'If that email exists, we have sent a reset link.',
        type: 'default',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar" aria-label="Header">
        <div className="brand">
          <span className="brand-text">Habit Tracker</span>
        </div>
      </header>

      <main className="center-wrap">
        <section className="card card-forgot" role="dialog" aria-labelledby="forgot-title" aria-describedby="forgot-desc">
          <div className="card-header">
            <h1 id="forgot-title" className="title">Forgot password</h1>
            <p id="forgot-desc" className="subtitle">Enter your email and we&apos;ll send a reset link if it exists.</p>
          </div>

          <section className="panel">
            <form className="form" noValidate onSubmit={onSubmit}>
              <div className="field">
                <label className="label" htmlFor="forgot-email">Email</label>
                <input
                  className="input"
                  id="forgot-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-describedby="forgot-email-error"
                  aria-invalid={String(!!emailErr)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p id="forgot-email-error" className="field-error" aria-live="polite">{emailErr}</p>
              </div>

              <div className="actions">
                <button
                  className={`btn primary ${loading ? 'is-loading' : ''}`}
                  type="submit"
                  disabled={!email || !!emailErr || loading}
                >
                  <span className="btn-label">Send reset link</span>
                  <span className="spinner" aria-hidden="true"></span>
                </button>
              </div>

              <div className="form-msg" aria-live="polite">{msg}</div>
            </form>
          </section>

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


