import { useNavigate } from 'react-router-dom'
import { storage } from '../services/storage'
import { useState } from 'react'


const OPERATIONS = [
  { key: 'add', label: '➕ Додавання', color: '#4CAF50' },
  { key: 'sub', label: '➖ Віднімання', color: '#FF9800' },
  { key: 'mul', label: '✖️ Множення', color: '#9C27B0' },
  { key: 'div', label: '➗ Ділення', color: '#2196F3' },
]

export default function Home() {
  const navigate = useNavigate()
  const settings = storage.get('settings')
  const [specificNumbers, setSpecificNumbers] = useState([])
  const [showSpecific, setShowSpecific] = useState(false)
  const level = storage.get('level')
  const progress = storage.get('progress')

  function toggleOp(key) {
    const ops = settings.operations.includes(key)
      ? settings.operations.filter(o => o !== key)
      : [...settings.operations, key]
    if (ops.length === 0) return
    storage.set('settings', { ...settings, operations: ops })
    window.location.reload()
  }

  return (
    <div className="page">
      <div className="card">

        <div style={{ fontSize: 56, marginBottom: 4 }}>🔢</div>
        <h1 className="screen-title">Numbly</h1>
        <p className="screen-subtitle">Тренуй усний рахунок!</p>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">⚡{level}</span>
            <span className="stat-label">Рівень</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">🎯{progress.totalSessions}</span>
            <span className="stat-label">Сесій</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">✅{progress.totalTasks}</span>
            <span className="stat-label">Задач</span>
          </div>
        </div>

        <p className="section-title">Обери операції:</p>
        <div className="ops-grid">
          {OPERATIONS.map(op => (
            <button
              key={op.key}
              onClick={() => toggleOp(op.key)}
              className="op-btn"
              style={{
                background: settings.operations.includes(op.key) ? op.color : '#F0EEFF',
                color: settings.operations.includes(op.key) ? '#fff' : '#888',
                transform: settings.operations.includes(op.key) ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {op.label}
            </button>
          ))}
        </div>

        {(settings.operations.includes('mul') || settings.operations.includes('div')) && (
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <p style={{ fontWeight: 800, color: '#2D2D44', margin: 0, fontSize: 15 }}>
        Конкретні числа для × і ÷:
      </p>
      <button
        onClick={() => setShowSpecific(!showSpecific)}
        style={{
          padding: '4px 10px',
          background: showSpecific ? '#6C63FF' : '#F0EEFF',
          color: showSpecific ? '#fff' : '#6C63FF',
          border: '2px solid #6C63FF',
          borderRadius: 8, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
        }}
      >
        {showSpecific ? 'Вимкнути' : 'Увімкнути'}
      </button>
    </div>

    {showSpecific && (
      <>
        <p style={{ color: '#9090A0', fontSize: 13, marginBottom: 8, textAlign: 'left' }}>
          Обери числа на які множити/ділити:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
            <button
              key={num}
              onClick={() => setSpecificNumbers(prev =>
                prev.includes(num)
                  ? prev.filter(n => n !== num)
                  : [...prev, num]
              )}
              style={{
                padding: '10px 4px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 16,
                fontFamily: 'Nunito, sans-serif',
                background: specificNumbers.includes(num) ? '#6C63FF' : '#F0EEFF',
                color: specificNumbers.includes(num) ? '#fff' : '#6C63FF',
                transition: 'all 0.2s',
                transform: specificNumbers.includes(num) ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {num}
            </button>
          ))}
        </div>

        {specificNumbers.length > 0 && (
          <p style={{ color: '#6C63FF', fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: 'left' }}>
            Обрано: {specificNumbers.sort((a, b) => a - b).join(', ')}
          </p>
        )}
      </>
    )}
  </>
)}

        <button className="btn-primary" onClick={() => navigate('/training')}>
          🚀 Тренуватись
        </button>

        <button className="btn-secondary" onClick={() => navigate('/progress')}>
          📊 Мій прогрес
        </button>

        <div className="bottom-row">
          <button className="btn-small" onClick={() => navigate('/teacher-login')}>
            🍎 Я вчитель
          </button>
          <button className="btn-small" onClick={() => navigate('/join')}>
            🎮 Змагання
          </button>
        </div>

      </div>
    </div>
  )
}