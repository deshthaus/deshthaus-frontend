import { useState, useEffect } from 'react'
import api from '../api'

const STATUS_OPTS = ['Дизайн', 'Строительство', 'Комплектация', 'Авторский надзор', 'Завершён', 'Пауза']
const STAGE_OPTS = ['Обращение', 'Переговоры', 'КП отправлено', 'Договор']
const COLORS = ['#1a1f5e', '#e8401c', '#2a8a5a', '#c07000', '#7a7a8c', '#5a2a8a']

export default function Modal({ type, data, onClose, onSaved }) {
  const [form, setForm] = useState(data || {})
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [files, setFiles] = useState([])

  const isEdit = !!data?.id
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (type === 'project' || type === 'deal') api.get('/clients').then(r => setClients(r.data)).catch(() => {})
    if (type === 'task' || type === 'finance') api.get('/projects').then(r => setProjects(r.data)).catch(() => {})
  }, [type])

  async function save() {
    setErr(''); setLoading(true)
    try {
      let result
      if (type === 'project') {
        result = isEdit
          ? await api.put(`/projects/${data.id}`, form)
          : await api.post('/projects', { color: COLORS[0], ...form })
        if (files.length) {
          const fd = new FormData()
          files.forEach(f => fd.append('files', f))
          fd.append('project_id', result.data.id)
          await api.post('/files/upload', fd)
        }
      } else if (type === 'client') {
        result = isEdit ? await api.put(`/clients/${data.id}`, form) : await api.post('/clients', form)
      } else if (type === 'task') {
        result = isEdit ? await api.put(`/tasks/${data.id}`, form) : await api.post('/tasks', form)
      } else if (type === 'deal') {
        result = isEdit ? await api.put(`/finance/deals/${data.id}`, form) : await api.post('/finance/deals', form)
      } else if (type === 'finance') {
        result = await api.post('/finance', form)
      }
      onSaved(result?.data)
    } catch (e) {
      setErr(e.response?.data?.error || 'Ошибка сохранения')
    } finally { setLoading(false) }
  }

  const titles = { project: isEdit ? 'Редактировать проект' : 'Новый проект', client: isEdit ? 'Редактировать клиента' : 'Новый клиент', task: isEdit ? 'Редактировать задачу' : 'Новая задача', deal: 'Новая сделка', finance: 'Транзакция' }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mh">
          <div className="mh-title">{titles[type]}</div>
          <button className="mclose" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="mb">
          {err && <div style={{ background: '#fdeaea', color: 'var(--red)', padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{err}</div>}

          {(type === 'project') && <>
            <div className="fg"><label>Название проекта *</label><input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Жилой комплекс..." /></div>
            <div className="fg-row">
              <div className="fg"><label>Клиент</label>
                <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value)}>
                  <option value="">— Выбрать —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="fg"><label>Статус</label>
                <select value={form.status || 'Дизайн'} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Бюджет (₸)</label><input value={form.budget || ''} onChange={e => set('budget', e.target.value)} placeholder="12 000 000" /></div>
              <div className="fg"><label>Дедлайн</label><input type="date" value={form.deadline || ''} onChange={e => set('deadline', e.target.value)} /></div>
            </div>
            <div className="fg"><label>Описание</label><textarea value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Краткое описание..." /></div>
            <div className="fg"><label>Файлы</label>
              <div className="file-drop" onClick={() => document.getElementById('modal-file-inp').click()}>
                <i className="ti ti-cloud-upload" />
                <p>Перетащите или <strong>выберите файлы</strong></p>
              </div>
              <input id="modal-file-inp" type="file" multiple style={{ display: 'none' }} onChange={e => setFiles(Array.from(e.target.files))} />
              {files.map((f, i) => <div key={i} className="fitem"><i className="ti ti-file" /><span className="fn">{f.name}</span><button className="btn-sec" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}>✕</button></div>)}
            </div>
          </>}

          {type === 'client' && <>
            <div className="fg-row">
              <div className="fg"><label>Имя / Название *</label><input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Аят Сақтаған" /></div>
              <div className="fg"><label>Тип</label>
                <select value={form.type || 'Частный'} onChange={e => set('type', e.target.value)}>
                  {['Частный', 'Корпоративный', 'Коммерческий'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Телефон</label><input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+7 701 ..." /></div>
              <div className="fg"><label>Email</label><input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@..." /></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Бюджет (млн ₸)</label><input type="number" value={form.budget || ''} onChange={e => set('budget', e.target.value)} placeholder="12" /></div>
              <div className="fg"><label>Макс. бюджет (млн)</label><input type="number" value={form.budget_max || ''} onChange={e => set('budget_max', e.target.value)} placeholder="30" /></div>
            </div>
            <div className="fg"><label>Примечания</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </>}

          {type === 'task' && <>
            <div className="fg"><label>Задача *</label><input value={form.text || ''} onChange={e => set('text', e.target.value)} placeholder="Подготовить смету..." /></div>
            <div className="fg-row">
              <div className="fg"><label>Дедлайн</label><input type="date" value={form.due || ''} onChange={e => set('due', e.target.value)} /></div>
              <div className="fg"><label>Приоритет</label>
                <select value={form.priority || 'med'} onChange={e => set('priority', e.target.value)}>
                  <option value="high">Срочно</option>
                  <option value="med">Средний</option>
                  <option value="">Низкий</option>
                </select>
              </div>
            </div>
            <div className="fg"><label>Проект</label>
              <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value)}>
                <option value="">— Без проекта —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </>}

          {type === 'deal' && <>
            <div className="fg"><label>Название *</label><input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Торговый центр..." /></div>
            <div className="fg-row">
              <div className="fg"><label>Клиент</label>
                <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value)}>
                  <option value="">— Выбрать —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="fg"><label>Стадия</label>
                <select value={form.stage || 'Обращение'} onChange={e => set('stage', e.target.value)}>
                  {STAGE_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="fg"><label>Сумма (₸)</label><input value={form.amount || ''} onChange={e => set('amount', e.target.value)} placeholder="9 000 000" /></div>
            <div className="fg"><label>Заметки</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </>}

          {type === 'finance' && <>
            <div className="fg"><label>Описание *</label><input value={form.label || ''} onChange={e => set('label', e.target.value)} placeholder="Nura — оплата этапа 2" /></div>
            <div className="fg-row">
              <div className="fg"><label>Сумма (₸) *</label><input type="number" value={form.amount || ''} onChange={e => set('amount', e.target.value)} placeholder="1 800 000" /></div>
              <div className="fg"><label>Тип</label>
                <select value={form.type || 'income'} onChange={e => set('type', e.target.value)}>
                  <option value="income">Доход</option>
                  <option value="expense">Расход</option>
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Дата</label><input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} /></div>
              <div className="fg"><label>Проект</label>
                <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value)}>
                  <option value="">— Без проекта —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </>}
        </div>
        <div className="mf">
          <button className="btn-sec" onClick={onClose}>Отмена</button>
          <button className="btn" onClick={save} disabled={loading}><i className="ti ti-check" /> {loading ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  )
}
