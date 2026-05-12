import { useState } from 'react'

const MONTHS = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ','ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ']
const WDAYS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  function chMonth(d) {
    let m = month + d, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const today = new Date()
  const first = new Date(year, month, 1)
  let sd = first.getDay(); sd = sd === 0 ? 6 : sd - 1
  const dim = new Date(year, month + 1, 0).getDate()
  const pd = new Date(year, month, 0).getDate()

  const days = []
  for (let i = 0; i < sd; i++) days.push({ n: pd - sd + 1 + i, other: true })
  for (let d = 1; d <= dim; d++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    days.push({ n: d, isToday })
  }
  const rem = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let i = 1; i <= rem; i++) days.push({ n: i, other: true })

  return (
    <div className="cal">
      <div className="cal-head">
        <div className="cal-m">{MONTHS[month]} {year}</div>
        <div className="cal-nav">
          <button className="cal-nb" onClick={() => chMonth(-1)}>←</button>
          <button className="cal-nb" onClick={() => chMonth(1)}>→</button>
        </div>
      </div>
      <div className="cgrid">
        {WDAYS.map(d => <div key={d} className="cdh">{d}</div>)}
        {days.map((d, i) => (
          <div key={i} className={`cd${d.isToday ? ' today' : ''}${d.other ? ' om' : ''}`}>
            <div className="cd-n">{d.n}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
