import { Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Selection from './pages/Selection.jsx'
import Reading from './pages/Reading.jsx'
import Meditation from './pages/Meditation.jsx'
import Workout from './pages/Workout.jsx'
import Journaling from './pages/Journaling.jsx'
import Progress from './pages/Progress.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/selection" element={<Selection />} />
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
