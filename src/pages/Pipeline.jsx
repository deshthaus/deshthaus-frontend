import { useState, useEffect } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const STAGE_COLORS = { 'Обращение': '#b0aaa0', 'Переговоры': '#9ab0d8', 'КП отправлено': '#1a1f5e', 'Договор': '#e8401c' }
const STAGE_PCT = { 'Обращение': 100, 'Переговоры': 70, 'КП отправлено': 45, 'Договор': 20 }
const SM = { Дизайн: 'st-d', Строительство: 'st-b', Завершён: 'st-c', Пауза: 'st-p', Обращение: 'st-d', Переговоры: 'st-b', 'КП отправлено': 'st-p', Договор: 'st-c' }

export default function Pipeline() {
  const [deals, setDeals] = useState([])
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/finance/deals'); setDeals(r.data) }

  const stages = ['Обращение', 'Переговоры', 'КП отправлено', 'Договор']
  const byStage = s => deals.filter(d => d.stage === s)

  return (
    <div>
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph"><div className="pt">Воронка продаж</div></div>
        <div style={{ padding: 14 }}>
          <div className="stages">
            {stages.map(s => (
              <div key={s} className="stage">
                <div className="st-l">{s}</div>
                <div className="st-c">{byStage(s).length}</div>
                <div className="st-a">{byStage(s).length} сделок</div>
                <div className="st-bar"><div className="st-fill" style={{ width: `${STAGE_PCT[s]}%`, background: STAGE_COLORS[s] }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="btn" onClick={() => setModal({ type: 'deal', onSaved: () => { setModal(null); load() } })}><i className="ti ti-plus" /> Новая сделка</button>
      </div>
      <div className="panel">
        <div className="ph"><div className="pt">Сделки ({deals.length})</div></div>
        {deals.map(d => (
          <div key={d.id} className="pr" onClick={() => setModal({ type: 'deal', data: d, onSaved: () => { setModal(null); load() } })}>
            <div className="pc-bar" style={{ background: STAGE_COLORS[d.stage] || '#1a1f5e' }} />
            <div className="pi"><div className="pn">{d.name}</div><div className="pcl">{d.client_name || '—'}</div></div>
            <span className={`ps-tag ${SM[d.stage] || 'st-d'}`}>{d.stage}</span>
            <div className="pb">{d.amount} ₸</div>
          </div>
        ))}
        {deals.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет сделок</div>}
      </div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
