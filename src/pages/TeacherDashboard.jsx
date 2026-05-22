import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [rooms, setRooms] = useState([])
  const [creating, setCreating] = useState(false)
  const [topic, setTopic] = useState('')
  const [operations, setOperations] = useState(['add'])
  const [maxNumber, setMaxNumber] = useState(20)
  const [duration, setDuration] = useState(60)
  const [activeRoom, setActiveRoom] = useState(null)
  const [results, setResults] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childAnswers, setChildAnswers] = useState([])
  const [showStats, setShowStats] = useState(false)
  const [roomStats, setRoomStats] = useState(null)
  const [specificNumbers, setSpecificNumbers] = useState([])
  const [showSpecific, setShowSpecific] = useState(false)

  const OPS = [
    { key: 'add', label: '➕ Додавання', color: '#4CAF50' },
    { key: 'sub', label: '➖ Віднімання', color: '#FF9800' },
    { key: 'mul', label: '✖️ Множення', color: '#9C27B0' },
    { key: 'div', label: '➗ Ділення', color: '#2196F3' },
  ]

  useEffect(() => { loadTeacher() }, [])

  useEffect(() => {
    if (!activeRoom) return
    loadResults(activeRoom.id)
    const interval = setInterval(() => loadResults(activeRoom.id), 5000)
    return () => clearInterval(interval)
  }, [activeRoom])

  async function loadTeacher() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/teacher-login'); return }

    const pendingName = localStorage.getItem('pendingName')
    const pendingEmail = localStorage.getItem('pendingEmail')

    if (pendingName && user) {
      const { data: existing } = await supabase.from('teachers').select('id').eq('id', user.id).single()
      if (!existing) {
        await supabase.from('teachers').insert([{ id: user.id, name: pendingName, email: pendingEmail }])
      }
      localStorage.removeItem('pendingName')
      localStorage.removeItem('pendingEmail')
    }

    const { data } = await supabase.from('teachers').select('*').eq('id', user.id).single()
    setTeacher(data)
    loadRooms(user.id)
  }

  async function loadRooms(teacherId) {
    const { data } = await supabase.from('rooms').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false })
    setRooms(data || [])
  }

  async function createRoom() {
  if (operations.length === 0) return
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('rooms').insert({
    teacher_id: user.id,
    code: generateCode(),
    topic: topic || 'Тренування',
    operations,
    max_number: maxNumber,
    duration,
    specific_numbers: specificNumbers,
  }).select().single()
  if (error) { alert(error.message); return }
  if (data) { setRooms(r => [data, ...r]); setActiveRoom(data); setCreating(false) }
}

  async function loadResults(roomId) {
    const { data } = await supabase.from('results').select('*').eq('room_id', roomId).order('score', { ascending: false })
    setResults(data || [])
  }

  async function loadChildAnswers(resultId, childName) {
    const { data } = await supabase.from('answers').select('*').eq('result_id', resultId).order('created_at', { ascending: true })
    setChildAnswers(data || [])
    setSelectedChild(childName)
  }

  async function loadRoomStats(roomId) {
    const { data: answers } = await supabase.from('answers').select('*').eq('room_id', roomId)
    if (!answers || answers.length === 0) { alert('Ще немає даних для графіків!'); return }

    const OPS_LABELS = { add: 'Додавання', sub: 'Віднімання', mul: 'Множення', div: 'Ділення' }
    const byOperation = {}
    answers.forEach(a => {
      const op = OPS_LABELS[a.operation] || a.operation
      if (!byOperation[op]) byOperation[op] = { total: 0, correct: 0 }
      byOperation[op].total++
      if (a.is_correct) byOperation[op].correct++
    })

    const operationData = Object.entries(byOperation).map(([name, val]) => ({
      name, точність: Math.round((val.correct / val.total) * 100),
    }))

    const taskErrors = {}
    answers.filter(a => !a.is_correct).forEach(a => {
      const key = `${a.task_a}${a.operation === 'add' ? '+' : a.operation === 'sub' ? '-' : a.operation === 'mul' ? '×' : '÷'}${a.task_b}`
      taskErrors[key] = (taskErrors[key] || 0) + 1
    })

    const hardestTasks = Object.entries(taskErrors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([task, errors]) => ({ task, помилок: errors }))
    const totalCorrect = answers.filter(a => a.is_correct).length

    setRoomStats({ operationData, hardestTasks, totalCorrect, totalWrong: answers.length - totalCorrect, total: answers.length })
    setShowStats(true)
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function toggleOp(key) {
    setOperations(ops => ops.includes(key) ? ops.filter(o => o !== key) : [...ops, key])
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 480, textAlign: 'left' }}>

        <div className="dash-header">
          <div>
            <h1 className="screen-title">🍎 Numbly</h1>
            <p className="screen-subtitle">{teacher?.name ? `Вітаємо, ${teacher.name}!` : 'Вітаємо!'}</p>
          </div>
          <button className="btn-logout" onClick={logout}>Вийти</button>
        </div>

        {!activeRoom && !creating && (
          <>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              + Створити кімнату
            </button>

            {rooms.length > 0 && (
              <>
                <p className="section-title">Мої кімнати:</p>
                {rooms.map(room => (
                  <div key={room.id} className="room-card" onClick={() => setActiveRoom(room)}>
                    <div className="room-code">{room.code}</div>
                    <div className="room-info">
                      <div style={{ fontWeight: 700 }}>{room.topic}</div>
                      <div style={{ color: '#9090A0', fontSize: 13 }}>до {room.max_number} • {room.duration}с</div>
                    </div>
                    <div style={{ color: '#6C63FF', fontSize: 13, fontWeight: 700 }}>Відкрити →</div>
                  </div>
                ))}
              </>
            )}

            {rooms.length === 0 && (
              <div className="empty-box" style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700 }}>Ще немає кімнат</p>
                <p style={{ color: '#9090A0', fontSize: 14 }}>Створи першу кімнату для змагання!</p>
              </div>
            )}

            <button className="btn-ghost" onClick={() => navigate('/')}>На головну</button>
          </>
        )}

        {creating && (
          <>
            <p className="section-title">Нова кімната:</p>
            <input className="form-input" placeholder="Тема (наприклад: Додавання до 20)" value={topic} onChange={e => setTopic(e.target.value)} />

            <p style={{ fontWeight: 800, marginBottom: 8, color: '#2D2D44' }}>Операції:</p>
            <div className="ops-grid">
              {OPS.map(op => (
                <button key={op.key} onClick={() => toggleOp(op.key)} className="op-btn" style={{
                  background: operations.includes(op.key) ? op.color : '#F0EEFF',
                  color: operations.includes(op.key) ? '#fff' : '#888',
                }}>
                  {op.label}
                </button>
              ))}
            </div>
            {(operations.includes('mul') || operations.includes('div')) && (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <p style={{ fontWeight: 800, color: '#2D2D44', margin: 0 }}>
                Конкретні числа для × і ÷:
            </p>
            <button
                onClick={() => setShowSpecific(!showSpecific)}
                style={{
                padding: '4px 10px', background: showSpecific ? '#6C63FF' : '#F0EEFF',
                color: showSpecific ? '#fff' : '#6C63FF', border: '2px solid #6C63FF',
                borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif',
                }}
            >
                {showSpecific ? 'Вимкнути' : 'Увімкнути'}
            </button>
            </div>

            {showSpecific && (
            <>
                <p style={{ color: '#9090A0', fontSize: 13, marginBottom: 8 }}>
                Обери числа на які множити/ділити:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
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
                <p style={{ color: '#6C63FF', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                    Обрано: {specificNumbers.sort((a, b) => a - b).join(', ')}
                </p>
                )}
            </>
            )}
        </>
        )}

            <p style={{ fontWeight: 800, marginBottom: 4, color: '#2D2D44' }}>Максимальне число: <span style={{ color: '#6C63FF' }}>{maxNumber}</span></p>
            <input type="range" min="5" max="100" step="5" value={maxNumber} onChange={e => setMaxNumber(+e.target.value)} style={{ width: '100%', marginBottom: 16 }} />

            <p style={{ fontWeight: 800, marginBottom: 4, color: '#2D2D44' }}>Тривалість: <span style={{ color: '#6C63FF' }}>{duration}с</span></p>
            <input type="range" min="30" max="180" step="30" value={duration} onChange={e => setDuration(+e.target.value)} style={{ width: '100%', marginBottom: 16 }} />

            <button className="btn-primary" onClick={createRoom}>Створити кімнату 🚀</button>
            <button className="btn-ghost" onClick={() => setCreating(false)}>Скасувати</button>
          </>
        )}

        {activeRoom && (
          <>
            <div className="code-box">
              <p className="code-label">Код кімнати для дітей:</p>
              <div className="big-code">{activeRoom.code}</div>
              <p className="code-hint">Діти вводять цей код на головній сторінці</p>
            </div>

            <p className="section-title">Рейтинг ({results.length} учасників):</p>

            {selectedChild ? (
              <>
                <div className="child-header">
                  <button className="btn-small-back" onClick={() => { setSelectedChild(null); setChildAnswers([]) }}>← Назад</button>
                  <p className="section-title">{selectedChild} — деталі:</p>
                </div>

                <button className="btn-secondary" onClick={() => loadRoomStats(activeRoom.id)}>
                  📊 Графіки кімнати
                </button>

                <div className="answers-grid">
                  {childAnswers.map((a, i) => {
                    const OP = { add: '+', sub: '−', mul: '×', div: '÷' }
                    return (
                      <div key={a.id} className="answer-card" style={{
                        background: a.is_correct ? '#e8f5e9' : '#ffebee',
                        border: `1.5px solid ${a.is_correct ? '#4caf50' : '#e53935'}`,
                      }}>
                        <span className="answer-num">#{i + 1}</span>
                        <span className="answer-task">{a.task_a} {OP[a.operation]} {a.task_b}</span>
                        <span>{a.is_correct ? '✅' : '❌'}</span>
                        {!a.is_correct && <span className="answer-detail">{a.child_answer} → {a.correct_answer}</span>}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {results.length === 0 ? (
                  <div className="empty-box" style={{ textAlign: 'center' }}>Чекаємо на учасників... оновлення кожні 5с</div>
                ) : (
                  results.map((r, i) => (
                    <div key={r.id} className="result-row" onClick={() => loadChildAnswers(r.id, r.child_name)}>
                      <span className="rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                      <span className="child-name">{r.child_name}</span>
                      <span className="child-score">{r.score} балів</span>
                      <span className="child-acc">{r.accuracy}%</span>
                      <span style={{ color: '#9090A0', fontSize: 12 }}>деталі →</span>
                    </div>
                  ))
                )}
              </>
            )}

            <button className="btn-ghost" onClick={() => { setActiveRoom(null); setResults([]) }}>
              Назад до кімнат
            </button>
          </>
        )}

        {showStats && roomStats && (
          <div className="stats-modal">
            <div className="stats-card">
              <h3 className="stats-title">📊 Статистика кімнати</h3>
              <div className="pi-row">
                <div className="pi-card">
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#4caf50' }}>{roomStats.totalCorrect}</span>
                  <span style={{ color: '#9090A0', fontSize: 13 }}>Правильно</span>
                </div>
                <div className="pi-card">
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#FF5252' }}>{roomStats.totalWrong}</span>
                  <span style={{ color: '#9090A0', fontSize: 13 }}>Помилок</span>
                </div>
                <div className="pi-card">
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#6C63FF' }}>{Math.round((roomStats.totalCorrect / roomStats.total) * 100)}%</span>
                  <span style={{ color: '#9090A0', fontSize: 13 }}>Точність</span>
                </div>
              </div>
              <p className="chart-title">Точність по операціях:</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={roomStats.operationData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={val => `${val}%`} />
                  <Bar dataKey="точність" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {roomStats.hardestTasks.length > 0 && (
                <>
                  <p className="chart-title">Найважчі задачі:</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={roomStats.hardestTasks} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="task" type="category" tick={{ fontSize: 13, fontWeight: 700 }} width={60} />
                      <Tooltip />
                      <Bar dataKey="помилок" fill="#FF5252" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
              <button className="btn-primary" onClick={() => setShowStats(false)}>Закрити ✕</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}