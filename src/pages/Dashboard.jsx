import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const SM = { Дизайн: 'st-d', Строительство: 'st-b', Завершён: 'st-c', Пауза: 'st-p', Комплектация: 'st-d', 'Авторский надзор': 'st-b' }
const today = new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [stageTasks, setStageTasks] = useState([])
  const [finance, setFinance] = useState({ income: 0, expense: 0, profit: 0 })
  const [clients, setClients] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/projects').then(r => {
      setProjects(r.data)
      // Загрузить задачи всех проектов из этапов
      Promise.all(r.data.map(p => api.get(`/stages/project/${p.id}`))).then(results => {
        const all = []
        results.forEach((res, i) => {
          const proj = r.data[i]
          res.data.forEach(stage => {
            stage.tasks.forEach(t => all.push({ ...t, project_name: proj.name, project_id: proj.id }))
            stage.substages.forEach(sub => sub.tasks.forEach(t => all.push({ ...t, project_name: proj.name, project_id: proj.id })))
          })
        })
        setStageTasks(all)
      })
    }).catch(() => {})
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {})
    api.get('/clients').then(r => setClients(r.data)).catch(() => {})
    if (isAdmin) api.get('/finance').then(r => setFinance(r.data)).catch(() => {})
  }, [])

  async function toggleRegularTask(id, done) {
    await api.patch(`/tasks/${id}/toggle`)
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: done ? 0 : 1 } : t))
  }

  async function toggleStageTask(id, done) {
    await api.patch(`/stages/task/${id}/toggle`)
    setStageTasks(ts => ts.map(t => t.id === id ? { ...t, done: !done } : t))
  }

  const fmt = n => Number(n).toLocaleString('ru')
  const active = projects.filter(p => p.status !== 'Завершён')
  const pendingTasks = tasks.filter(t => !t.done)

  // Задачи из этапов для текущего пользователя
  const myTasks = stageTasks.filter(t =>
    !t.done && (
      isAdmin ||
      (t.assignees && t.assignees.some(a => a.id === user?.id)) ||
      t.assigned_to === user?.id
    )
  ).slice(0, 6)

  return (
    <div>
      <div className="kpi">
        {isAdmin && (
          <div className="kc red"><div className="kl">Чистая прибыль</div><div className="kv">{fmt(finance.profit)}</div><div className="ks">тенге</div></div>
        )}
        <div className="kc"><div className="kl">Активных проектов</div><div className="kv">{active.length}</div><div className="ks">из {projects.length} всего</div></div>
        <div className="kc"><div className="kl">Клиентов</div><div className="kv">{clients.length}</div><div className="ks">в базе</div></div>
        <div className="kc"><div className="kl">Задач открыто</div><div className="kv">{stageTasks.filter(t => !t.done).length + pendingTasks.length}</div>
          <div className="ks">{stageTasks.filter(t => !t.done && t.due && t.due < today).length > 0 ? <span className="dn">⚠ просроченные</span> : 'в работе'}</div>
        </div>
      </div>
      <div className="two">
        <div className="panel">
          <div className="ph"><div className="pt">Активные проекты</div><button className="pa" onClick={() => navigate('/projects')}>Все →</button></div>
          {projects.slice(0, 5).map(p => (
            <div key={p.id} className="pr" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="pc-bar" style={{ background: p.color }} />
              <div className="pi"><div className="pn">{p.name}</div><div className="pcl">{p.client_name || '—'}</div></div>
              <span className={`ps-tag ${SM[p.status] || 'st-d'}`} style={{ fontSize: 10, padding: '2px 7px' }}>{p.status}</span>
              {isAdmin && <div className="pb">{p.budget} ₸</div>}
            </div>
          ))}
          {projects.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет проектов</div>}
        </div>
        <div className="panel">
          <div className="ph"><div className="pt">Задачи</div><button className="pa" onClick={() => navigate('/tasks')}>Все →</button></div>
          {myTasks.map(t => (
            <div key={t.id} className="ti">
              <button className={`tc${t.done ? ' done' : ''}`} onClick={() => toggleStageTask(t.id, t.done)} />
              <div style={{ flex: 1 }}>
                <div className="tt">{t.text}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                  {t.due && <span className={`td${t.due < today ? ' ov' : ''}`}>{t.due < today ? '⚠ ' : ''}{t.due.split('-').reverse().join('.')}</span>}
                  {t.project_name && <span style={{ fontSize: 10, color: 'var(--muted)' }}>• {t.project_name}</span>}
                </div>
              </div>
              {t.priority === 'high' && <span className="tp-h">Срочно</span>}
              {t.priority === 'med' && <span className="tp-m">Средний</span>}
            </div>
          ))}
          {tasks.filter(t => !t.done).slice(0, Math.max(0, 6 - myTasks.length)).map(t => (
            <div key={t.id} className="ti">
              <button className={`tc${t.done ? ' done' : ''}`} onClick={() => toggleRegularTask(t.id, t.done)} />
              <div style={{ flex: 1 }}>
                <div className={`tt${t.done ? ' dt' : ''}`}>{t.text}</div>
                <div className={`td${t.due && t.due < today && !t.done ? ' ov' : ''}`}>{t.due || ''}</div>
              </div>
              {t.priority === 'high' && <span className="tp-h">Срочно</span>}
              {t.priority === 'med' && <span className="tp-m">Средний</span>}
            </div>
          ))}
          {myTasks.length === 0 && pendingTasks.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет задач</div>
          )}
        </div>
      </div>
    </div>
  )
}
