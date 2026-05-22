import { useNavigate } from 'react-router-dom'
import { storage } from '../services/storage'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Progress() {
  const navigate = useNavigate()
  const progress = storage.get('progress')
  const sessions = storage.get('sessions')
  const level = storage.get('level')

  const accuracy = progress.totalTasks > 0
    ? Math.round((progress.totalCorrect / progress.totalTasks) * 100)
    : 0

  const chartData = sessions.map((s, i) => ({
    name: `${i + 1}`,
    точність: s.accuracy,
    бали: s.score,
  }))

  function resetProgress() {
    if (confirm('Скинути весь прогрес?')) {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <div className="page">
      <div className="card">

        <h1 className="screen-title">📊 Мій прогрес</h1>

        <div className="level-box">
          <span className="level-emoji">🎮</span>
          <div>
            <div className="level-num">Рівень {level}</div>
            <div className="level-sub">Продовжуй тренуватись!</div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{progress.totalSessions}</span>
            <span className="stat-label">Сесій</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{progress.totalTasks}</span>
            <span className="stat-label">Задач</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{progress.totalCorrect}</span>
            <span className="stat-label">Правильно</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{accuracy}%</span>
            <span className="stat-label">Точність</span>
          </div>
        </div>

        {sessions.length > 0 ? (
          <>
            <p className="chart-title">Точність по сесіях</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Line
                  type="monotone"
                  dataKey="точність"
                  stroke="#6C63FF"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#6C63FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="empty-box">
            <p>📝 Ще немає даних</p>
            <p style={{ color: '#888', fontSize: 14 }}>Пройди першу сесію!</p>
          </div>
        )}

        <div className="badges-row">
          {progress.totalSessions >= 1 && <span className="badge">🥇 Перша сесія</span>}
          {progress.totalSessions >= 5 && <span className="badge">🔥 5 сесій</span>}
          {progress.totalSessions >= 10 && <span className="badge">💎 10 сесій</span>}
          {accuracy >= 90 && <span className="badge">🎯 Снайпер</span>}
          {level >= 5 && <span className="badge">⚡ Рівень 5</span>}
        </div>

        <button className="btn-primary" onClick={() => navigate('/')}>
          На головну 🏠
        </button>

        <button className="btn-reset" onClick={resetProgress}>
          Скинути прогрес
        </button>

      </div>
    </div>
  )
}