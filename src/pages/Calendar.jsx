import { useState, useEffect } from 'react'
import api from '../api'

const MONTHS = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ','ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ']
const WDAYS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState({})
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', date: '', type: 'custom' })
  const [customEvents, setCustomEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cal_events') || '[]') } catch { return [] }
  })

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    const evMap = {}
    const add = (date, text, cls) => {
      if (!date) return
      const key = date.slice(0, 10)
      if (!evMap[key]) evMap[key] = []
      evMap[key].push({ t: text, cls })
    }

    try {
      // Дедлайны проектов
      const { data: projects } = await api.get('/projects')
      projects.forEach(p => { if (p.deadline) add(p.deadline, p.name, 'er') })

      // Задачи из этапов
      for (const proj of projects) {
        try {
          const { data: stages } = await api.get(`/stages/project/${proj.id}`)
          stages.forEach(stage => {
            stage.tasks.forEach(t => { if (t.due) add(t.due, t.text, 'eb') })
            stage.substages.forEach(sub => sub.tasks.forEach(t => { if (t.due) add(t.due, t.text, 'eb') }))
          })
        } catch {}
      }

      // Обычные задачи
      const { data: tasks } = await api.get('/tasks')
      tasks.forEach(t => { if (t.due) add(t.due, t.text, 'eb') })
    } catch {}

    // Пользовательские события
    customEvents.forEach(e => add(e.date, e.title, 'eg'))

    setEvents(evMap)
  }

  function chMonth(d) {
    let m = month + d, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  function saveEvent() {
    if (!form.title || !form.date) return
    const updated = [...customEvents, { ...form, id: Date.now() }]
    setCustomEvents(updated)
    localStorage.setItem('cal_events', JSON.stringify(updated))
    setModal(null)
    setForm({ title: '', date: '', type: 'custom' })
    loadEvents()
  }

  function deleteCustomEvent(id) {
    const updated = customEvents.filter(e => e.id !== id)
    setCustomEvents(updated)
    localStorage.setItem('cal_events', JSON.stringify(updated))
    loadEvents()
  }

  const today = new Date()
  const first = new Date(year, month, 1)
  let sd = first.getDay(); sd = sd === 0 ? 6 : sd - 1
  const dim = new Date(year, month + 1, 0).getDate()
  const pd = new Date(year, month, 0).getDate()

  const days = []
  for (let i = 0; i < sd; i++) days.push({ n: pd - sd + 1 + i, other: true })
  for (let d = 1; d <= dim; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    days.push({ n: d, isToday, key, evs: events[key] || [] })
  }
  const rem = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let i = 1; i <= rem; i++) days.push({ n: i, other: true })

  // Все события месяца
  const monthEvents = days.filter(d => !d.other && d.evs?.length > 0)

  return (
    <div>
      <div className="cal" style={{ marginBottom: 14 }}>
        <div className="cal-head">
          <div className="cal-m">{MONTHS[month]} {year}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="cal-nav">
              <button className="cal-nb" onClick={() => chMonth(-1)}>←</button>
              <button className="cal-nb" onClick={() => chMonth(1)}>→</button>
            </div>
            <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => { setModal(true); setForm({ title: '', date: `${year}-${String(month+1).padStart(2,'0')}-01`, type: 'custom' }) }}>
              <i className="ti ti-plus" /> Событие
            </button>
          </div>
        </div>
        <div className="cgrid">
          {WDAYS.map(d => <div key={d} className="cdh">{d}</div>)}
          {days.map((d, i) => (
            <div key={i} className={`cd${d.isToday ? ' today' : ''}${d.other ? ' om' : ''}`}>
              <div className="cd-n">{d.n}</div>
              {(d.evs || []).slice(0, 2).map((e, j) => (
                <div key={j} className={`cev ${e.cls}`} title={e.t}>{e.t}</div>
              ))}
              {(d.evs || []).length > 2 && <div className="cev" style={{ background: 'var(--border)', color: 'var(--muted)' }}>+{d.evs.length - 2}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 12, height: 12, background: '#fde8e4' }} /> Дедлайн проекта
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 12, height: 12, background: '#dde8fa' }} /> Задача
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 12, height: 12, background: '#e2f5e8' }} /> Событие
        </div>
      </div>

      {/* Список событий месяца */}
      {monthEvents.length > 0 && (
        <div className="panel">
          <div className="ph"><div className="pt">События месяца</div></div>
          {monthEvents.map((d, i) => (
            <div key={i}>
              {d.evs.map((e, j) => (
                <div key={j} className="fr" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{e.t}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {String(d.n).padStart(2,'0')}.{String(month+1).padStart(2,'0')}.{year}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`cev ${e.cls}`} style={{ fontSize: 9, padding: '2px 6px' }}>
                      {e.cls === 'er' ? 'Дедлайн' : e.cls === 'eb' ? 'Задача' : 'Событие'}
                    </span>
                    {e.cls === 'eg' && (
                      <button className="btn-danger" style={{ padding: '2px 6px', fontSize: 11 }}
                        onClick={() => { const ev = customEvents.find(x => x.title === e.t); if(ev) deleteCustomEvent(ev.id) }}>
                        <i className="ti ti-trash" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal добавления события */}
      {modal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mh">
              <div className="mh-title">Новое событие</div>
              <button className="mclose" onClick={() => setModal(null)}><i className="ti ti-x" /></button>
            </div>
            <div className="mb">
              <div className="fg"><label>Название *</label><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Встреча с клиентом" /></div>
              <div className="fg"><label>Дата *</label><input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></div>
            </div>
            <div className="mf">
              <button className="btn-sec" onClick={() => setModal(null)}>Отмена</button>
              <button className="btn" onClick={saveEvent}><i className="ti ti-check" /> Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
