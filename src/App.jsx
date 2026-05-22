import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Training from './pages/Training'
import Results from './pages/Results'
import Progress from './pages/Progress'
import TeacherLogin from './pages/TeacherLogin'
import TeacherDashboard from './pages/TeacherDashboard'
import JoinRoom from './pages/JoinRoom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/results" element={<Results />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/join" element={<JoinRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App