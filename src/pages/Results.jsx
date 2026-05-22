import { useLocation, useNavigate } from 'react-router-dom'
import { storage } from '../services/storage'

export default function Results() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const level = storage.get('level')

  if (!state) {
    navigate('/')
    return null
  }

  const { total, correct, accuracy, score } = state
  const wrong = total - correct

  function getEmoji() {
    if (accuracy >= 90) return '🏆'
    if (accuracy >= 70) return '🌟'
    if (accuracy >= 50) return '👍'
    return '💪'
  }

  function getMessage() {
    if (accuracy >= 90) return 'Відмінно! Ти справжній чемпіон!'
    if (accuracy >= 70) return 'Молодець! Так тримати!'
    if (accuracy >= 50) return 'Непогано! Ще трохи практики!'
    return 'Не здавайся! Практика — це ключ!'
  }

  return (
    <div className="page">
      <div className="card">

        <div className="result-emoji">{getEmoji()}</div>
        <h1 className="screen-title">Результати</h1>
        <p className="screen-subtitle">{getMessage()}</p>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{accuracy}%</span>
            <span className="stat-label">Точність</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{score}</span>
            <span className="stat-label">Балів</span>
          </div>
          <div className="stat-card">
            <span className="stat-num" style={{ color: '#4caf50' }}>{correct}</span>
            <span className="stat-label">Правильно</span>
          </div>
          <div className="stat-card">
            <span className="stat-num" style={{ color: '#e53935' }}>{wrong}</span>
            <span className="stat-label">Помилок</span>
          </div>
        </div>

        <div className="level-box">
          <span className="level-text">🎮 Рівень {level}</span>
          {accuracy >= 80 && (
            <span className="level-up">⬆️ Рівень підвищено!</span>
          )}
        </div>

        <button className="btn-primary" onClick={() => navigate('/training')}>
          Ще раз 🚀
        </button>

        <button className="btn-secondary" onClick={() => navigate('/')}>
          На головну 🏠
        </button>

        <button className="btn-ghost" onClick={() => navigate('/progress')}>
          Мій прогрес 📊
        </button>

      </div>
    </div>
  )
}