import { useState, useEffect } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const today = new Date().toISOString().slice(0, 10)

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/tasks'); setTasks(r.data) }

  async function toggle(id, done) {
    await api.patch(`/tasks/${id}/toggle`)
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !done } : t))
  }

  async function del(id, text) {
    if (!confirm(`Удалить задачу «${text}»?`)) return
    await api.delete(`/tasks/${id}`)
    setTasks(ts => ts.filter(t => t.id !== id))
  }

  const list = tasks.filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done)

  return (
    <div>
      <div className="tabs">
        {[['all', 'Все'], ['pending', 'Активные'], ['done', 'Выполнены']].map(([v, l]) => (
          <button key={v} className={`tab${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="panel">
        {list.map(t => (
          <div key={t.id} className="ti">
            <button className={`tc${t.done ? ' done' : ''}`} onClick={() => toggle(t.id, t.done)} />
            <div style={{ flex: 1 }}>
              <div className={`tt${t.done ? ' dt' : ''}`}>{t.text}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                {t.due && <span className={`td${t.due < today && !t.done ? ' ov' : ''}`}>{t.due < today && !t.done ? '⚠ ' : ''}{t.due.split('-').reverse().join('.')}</span>}
                {t.project_name && <span style={{ fontSize: 10, color: 'var(--muted)' }}>• {t.project_name}</span>}
              </div>
            </div>
            {t.priority === 'high' && <span className="tp-h">Срочно</span>}
            {t.priority === 'med' && <span className="tp-m">Средний</span>}
            <button className="btn-sec" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => setModal({ type: 'task', data: t, onSaved: () => { setModal(null); load() } })}>
              <i className="ti ti-pencil" />
            </button>
            <button className="btn-danger" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => del(t.id, t.text)}>
              <i className="ti ti-trash" />
            </button>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет задач</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
