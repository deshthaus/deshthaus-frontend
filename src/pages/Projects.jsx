// Projects.jsx
import { useState, useEffect } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const SM = { Дизайн: 'st-d', Строительство: 'st-b', Завершён: 'st-c', Пауза: 'st-p' }
const FILTERS = ['all', 'Дизайн', 'Строительство', 'Завершён', 'Пауза']
const LABELS = { all: 'Все', Дизайн: 'Дизайн', Строительство: 'Строительство', Завершён: 'Завершены', Пауза: 'Пауза' }

export function Projects() {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/projects'); setProjects(r.data) }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const list = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  return (
    <div>
      <div className="tabs">
        {FILTERS.map(f => <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{LABELS[f]}</button>)}
      </div>
      <div className="panel">
        {list.map(p => (
          <div key={p.id} className="pr">
            <div className="pc-bar" style={{ background: p.color }} />
            <div className="pi"><div className="pn">{p.name}</div><div className="pcl">{p.client_name || '—'}</div></div>
            <span className={`ps-tag ${SM[p.status] || ''}`}>{p.status}</span>
            <div className="pb">{p.budget} ₸</div>
            <button className="btn-sec" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setModal({ type: 'project', data: p, onSaved: () => { setModal(null); load(); showToast('Сохранено') } })}>
              <i className="ti ti-pencil" />
            </button>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет проектов в этой категории</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
      {toast && <div className="toast show ok">{toast}</div>}
    </div>
  )
}

export default Projects
