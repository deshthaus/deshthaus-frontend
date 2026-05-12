import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Logo = () => (
  <svg viewBox="0 0 260 56" xmlns="http://www.w3.org/2000/svg" style={{ width: 240, display: 'block', margin: '0 auto' }}>
    <text y="42" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="42" letterSpacing="1.5" fill="#1a1f5e">DESHT</text>
    <text x="178" y="42" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="42" letterSpacing="1.5" fill="#1a1f5e">H</text>
    <rect x="204" y="6" width="11" height="11" fill="#FF6B00"/>
    <text x="219" y="42" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="42" letterSpacing="1.5" fill="#1a1f5e">AUS</text>
  </svg>
)

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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Logo />
        </div>
        {err && <div className="login-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="fg">
            <label>Имя</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ануар" required />
          </div>
          <div className="fg">
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
