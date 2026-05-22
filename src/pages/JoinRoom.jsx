import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import confetti from 'canvas-confetti'

function generateTask(operations, maxNumber, specificNumbers = []) {
  const op = operations[Math.floor(Math.random() * operations.length)]
  const min = 1
  const max = maxNumber

  if (op === 'mul') {
    if (specificNumbers.length > 0) {
      const b = specificNumbers[Math.floor(Math.random() * specificNumbers.length)]
      const a = Math.floor(Math.random() * 10) + 1
      return { a, b, op, answer: a * b }
    }
    const a = Math.floor(Math.random() * (max - min + 1)) + min
    const b = Math.floor(Math.random() * (max - min + 1)) + min
    return { a, b, op, answer: a * b }
  }

  if (op === 'div') {
    if (specificNumbers.length > 0) {
      const b = specificNumbers[Math.floor(Math.random() * specificNumbers.length)]
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

  const answers = { add: a + b, sub: a - b }
  return { a, b, op, answer: answers[op] }
}

const OP_SYMBOLS = { add: '+', sub: '−', mul: '×', div: '÷' }

export default function JoinRoom() {
  const navigate = useNavigate()
  const [step, setStep] = useState('join')
  const [code, setCode] = useState('')
  const [childName, setChildName] = useState('')
  const [room, setRoom] = useState(null)
  const [resultId, setResultId] = useState(null)
  const [error, setError] = useState('')
  const [task, setTask] = useState(null)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [emoji, setEmoji] = useState(null)
  const [floatingScore, setFloatingScore] = useState(null)
  const [shake, setShake] = useState(false)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const inputRef = useRef(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    if (step !== 'playing') return
    if (timeLeft <= 0) { setStep('finished'); return }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, step])

  useEffect(() => {
    if (step === 'playing' && inputRef.current) inputRef.current.focus()
  }, [task, step])

  useEffect(() => {
    if (step !== 'playing' || !room) return
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 3000)
    return () => clearInterval(interval)
  }, [step, room])

  async function findRoom() {
    setError('')
    const { data } = await supabase.from('rooms').select('*').eq('code', code.toUpperCase()).single()
    if (!data) { setError('Кімнату не знайдено! Перевір код.'); return }
    setRoom(data)
    setStep('name')
  }

  async function startGame() {
    if (!childName.trim()) { setError("Введи своє ім'я!"); return }
    const { data } = await supabase.from('results').insert({
      room_id: room.id, child_name: childName,
      total: 0, correct: 0, accuracy: 0, score: 0
    }).select().single()
    setResultId(data.id)
    setTask(generateTask(room.operations, room.max_number, room.specific_numbers || []))
    setTimeLeft(room.duration)
    setStep('playing')
  }

  async function loadLeaderboard() {
    if (!room) return
    const { data } = await supabase.from('results').select('child_name, score, accuracy').eq('room_id', room.id).order('score', { ascending: false })
    setLeaderboard(data || [])
  }

  async function submitAnswer() {
    if (input === '') return
    const isCorrect = parseInt(input) === task.answer
    const newTotal = total + 1
    const newCorrect = correct + (isCorrect ? 1 : 0)
    const points = isCorrect ? 10 + Math.max(1, Math.floor(timeLeft / 10)) : 0
    const newScore = score + points
    const newAccuracy = Math.round((newCorrect / newTotal) * 100)

    setFeedback(isCorrect ? 'correct' : 'wrong')
    setTotal(newTotal)
    setCorrect(newCorrect)
    setScore(newScore)

    if (isCorrect) {
      setEmoji(['🎉', '⭐', '🔥', '💪', '🚀'][Math.floor(Math.random() * 5)])
      setFloatingScore(`+${points}`)
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#6C63FF', '#FFD166', '#4caf50'] })
    } else {
      setEmoji('😢')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }

    await supabase.from('answers').insert({
      result_id: resultId, room_id: room.id, child_name: childName,
      task_a: task.a, task_b: task.b, operation: task.op,
      correct_answer: task.answer, child_answer: parseInt(input), is_correct: isCorrect,
    })

    await supabase.from('results').update({
      total: newTotal, correct: newCorrect, accuracy: newAccuracy, score: newScore,
    }).eq('id', resultId)

    setTimeout(() => {
      setFeedback(null); setEmoji(null); setFloatingScore(null)
      setInput(''); setTask(generateTask(room.operations, room.max_number, room.specific_numbers || []))
    }, 600)
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const timerColor = timeLeft <= 10 ? '#FF5252' : '#6C63FF'
  const progress = room ? ((room.duration - timeLeft) / room.duration) * 100 : 0
  const cardBg = feedback === 'correct' ? '#e8f5e9' : feedback === 'wrong' ? '#ffebee' : '#fff'

  return (
    <div className="page">
      <div
        className="card"
        style={{
          background: cardBg,
          animation: shake ? 'shake 0.5s ease' : 'none',
          transition: 'background 0.3s',
        }}
      >

        {step === 'join' && (
          <>
            <h1 className="screen-title">🔢 Numbly</h1>
            <p className="screen-subtitle">Введи код кімнати від вчителя</p>
            <input
              className="answer-input"
              placeholder="Код кімнати (ABC123)"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findRoom()}
              maxLength={6}
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn-primary" onClick={findRoom}>Знайти кімнату 🔍</button>
            <button className="btn-ghost" onClick={() => navigate('/')}>← Назад</button>
          </>
        )}

        {step === 'name' && (
          <>
            <h1 className="screen-title">👋 Привіт!</h1>
            <p className="screen-subtitle">Кімната: <strong>{room.topic}</strong></p>
            <p style={{ color: '#9090A0', fontSize: 14, marginBottom: 16 }}>
              До {room.max_number} • {room.duration} секунд
            </p>
            <input
              className="answer-input"
              placeholder="Твоє ім'я"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startGame()}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn-primary" onClick={startGame}>Почати змагання 🚀</button>
            <button className="btn-ghost" onClick={() => setStep('join')}>← Назад</button>
          </>
        )}

        {step === 'playing' && task && (
          <>
            <button
              className="leader-btn"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
            >
              {showLeaderboard ? '🎯 До задачі' : `🏆 Рейтинг (${leaderboard.length})`}
            </button>

            <div className="top-row">
              <span className="timer" style={{
                color: timerColor,
                animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
              }}>
                ⏱ {timeLeft}с
              </span>
              <span className="score-text">⭐ {score}</span>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%`, background: timerColor }} />
            </div>

            <div className="training-stats">
              <span style={{ color: '#4caf50' }}>✓ {correct}</span>
              <span style={{ color: '#888' }}>{total} задач</span>
              <span style={{ color: '#FF5252' }}>✗ {total - correct}</span>
            </div>

            <div style={{ position: 'relative' }}>
              <div className="task-box">
                <span className="task-text">
                  {task.a} {OP_SYMBOLS[task.op]} {task.b} = ?
                </span>
              </div>

              {emoji && (
                <div style={{
                  position: 'absolute', top: -20, right: 20,
                  fontSize: 40, animation: 'floatUp 0.6s ease forwards',
                }}>
                  {emoji}
                </div>
              )}

              {floatingScore && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)', fontSize: 24,
                  fontWeight: 900, color: '#4caf50',
                  animation: 'floatUp 0.6s ease forwards',
                }}>
                  {floatingScore}
                </div>
              )}
            </div>

            {feedback === 'correct' && <p className="feedback-good">✅ Правильно!</p>}
            {feedback === 'wrong' && <p className="feedback-bad">❌ Відповідь: {task.answer}</p>}

            <input
              ref={inputRef}
              className="answer-input"
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder="Твоя відповідь"
            />

            <button className="btn-primary" onClick={submitAnswer}>Відповісти ✓</button>

            {showLeaderboard && (
              <div className="leader-modal">
                <h3 className="leader-title">🏆 Рейтинг</h3>
                {leaderboard.map((r, i) => (
                  <div key={i} className="leader-row" style={{
                    background: r.child_name === childName ? '#EEF' : '#F8F7FF',
                    border: r.child_name === childName ? '2px solid #6C63FF' : '2px solid transparent',
                  }}>
                    <span className="leader-rank">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span className="leader-name">
                      {r.child_name}{r.child_name === childName && ' (ти)'}
                    </span>
                    <div className="leader-stats">
                      <span style={{ color: '#6C63FF', fontWeight: 800 }}>⭐ {r.score}</span>
                      <span style={{ color: '#9090A0', fontSize: 12 }}>{r.accuracy}%</span>
                    </div>
                  </div>
                ))}
                <button className="btn-primary" onClick={() => setShowLeaderboard(false)}>
                  Закрити ✕
                </button>
              </div>
            )}
          </>
        )}

        {step === 'finished' && (
          <>
            <div style={{ fontSize: 80, animation: 'popIn 0.5s ease' }}>
              {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🌟' : '💪'}
            </div>
            <h1 className="screen-title">Час вийшов!</h1>
            <p className="screen-subtitle">{childName}, ось твій результат:</p>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-num">{score}</span>
                <span className="stat-label">Балів</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{accuracy}%</span>
                <span className="stat-label">Точність</span>
              </div>
              <div className="stat-card">
                <span className="stat-num" style={{ color: '#4caf50' }}>{correct}</span>
                <span className="stat-label">Правильно</span>
              </div>
              <div className="stat-card">
                <span className="stat-num" style={{ color: '#FF5252' }}>{total - correct}</span>
                <span className="stat-label">Помилок</span>
              </div>
            </div>

            <p style={{ color: '#9090A0', fontSize: 14, marginBottom: 16 }}>
              Вчитель бачить твій результат у рейтингу!
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>На головну 🏠</button>
          </>
        )}

      </div>
    </div>
  )
}