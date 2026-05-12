import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const SM = { Дизайн: 'st-d', Строительство: 'st-b', Завершён: 'st-c', Пауза: 'st-p' }
const today = new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [finance, setFinance] = useState({ income: 0, expense: 0, profit: 0 })
  const [clients, setClients] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {})
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {})
    api.get('/clients').then(r => setClients(r.data)).catch(() => {})
    if (isAdmin) api.get('/finance').then(r => setFinance(r.data)).catch(() => {})
  }, [])

  async function toggleTask(id, done) {
    await api.patch(`/tasks/${id}/toggle`)
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: done ? 0 : 1 } : t))
  }

  const fmt = n => Number(n).toLocaleString('ru')
  const active = projects.filter(p => p.status !== 'Завершён')
  const pendingTasks = tasks.filter(t => !t.done)

  return (
    <div>
      <div className="kpi">
        {isAdmin && (
          <div className="kc red"><div className="kl">Чистая прибыль</div><div className="kv">{fmt(finance.profit)}</div><div className="ks">тенге</div></div>
        )}
        <div className="kc"><div className="kl">Активных проектов</div><div className="kv">{active.length}</div><div className="ks">из {projects.length} всего</div></div>
        <div className="kc"><div className="kl">Клиентов</div><div className="kv">{clients.length}</div><div className="ks">в базе</div></div>
        <div className="kc"><div className="kl">Задач открыто</div><div className="kv">{pendingTasks.length}</div><div className="ks">{pendingTasks.filter(t => t.due && t.due < today).length > 0 ? <span className="dn">⚠ просроченные</span> : 'в работе'}</div></div>
      </div>
      <div className="two">
        <div className="panel">
          <div className="ph"><div className="pt">Активные проекты</div><button className="pa" onClick={() => navigate('/projects')}>Все →</button></div>
          {projects.slice(0, 5).map(p => (
            <div key={p.id} className="pr" onClick={() => navigate('/projects')}>
              <div className="pc-bar" style={{ background: p.color }} />
              <div className="pi"><div className="pn">{p.name}</div><div className="pcl">{p.client_name || '—'}</div></div>
              <span className={`ps-tag ${SM[p.status] || ''}`} style={{ fontSize: 10, padding: '2px 7px' }}>{p.status}</span>
              <div className="pb">{p.budget} ₸</div>
            </div>
          ))}
          {projects.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет проектов</div>}
        </div>
        <div className="panel">
          <div className="ph"><div className="pt">Задачи</div><button className="pa" onClick={() => navigate('/tasks')}>Все →</button></div>
          {tasks.slice(0, 6).map(t => (
            <div key={t.id} className="ti">
              <button className={`tc${t.done ? ' done' : ''}`} onClick={() => toggleTask(t.id, t.done)} />
              <div style={{ flex: 1 }}>
                <div className={`tt${t.done ? ' dt' : ''}`}>{t.text}</div>
                <div className={`td${t.due && t.due < today && !t.done ? ' ov' : ''}`}>{t.due && t.due < today && !t.done ? '⚠ просрочено · ' : ''}{t.due || ''}</div>
              </div>
              {t.priority === 'high' && <span className="tp-h">Срочно</span>}
              {t.priority === 'med' && <span className="tp-m">Средний</span>}
            </div>
          ))}
          {tasks.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет задач</div>}
        </div>
      </div>
    </div>
  )
}
