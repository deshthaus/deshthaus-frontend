import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Profile() {
  const { user, logout } = useAuth()
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function changePassword(e) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (next !== confirm) { setErr('Новые пароли не совпадают'); return }
    if (next.length < 6) { setErr('Минимум 6 символов'); return }
    setLoading(true)
    try {
      await api.put('/auth/change-password', { current_password: cur, new_password: next })
      setMsg('✅ Пароль успешно изменён')
      setCur(''); setNext(''); setConfirm('')
    } catch (e) {
      setErr(e.response?.data?.error || 'Ошибка')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="ph"><div className="pt">Профиль</div></div>
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#fff' }}>
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{user?.role === 'admin' ? 'Администратор' : 'Сотрудник'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="ph"><div className="pt">Сменить пароль</div></div>
        <div style={{ padding: 18 }}>
          {err && <div style={{ background: '#fdeaea', color: 'var(--red)', padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{err}</div>}
          {msg && <div style={{ background: '#e4f5ec', color: '#1a7a45', padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{msg}</div>}
          <form onSubmit={changePassword}>
            <div className="fg">
              <label>Текущий пароль</label>
              <input type="password" value={cur} onChange={e => setCur(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="fg">
              <label>Новый пароль</label>
              <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Минимум 6 символов" required />
            </div>
            <div className="fg">
              <label>Повторите новый пароль</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
