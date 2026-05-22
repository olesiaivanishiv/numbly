import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function TeacherLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  function validate() {
    if (isRegister && !name.trim()) {
      setError("Введіть ваше ім'я")
      return false
    }
    if (!email.trim()) {
      setError('Введіть email')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Невірний формат email (наприклад: name@gmail.com)')
      return false
    }
    if (!password.trim()) {
      setError('Введіть пароль')
      return false
    }
    if (password.length < 6) {
      setError('Пароль має бути не менше 6 символів')
      return false
    }
    return true
  }

  async function handleLogin() {
    if (!validate()) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })
    setLoading(false)
    if (error) { setError('Помилка входу: ' + error.message); return }
    if (data?.user) { navigate('/teacher') }
    else { setError('Щось пішло не так. Спробуй ще раз.') }
  }

  async function handleRegister() {
    if (!validate()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    })
    if (error) {
      setError(error.message.includes('already registered')
        ? 'Цей email вже зареєстрований — увійдіть'
        : error.message)
      setLoading(false)
      return
    }
    localStorage.setItem('pendingName', name.trim())
    localStorage.setItem('pendingEmail', email.trim())
    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="page">
        <div className="card">
          <div style={{ fontSize: 64 }}>📧</div>
          <h2 className="screen-title">Перевір пошту!</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Ми надіслали листа на <strong>{email}</strong>.
            Натисни посилання у листі щоб підтвердити реєстрацію.
          </p>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>
            Після підтвердження повернись сюди і увійди.
          </p>
          <button className="btn-primary" onClick={() => {
            setEmailSent(false)
            setIsRegister(false)
          }}>
            Перейти до входу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="screen-title">🍎 Numbly</h1>
        <p className="screen-subtitle">
          {isRegister ? 'Реєстрація вчителя' : 'Вхід для вчителя'}
        </p>

        {isRegister && (
          <input
            className="form-input"
            placeholder="Ваше ім'я"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}

        <input
          className="form-input"
          style={{ border: error && !email ? '2px solid #FF5252' : '' }}
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
        />

        <input
          className="form-input"
          style={{ border: error && !password ? '2px solid #FF5252' : '' }}
          placeholder="Пароль (мінімум 6 символів)"
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && (isRegister ? handleRegister() : handleLogin())}
        />

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn-primary"
          onClick={isRegister ? handleRegister : handleLogin}
          disabled={loading}
        >
          {loading ? 'Завантаження...' : isRegister ? 'Зареєструватись' : 'Увійти'}
        </button>

        <button
          className="btn-secondary"
          onClick={() => { setIsRegister(!isRegister); setError('') }}
        >
          {isRegister ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Зареєструватись'}
        </button>

        <button className="btn-ghost" onClick={() => navigate('/')}>
          На головну
        </button>
      </div>
    </div>
  )
}