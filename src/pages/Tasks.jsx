import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Modal from '../components/Modal'

const today = new Date().toISOString().slice(0, 10)

export default function Tasks() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])         // обычные задачи
  const [stageTasks, setStageTasks] = useState([]) // задачи из этапов
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    // Обычные задачи
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {})
    // Задачи из этапов всех проектов
    api.get('/projects').then(async r => {
      const all = []
      for (const proj of r.data) {
        try {
          const { data: stages } = await api.get(`/stages/project/${proj.id}`)
          stages.forEach(stage => {
            stage.tasks.forEach(t => all.push({ ...t, _type: 'stage', project_name: proj.name, project_id: proj.id }))
            stage.substages.forEach(sub => sub.tasks.forEach(t => all.push({ ...t, _type: 'stage', project_name: proj.name, project_id: proj.id, substage_name: sub.name })))
          })
        } catch {}
      }
      setStageTasks(all)
    }).catch(() => {})
  }

  async function toggleTask(t) {
    if (t._type === 'stage') {
      await api.patch(`/stages/task/${t.id}/toggle`)
    } else {
      await api.patch(`/tasks/${t.id}/toggle`)
    }
    load()
  }

  async function delTask(t) {
    if (!confirm(`Удалить задачу?`)) return
    if (t._type === 'stage') await api.delete(`/stages/task/${t.id}`)
    else await api.delete(`/tasks/${t.id}`)
    load()
  }

  // Объединяем все задачи
  const regularTasks = tasks.map(t => ({ ...t, _type: 'regular' }))
  const allTasks = [...stageTasks, ...regularTasks]

  // Фильтр по роли — сотрудник видит только свои
  const visibleTasks = allTasks.filter(t => {
    if (isAdmin) return true
    if (t._type === 'stage') {
      return (t.assignees && t.assignees.some(a => a.id === user?.id)) || t.assigned_to === user?.id
    }
    return true
  })

  const filtered = visibleTasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  )

  return (
    <div>
      <div className="tabs">
        {[['all', 'Все'], ['pending', 'Активные'], ['done', 'Выполнены']].map(([v, l]) => (
          <button key={v} className={`tab${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="panel">
        {filtered.map(t => {
          const assignees = t.assignees || (t.assigned_name ? [{ name: t.assigned_name }] : [])
          return (
            <div key={`${t._type}-${t.id}`} className="ti">
              <button className={`tc${t.done ? ' done' : ''}`} onClick={() => toggleTask(t)} />
              <div style={{ flex: 1 }}>
                <div className={`tt${t.done ? ' dt' : ''}`}>{t.text}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  {t.due && <span className={`td${t.due < today && !t.done ? ' ov' : ''}`}>{t.due < today && !t.done ? '⚠ ' : ''}{t.due.split('-').reverse().join('.')}</span>}
                  {t.project_name && (
                    <span
                      style={{ fontSize: 10, color: 'var(--navy)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate(`/projects/${t.project_id}`)}
                    >• {t.project_name}</span>
                  )}
                  {t.substage_name && <span style={{ fontSize: 10, color: 'var(--muted)' }}>/ {t.substage_name}</span>}
                  {assignees.map((a, i) => <span key={i} style={{ fontSize: 10, color: 'var(--navy)', background: '#eef0fa', padding: '1px 6px' }}>{a.name}</span>)}
                </div>
              </div>
              {t.priority === 'high' && <span className="tp-h">Срочно</span>}
              {t.priority === 'med' && <span className="tp-m">Средний</span>}
              {isAdmin && t._type === 'regular' && (
                <button className="btn-sec" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => setModal({ type: 'task', data: t, onSaved: () => { setModal(null); load() } })}>
                  <i className="ti ti-pencil" />
                </button>
              )}
              {isAdmin && (
                <button className="btn-danger" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => delTask(t)}>
                  <i className="ti ti-trash" />
                </button>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет задач</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
