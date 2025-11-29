import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/auth.css'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import {
  initThemeFromStorage,
  setTheme as applyTheme,
  validateEmail,
  passwordStrength,
  loginRequest,
  signupRequest,
  startOAuth,
  showToast,
  googleAuthWithIdToken,
} from '../services/auth.js'
import { saveUserEmail, saveUserId } from '../services/session.js'
import { getUserIdByEmail, getUserHabits } from '../services/api.js'

export default function Auth() {
  // Theme
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

  // Tabs
  const getHashTab = () => {
    const h = (location.hash || '').replace('#', '')
    return h === 'signup' ? 'signup' : 'login'
  }
  const [activeTab, setActiveTab] = useState(getHashTab)
  useEffect(() => {
    const onHash = () => {
      const key = getHashTab()
      setActiveTab(key)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const activateTab = (key) => {
    setActiveTab(key)
    try {
      history.replaceState(null, '', `#${key}`)
    } catch (_) {
      location.hash = `#${key}`
    }
  }

  // Password toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRemember, setLoginRemember] = useState(false)
  const [loginEmailErr, setLoginEmailErr] = useState('')
  const [loginPassErr, setLoginPassErr] = useState('')
  const [loginMsg, setLoginMsg] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const loginOk = useMemo(() => {
    const emailOk = validateEmail(loginEmail)
    const passOk = !!loginPassword && loginPassword.length >= 8
    return emailOk && passOk
  }, [loginEmail, loginPassword])
  useEffect(() => {
    // mimic DOM validation side-effects
    if (loginEmail && !validateEmail(loginEmail)) {
      setLoginEmailErr('Enter a valid email address.')
    } else {
      setLoginEmailErr('')
    }
    if (loginPassword && loginPassword.length < 8) {
      setLoginPassErr('Password must be at least 8 characters.')
    } else {
      setLoginPassErr('')
    }
  }, [loginEmail, loginPassword])

  // Signup form state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupTerms, setSignupTerms] = useState(false)
  const [signupNameErr, setSignupNameErr] = useState('')
  const [signupEmailErr, setSignupEmailErr] = useState('')
  const [signupPassErr, setSignupPassErr] = useState('')
  const [signupTermsErr, setSignupTermsErr] = useState('')
  const [signupMsg, setSignupMsg] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const pwStrength = useMemo(() => passwordStrength(signupPassword).label, [signupPassword])
  const signupOk = useMemo(() => {
    const nameOk = !!signupName && !!signupName.trim()
    const emailOk = validateEmail(signupEmail)
    const passOk =
      !!signupPassword &&
      signupPassword.length >= 8 &&
      /[A-Za-z]/.test(signupPassword) &&
      /\d/.test(signupPassword)
    const termsOk = signupTerms
    return nameOk && emailOk && passOk && termsOk
  }, [signupName, signupEmail, signupPassword, signupTerms])
  useEffect(() => {
    if (!signupName || !signupName.trim()) setSignupNameErr('Please enter your full name.')
    else setSignupNameErr('')
    if (signupEmail && !validateEmail(signupEmail)) setSignupEmailErr('Enter a valid email address.')
    else setSignupEmailErr('')
    if (!signupPassword || signupPassword.length < 8) {
      setSignupPassErr('Password must be at least 8 characters.')
    } else if (!/[A-Za-z]/.test(signupPassword) || !/\d/.test(signupPassword)) {
      setSignupPassErr('Use letters and numbers for a stronger password.')
    } else {
      setSignupPassErr('')
    }
    if (!signupTerms) setSignupTermsErr('You must accept the terms to continue.')
    else setSignupTermsErr('')
  }, [signupName, signupEmail, signupPassword, signupTerms])

  // Handlers
  const onForgot = (e) => {
    e.preventDefault()
    showToast({
      title: 'Reset password',
      body: 'Wire this to your backend or email provider.',
      type: 'default',
    })
  }

  const onLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginOk) return
    setLoginLoading(true)
    setLoginMsg('')
    try {
      const res = await loginRequest({ email: loginEmail.trim(), password: loginPassword, rememberMe: loginRemember })
      if (res.status === 200) {
        const email = loginEmail.trim()
        saveUserEmail(email)
        // Fetch user id and habits to decide redirection
        try {
          const userId = await getUserIdByEmail(email)
          if (Number.isFinite(userId) && userId > 0) {
            saveUserId(userId)
            const habits = await getUserHabits(userId)
            const hasAny = Array.isArray(habits) && habits.length > 0
            navigate(hasAny ? '/dashboard' : '/selection')
          } else {
            navigate('/selection')
          }
        } catch (innerErr) {
          console.error('Post-login routing failed', innerErr)
          navigate('/selection')
        }
      } else if (res.status === 400) {
        setLoginMsg('Incorrect email or password')
      } else {
        setLoginMsg('Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Network or CORS error during login', err)
      setLoginMsg('Network error. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const onSignupSubmit = async (e) => {
    e.preventDefault()
    if (!signupOk) return
    setSignupLoading(true)
    setSignupMsg('')
    try {
      const res = await signupRequest({
        fullName: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
      })
      if (res.status === 200 || res.status === 201) {
        setSignupMsg('User registered successfully')
        saveUserEmail(signupEmail.trim())
        navigate('/selection')
      } else if (res.status === 400) {
        setSignupMsg('Please log in')
      } else {
        setSignupMsg('Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Network or CORS error during signup', err)
      setSignupMsg('Network error. Please try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar" aria-label="Header">
        <div className="brand">
          <span className="brand-text">Habit Tracker</span>
        </div>
        <button
          id="theme-toggle"
          className="icon-btn"
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

      <main className="center-wrap">
        <section className="card" role="dialog" aria-labelledby="auth-title" aria-describedby="auth-desc">
          <div className="card-header">
            <h1 id="auth-title" className="title">Welcome</h1>
            <p id="auth-desc" className="subtitle">Log in to continue or create a new account</p>
          </div>

          <div className="tabs" role="tablist" aria-label="Authentication">
            <button
              id="tab-login"
              className={`tab ${activeTab === 'login' ? 'is-active' : ''}`}
              role="tab"
              aria-selected={String(activeTab === 'login')}
              aria-controls="panel-login"
              data-tab="login"
              onClick={() => activateTab('login')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  activateTab(activeTab === 'login' ? 'signup' : 'login')
                }
              }}
            >
              Log in
            </button>
            <button
              id="tab-signup"
              className={`tab ${activeTab === 'signup' ? 'is-active' : ''}`}
              role="tab"
              aria-selected={String(activeTab === 'signup')}
              aria-controls="panel-signup"
              data-tab="signup"
              onClick={() => activateTab('signup')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  activateTab(activeTab === 'login' ? 'signup' : 'login')
                }
              }}
            >
              Sign up
            </button>
          </div>

          <div className="providers" aria-label="Social sign-in">
            <div className="btn provider" role="button" aria-label="Continue with Google" style={{ padding: 0, background: 'transparent' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const idToken = credentialResponse && credentialResponse.credential
                    console.debug('[GoogleLogin] credentialResponse', {
                      hasCredential: !!(credentialResponse && credentialResponse.credential),
                    })
                    if (!idToken) {
                      showToast({ title: 'Google sign-in failed', body: 'No token received.' })
                      return
                    }
                    // Send token to backend for verification
                    const res = await googleAuthWithIdToken(idToken)
                    if (!res) {
                      showToast({ title: 'Google sign-in failed', body: 'No response from server.' })
                      return
                    }
                    if (!res.ok) {
                      let errBody = ''
                      try {
                        const ct = res.headers.get('content-type') || ''
                        if (ct.includes('application/json')) {
                          const j = await res.json()
                          errBody = (j && (j.error || j.message)) || JSON.stringify(j)
                        } else {
                          errBody = await res.text()
                        }
                      } catch (_) {}
                      console.error('[GoogleLogin] backend error', res.status, errBody)
                      showToast({
                        title: 'Google sign-in failed',
                        body: errBody ? `Server error: ${String(errBody)}` : `HTTP ${res.status}`,
                      })
                      return
                    }
                    let serverData = null
                    try { serverData = await res.json() } catch (_) {
                      showToast({ title: 'Google sign-in failed', body: 'Invalid server response.' })
                      return
                    }
                    const email =
                      (serverData && (serverData.email || (serverData.user && serverData.user.email))) || ''
                    if (!email || typeof email !== 'string') {
                      showToast({ title: 'Google sign-in failed', body: 'Server did not return an email.' })
                      return
                    }
                    const backendUserId =
                      (serverData && (serverData.userId ?? serverData.id ?? (serverData.user && serverData.user.id))) || null
                    saveUserEmail(email)
                    try {
                      const userId = Number(backendUserId)
                      if (!Number.isFinite(userId) || userId <= 0) {
                        showToast({ title: 'Google sign-in failed', body: 'Server did not return a valid userId.' })
                        return
                      }
                      if (Number.isFinite(userId) && userId > 0) {
                        saveUserId(userId)
                        const habits = await getUserHabits(userId)
                        const hasAny = Array.isArray(habits) && habits.length > 0
                        navigate(hasAny ? '/dashboard' : '/selection')
                      } else {
                        navigate('/selection')
                      }
                    } catch (innerErr) {
                      console.error('Post-Google routing failed', innerErr)
                      navigate('/selection')
                    }
                  } catch (err) {
                    console.error('[GoogleLogin] error', err)
                    showToast({ title: 'Google sign-in failed', body: String(err && err.message ? err.message : err) })
                  }
                }}
                onError={() => {
                  showToast({ title: 'Google sign-in failed', body: 'Popup closed or blocked.' })
                }}
                useOneTap={false}
              />
            </div>
            <button className="btn provider" type="button" data-provider="microsoft" onClick={() => startOAuth('microsoft')}>
              <img src="/assets/icons/microsoft.svg" alt="" className="provider-icon" />
              <span>Continue with Microsoft</span>
            </button>
          </div>

          <div className="divider" role="separator" aria-label="or continue with email">
            <span>or</span>
          </div>

          <section
            id="panel-login"
            className="panel"
            role="tabpanel"
            aria-labelledby="tab-login"
            data-panel="login"
            hidden={activeTab !== 'login'}
          >
            <form id="login-form" className="form" noValidate onSubmit={onLoginSubmit}>
              <div className="field">
                <label className="label" htmlFor="login-email">Email</label>
                <input
                  className="input"
                  id="login-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-describedby="login-email-error"
                  aria-invalid={String(!!loginEmailErr)}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <p id="login-email-error" className="field-error" aria-live="polite">{loginEmailErr}</p>
              </div>
              <div className="field">
                <div className="label-row">
                  <label className="label" htmlFor="login-password">Password</label>
                  <a className="link" href="#" id="forgot-link" onClick={onForgot}>Forgot password?</a>
                </div>
                <div className="input-with-action">
                  <input
                    className="input"
                    id="login-password"
                    name="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    aria-describedby="login-password-error"
                    aria-invalid={String(!!loginPassErr)}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    className="ghost-btn toggle-password"
                    type="button"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    data-target="login-password"
                    onClick={() => setShowLoginPassword((v) => !v)}
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p id="login-password-error" className="field-error" aria-live="polite">{loginPassErr}</p>
              </div>

              <div className="row between">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    id="login-remember"
                    name="remember"
                    checked={loginRemember}
                    onChange={(e) => setLoginRemember(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <div className="actions">
                <button
                  id="login-submit"
                  className={`btn primary ${loginLoading ? 'is-loading' : ''}`}
                  type="submit"
                  disabled={!loginOk || loginLoading}
                >
                  <span className="btn-label">Log in</span>
                  <span className="spinner" aria-hidden="true"></span>
                </button>
              </div>
              <div id="login-form-msg" className="form-msg" aria-live="polite">{loginMsg}</div>
            </form>
          </section>

          <section
            id="panel-signup"
            className="panel"
            role="tabpanel"
            aria-labelledby="tab-signup"
            data-panel="signup"
            hidden={activeTab !== 'signup'}
          >
            <form id="signup-form" className="form" noValidate onSubmit={onSignupSubmit}>
              <div className="field">
                <label className="label" htmlFor="signup-name">Full name</label>
                <input
                  className="input"
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  required
                  aria-describedby="signup-name-error"
                  aria-invalid={String(!!signupNameErr)}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
                <p id="signup-name-error" className="field-error" aria-live="polite">{signupNameErr}</p>
              </div>
              <div className="field">
                <label className="label" htmlFor="signup-email">Email</label>
                <input
                  className="input"
                  id="signup-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-describedby="signup-email-error"
                  aria-invalid={String(!!signupEmailErr)}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
                <p id="signup-email-error" className="field-error" aria-live="polite">{signupEmailErr}</p>
              </div>
              <div className="field">
                <label className="label" htmlFor="signup-password">Password</label>
                <div className="input-with-action">
                  <input
                    className="input"
                    id="signup-password"
                    name="password"
                    type={showSignupPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    aria-describedby="signup-password-error signup-password-hint"
                    aria-invalid={String(!!signupPassErr)}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <button
                    className="ghost-btn toggle-password"
                    type="button"
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    data-target="signup-password"
                    onClick={() => setShowSignupPassword((v) => !v)}
                  >
                    {showSignupPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p id="signup-password-error" className="field-error" aria-live="polite">{signupPassErr}</p>
                <p id="signup-password-hint" className="hint">Use 8+ characters with letters and numbers. Strength: <span id="pw-strength">{pwStrength}</span></p>
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  id="signup-terms"
                  name="terms"
                  required
                  aria-describedby="signup-terms-error"
                  checked={signupTerms}
                  onChange={(e) => setSignupTerms(e.target.checked)}
                />
                <span>I agree to the <a className="link" href="#" target="_blank" rel="noopener">Terms</a> and <a className="link" href="#" target="_blank" rel="noopener">Privacy</a></span>
              </label>
              <p id="signup-terms-error" className="field-error" aria-live="polite">{signupTermsErr}</p>

              <div className="actions">
                <button
                  id="signup-submit"
                  className={`btn primary ${signupLoading ? 'is-loading' : ''}`}
                  type="submit"
                  disabled={!signupOk || signupLoading}
                >
                  <span className="btn-label">Create account</span>
                  <span className="spinner" aria-hidden="true"></span>
                </button>
              </div>
              <div id="signup-form-msg" className="form-msg" aria-live="polite">{signupMsg}</div>
            </form>
          </section>
        </section>
      </main>

      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  )
}


