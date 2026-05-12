import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Team() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', password: '', role: 'member' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    try { const r = await api.get('/auth/users'); setMembers(r.data) } catch {}
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setErr(''); setLoading(true)
    try {
      if (modal === 'add') {
        await api.post('/auth/users', form)
        showToast('Пользователь добавлен')
      } else {
        await api.put(`/auth/users/${modal.id}`, form)
        showToast('Сохранено')
      }
      setModal(null); setForm({ name: '', password: '', role: 'member' }); load()
    } catch (e) { setErr(e.response?.data?.error || 'Ошибка') }
    setLoading(false)
  }

  async function del(id, name) {
    if (!confirm(`Удалить ${name}?`)) return
    await api.delete(`/auth/users/${id}`)
    load(); showToast('Удалено')
  }

  function openEdit(m) {
    setForm({ name: m.name, password: '', role: m.role })
    setModal(m); setErr('')
  }

  if (user?.role !== 'admin') return (
    <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
      Только администратор может управлять командой
    </div>
  )

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn" onClick={() => { setModal('add'); setForm({ name: '', password: '', role: 'member' }); setErr('') }}>
          <i className="ti ti-plus" /> Добавить сотрудника
        </button>
      </div>
      <div className="panel">
        {members.map(m => (
          <div key={m.id} className="pr">
            <div style={{ width: 36, height: 36, background: m.role === 'admin' ? 'var(--red)' : 'var(--navy)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>
              {m.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="pi">
              <div className="pn">{m.name} {m.id === user.id && <span style={{ fontSize: 10, color: 'var(--muted)' }}>(вы)</span>}</div>
              <div className="pcl">{m.role === 'admin' ? 'Администратор' : 'Сотрудник'}</div>
            </div>
            <button className="btn-sec" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => openEdit(m)}>
              <i className="ti ti-pencil" /> Изменить
            </button>
            {m.id !== user.id && (
              <button className="btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => del(m.id, m.name)}>
                <i className="ti ti-trash" />
              </button>
            )}
          </div>
        ))}
        {members.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет сотрудников</div>}
      </div>

      {modal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mh">
              <div className="mh-title">{modal === 'add' ? 'Новый сотрудник' : 'Редактировать'}</div>
              <button className="mclose" onClick={() => setModal(null)}><i className="ti ti-x" /></button>
            </div>
            <div className="mb">
              {err && <div style={{ background: '#fdeaea', color: 'var(--red)', padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{err}</div>}
              <div className="fg"><label>Имя *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Аят" /></div>
              <div className="fg">
                <label>{modal === 'add' ? 'Пароль *' : 'Новый пароль (оставьте пустым чтобы не менять)'}</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Минимум 4 символа" />
              </div>
              <div className="fg"><label>Роль</label>
                <select value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="member">Сотрудник</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            <div className="mf">
              <button className="btn-sec" onClick={() => setModal(null)}>Отмена</button>
              <button className="btn" onClick={save} disabled={loading}><i className="ti ti-check" /> {loading ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast show ok">{toast}</div>}
    </div>
  )
}
