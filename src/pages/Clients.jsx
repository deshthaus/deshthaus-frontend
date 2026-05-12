import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Modal from '../components/Modal'

export default function Clients() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/clients'); setClients(r.data) }

  function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }

  async function del(e, id, name) {
    e.stopPropagation()
    if (!confirm(`Удалить клиента «${name}»?`)) return
    await api.delete(`/clients/${id}`)
    setClients(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="cg">
        {clients.map(c => (
          <div key={c.id} className="cc" style={{ position: 'relative' }} onClick={() => isAdmin && setModal({ type: 'client', data: c, onSaved: () => { setModal(null); load() } })}>
            {isAdmin && (
              <button
                className="btn-danger"
                style={{ position: 'absolute', top: 8, right: 8, padding: '3px 6px', fontSize: 11 }}
                onClick={e => del(e, c.id, c.name)}
              >
                <i className="ti ti-trash" />
              </button>
            )}
            <div className="c-av" style={{ background: c.color || '#1a1f5e' }}>{initials(c.name)}</div>
            <div className="c-name">{c.name}</div>
            <div className="c-type">{c.type}</div>
            {c.phone && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{c.phone}</div>}
            {isAdmin && c.budget > 0 && <>
              <div className="c-bar"><div className="c-fill" style={{ width: `${Math.min(100, Math.round(c.budget / (c.budget_max || c.budget) * 100))}%` }} /></div>
              <div className="c-amt"><span>{c.budget} M ₸</span>{c.budget_max > 0 && <span>из {c.budget_max} M</span>}</div>
            </>}
          </div>
        ))}
        {clients.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)' }}>Нет клиентов. Добавьте первого!</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
