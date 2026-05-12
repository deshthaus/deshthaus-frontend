import { useState, useEffect } from 'react'
import api from '../api'
import Modal from '../components/Modal'

export default function Finance() {
  const [data, setData] = useState({ rows: [], income: 0, expense: 0, profit: 0 })
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/finance'); setData(r.data) }

  async function del(id, label) {
    if (!confirm(`Удалить транзакцию «${label}»?`)) return
    await api.delete(`/finance/${id}`)
    load()
  }

  const fmt = n => Number(Math.abs(n)).toLocaleString('ru')

  return (
    <div>
      <div className="kpi">
        <div className="kc red"><div className="kl">Доходы</div><div className="kv">{fmt(data.income)}</div><div className="ks">тенге</div></div>
        <div className="kc"><div className="kl">Расходы</div><div className="kv">{fmt(data.expense)}</div><div className="ks">тенге</div></div>
        <div className="kc"><div className="kl">Чистая прибыль</div><div className="kv">{fmt(data.profit)}</div><div className="ks">{data.profit >= 0 ? <span className="up">↑</span> : <span className="dn">↓</span>} тенге</div></div>
        <div className="kc"><div className="kl">Транзакций</div><div className="kv">{data.rows?.length || 0}</div><div className="ks">всего</div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="btn" onClick={() => setModal({ type: 'finance', onSaved: () => { setModal(null); load() } })}><i className="ti ti-plus" /> Добавить транзакцию</button>
      </div>
      <div className="panel">
        <div className="ph"><div className="pt">Транзакции</div></div>
        {(data.rows || []).map(r => (
          <div key={r.id} className="fr">
            <div>
              <div className="fr-l">{r.label}</div>
              {r.project_name && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{r.project_name}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`fr-v${r.amount >= 0 ? ' inc' : ' exp'}`}>{r.amount >= 0 ? '+' : '−'}{fmt(r.amount)} ₸</div>
              <button className="btn-danger" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => del(r.id, r.label)}>
                <i className="ti ti-trash" />
              </button>
            </div>
          </div>
        ))}
        {(!data.rows || data.rows.length === 0) && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет транзакций</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
