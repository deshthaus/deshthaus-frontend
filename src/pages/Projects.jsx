import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Modal from '../components/Modal'

const SM = { Дизайн: 'st-d', Строительство: 'st-b', Завершён: 'st-c', Пауза: 'st-p', Комплектация: 'st-d', 'Авторский надзор': 'st-b' }
const FILTERS = ['all', 'Дизайн', 'Строительство', 'Комплектация', 'Авторский надзор', 'Завершён', 'Пауза']
const LABELS = { all: 'Все', Дизайн: 'Дизайн', Строительство: 'Строительство', Комплектация: 'Комплектация', 'Авторский надзор': 'Надзор', Завершён: 'Завершены', Пауза: 'Пауза' }

export default function Projects() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/projects'); setProjects(r.data) }

  async function del(id, name) {
    if (!confirm(`Удалить проект «${name}»?`)) return
    await api.delete(`/projects/${id}`)
    setProjects(ps => ps.filter(p => p.id !== id))
  }

  const list = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  return (
    <div>
      <div className="tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {FILTERS.map(f => <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ whiteSpace: 'nowrap' }}>{LABELS[f]}</button>)}
      </div>
      <div className="panel">
        {list.map(p => (
          <div key={p.id} className="pr" onClick={() => navigate(`/projects/${p.id}`)}>
            <div className="pc-bar" style={{ background: p.color }} />
            <div className="pi"><div className="pn">{p.name}</div><div className="pcl">{p.client_name || '—'}</div></div>
            <span className={`ps-tag ${SM[p.status] || 'st-d'}`} style={{ fontSize: 10, padding: '2px 7px' }}>{p.status}</span>
            {isAdmin && <div className="pb">{p.budget} ₸</div>}
            {isAdmin && <>
              <button className="btn-sec" style={{ padding: '4px 8px', fontSize: 11 }} onClick={e => { e.stopPropagation(); setModal({ type: 'project', data: p, onSaved: () => { setModal(null); load() } }) }}>
                <i className="ti ti-pencil" />
              </button>
              <button className="btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={e => { e.stopPropagation(); del(p.id, p.name) }}>
                <i className="ti ti-trash" />
              </button>
            </>}
            <i className="ti ti-chevron-right" style={{ color: 'var(--muted)', fontSize: 14 }} />
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет проектов</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
