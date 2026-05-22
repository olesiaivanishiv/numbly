import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../services/storage'

function generateTask(settings) {
  const ops = settings.operations
  const op = ops[Math.floor(Math.random() * ops.length)]
  const { min, max } = settings
  const specific = settings.specificNumbers || []

  if (op === 'mul') {
    if (specific.length > 0) {
      const b = specific[Math.floor(Math.random() * specific.length)]
      const a = Math.floor(Math.random() * 10) + 1
      return { a, b, op, answer: a * b }
    }
    const a = Math.floor(Math.random() * (max - min + 1)) + min
    const b = Math.floor(Math.random() * (max - min + 1)) + min
    return { a, b, op, answer: a * b }
  }

  if (op === 'div') {
    if (specific.length > 0) {
      const b = specific[Math.floor(Math.random() * specific.length)]
      const q = Math.floor(Math.random() * 10) + 1
      return { a: b * q, b, op, answer: q }
    }
    const b = Math.floor(Math.random() * (max - 2)) + 2
    const q = Math.floor(Math.random() * (max / b)) + 1
    return { a: b * q, b, op, answer: q }
  }

  let a = Math.floor(Math.random() * (max - min + 1)) + min
  let b = Math.floor(Math.random() * (max - min + 1)) + min
  if (op === 'sub' && b > a) [a, b] = [b, a]

  const answers = { add: a + b, sub: a - b, mul: a * b }
  return { a, b, op, answer: answers[op] }
}

const OP_SYMBOLS = { add: '+', sub: '−', mul: '×', div: '÷' }

export default function Training() {
  const navigate = useNavigate()
  const settings = storage.get('settings')

  const [task, setTask] = useState(() => generateTask(settings))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [timeLeft, setTimeLeft] = useState(settings.duration)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (timeLeft <= 0) {
      saveAndFinish()
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  function submitAnswer() {
    if (input === '') return
    const isCorrect = parseInt(input) === task.answer
    const newTotal = total + 1
    const newCorrect = correct + (isCorrect ? 1 : 0)

    setFeedback(isCorrect ? 'correct' : 'wrong')
    setTotal(newTotal)
    setCorrect(newCorrect)
    setHistory(h => [...h, isCorrect])

    if (isCorrect) {
      const bonus = Math.max(1, Math.floor(timeLeft / 10))
      setScore(s => s + 10 + bonus)
    }

    setTimeout(() => {
      setFeedback(null)
      setInput('')
      setTask(generateTask(settings))
      adaptDifficulty([...history, isCorrect])
    }, 600)
  }

  function adaptDifficulty(hist) {
    if (hist.length < 10) return
    const last10 = hist.slice(-10)
    const acc = last10.filter(Boolean).length / 10
    const s = storage.get('settings')
    if (acc >= 0.9) storage.set('settings', { ...s, max: Math.min(s.max + 5, 100) })
    if (acc < 0.6) storage.set('settings', { ...s, max: Math.max(s.max - 5, 5) })
  }

  function saveAndFinish() {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const progress = storage.get('progress')
    storage.set('progress', {
      totalSessions: progress.totalSessions + 1,
      totalTasks: progress.totalTasks + total,
      totalCorrect: progress.totalCorrect + correct,
    })
    const sessions = storage.get('sessions')
    storage.set('sessions', [...sessions.slice(-29), {
      date: new Date().toISOString(),
      total, correct, accuracy, score
    }])
    const level = storage.get('level')
    if (accuracy >= 80) storage.set('level', level + 1)
    navigate('/results', { state: { total, correct, accuracy, score } })
  }

  const bgColor = feedback === 'correct' ? '#e8f5e9' : feedback === 'wrong' ? '#ffebee' : '#fff'
  const progress = ((settings.duration - timeLeft) / settings.duration) * 100
  const timerColor = timeLeft <= 10 ? '#e53935' : '#6C63FF'

  return (
    <div className="page">
      <div className="card" style={{ background: bgColor, transition: 'background 0.3s' }}>

        <div className="top-row">
          <span className="timer" style={{ color: timerColor }}>⏱ {timeLeft}с</span>
          <span className="score-text">⭐ {score}</span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: timerColor }} />
        </div>

        <div className="training-stats">
          <span style={{ color: '#4caf50' }}>✓ {correct}</span>
          <span style={{ color: '#888' }}>{total} задач</span>
          <span style={{ color: '#e53935' }}>✗ {total - correct}</span>
        </div>

        <div className="task-box">
          <span className="task-text">
            {task.a} {OP_SYMBOLS[task.op]} {task.b} = ?
          </span>
        </div>

        {feedback === 'correct' && (
          <p className="feedback-good">✅ Правильно!</p>
        )}
        {feedback === 'wrong' && (
          <p className="feedback-bad">❌ Відповідь: {task.answer}</p>
        )}

        <input
          className="answer-input"
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitAnswer()}
          placeholder="Твоя відповідь"
          autoFocus
        />

        <button className="btn-primary" onClick={submitAnswer}>
          Відповісти ✓
        </button>

        <button className="btn-ghost" onClick={saveAndFinish}>
          Завершити
        </button>

      </div>
    </div>
  )
}