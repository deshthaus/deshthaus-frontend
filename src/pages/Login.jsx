import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await login(name, password)
      navigate('/')
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Неверное имя или пароль')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">DESHT<span style={{ color: 'var(--red)' }}>H</span>AUS</div>
        <div className="login-sub">ARCHITECTS · CRM</div>
        {err && <div className="login-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="fg">
            <label>Имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ануар"
              required
            />
          </div>
          <div className="fg">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
