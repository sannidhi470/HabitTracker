import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMe } from './services/auth.js'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Selection from './pages/Selection.jsx'
import Reading from './pages/Reading.jsx'
import Meditation from './pages/Meditation.jsx'
import Workout from './pages/Workout.jsx'
import Journaling from './pages/Journaling.jsx'
import Progress from './pages/Progress.jsx'
import CustomHabit from './pages/CustomHabit.jsx'
import HabitSetup from './pages/HabitSetup.jsx'
import AIHabitSuggest from './pages/AIHabitSuggest.jsx'

function BootRedirect() {
  const [dest, setDest] = useState('')
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await getMe()
        if (!mounted) return
        setDest(me && Number.isFinite(me.userId) && me.userId > 0 ? '/dashboard' : '/auth')
      } catch (_) {
        if (!mounted) return
        setDest('/auth')
      }
    })()
    return () => { mounted = false }
  }, [])
  if (!dest) return null
  return <Navigate to={dest} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<BootRedirect />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/selection" element={<Selection />} />
      <Route path="/custom-habit" element={<CustomHabit />} />
      <Route path="/ai-suggest" element={<AIHabitSuggest />} />
      <Route path="/habit/:slug" element={<HabitSetup />} />
      <Route path="/reading" element={<Reading />} />
      <Route path="/meditation" element={<Meditation />} />
      <Route path="/workout" element={<Workout />} />
      <Route path="/journaling" element={<Journaling />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

export default App
