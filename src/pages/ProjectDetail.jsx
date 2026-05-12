import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const DEFAULT_STAGES = ['Дизайн', 'Строительство', 'Комплектация', 'Авторский надзор']
const DEFAULT_SUBSTAGES = {
  'Дизайн': ['ТЗ', 'Обмерный план', 'Визуализация', 'Рабочий проект'],
  'Строительство': ['Черновые работы', 'Чистовые работы', 'Сантехника', 'Электрика'],
  'Комплектация': ['Мебель', 'Освещение', 'Декор'],
  'Авторский надзор': ['Выезд на объект', 'Контроль качества'],
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [project, setProject] = useState(null)
  const [stages, setStages] = useState([])
  const [users, setUsers] = useState([])
  const [expanded, setExpanded] = useState({})
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [selectedUsers, setSelectedUsers] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadProject(); loadStages(); loadUsers() }, [id])

  async function loadProject() {
    const { data } = await api.get('/projects')
    setProject(data.find(p => p.id === Number(id)))
  }
  async function loadStages() {
    const { data } = await api.get(`/stages/project/${id}`)
    setStages(data)
  }
  async function loadUsers() {
    try { const { data } = await api.get('/auth/users'); setUsers(data) } catch {}
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }))

  function toggleUser(u) {
    setSelectedUsers(prev =>
      prev.find(x => x.id === u.id)
        ? prev.filter(x => x.id !== u.id)
        : [...prev, { id: u.id, name: u.name }]
    )
  }

  function openEditTask(task, stage_id, substage_id) {
    setModal({ type: 'task', id: task.id, stage_id, substage_id })
    setForm({ text: task.text, priority: task.priority || 'med', due: task.due || '' })
    setSelectedUsers(task.assignees || (task.assigned_name ? [{ id: task.assigned_to, name: task.assigned_name }] : []))
  }

  async function save() {
    setErr(''); setLoading(true)
    try {
      if (modal.type === 'stage') {
        if (modal.id) await api.put(`/stages/${modal.id}`, form)
        else await api.post('/stages', { ...form, project_id: id })
      } else if (modal.type === 'substage') {
        if (modal.id) await api.put(`/stages/substage/${modal.id}`, form)
        else await api.post('/stages/substage', { ...form, project_id: id, stage_id: modal.stage_id })
      } else if (modal.type === 'task') {
        if (modal.id) {
          await api.put(`/stages/task/${modal.id}`, { ...form, assignees: selectedUsers })
        } else {
          await api.post('/stages/task', { ...form, project_id: id, stage_id: modal.stage_id, substage_id: modal.substage_id || null, assignees: selectedUsers })
        }
      }
      await loadStages(); setModal(null); setForm({}); setSelectedUsers([])
    } catch (e) { setErr(e.response?.data?.error || 'Ошибка') }
    setLoading(false)
  }

  async function del(type, id2) {
    if (type === 'stage') await api.delete(`/stages/${id2}`)
    else if (type === 'substage') await api.delete(`/stages/substage/${id2}`)
    else if (type === 'task') await api.delete(`/stages/task/${id2}`)
    loadStages()
  }

  async function toggleTask(taskId) {
    await api.patch(`/stages/task/${taskId}/toggle`)
    loadStages()
  }

  async function addDefaults() {
    for (const sName of DEFAULT_STAGES) {
      const { data: stage } = await api.post('/stages', { project_id: id, name: sName, order_index: DEFAULT_STAGES.indexOf(sName) })
      const subs = DEFAULT_SUBSTAGES[sName] || []
      for (let i = 0; i < subs.length; i++) {
        await api.post('/stages/substage', { stage_id: stage.id, project_id: id, name: subs[i], order_index: i })
      }
    }
    loadStages()
  }

  if (!project) return <div style={{ padding: 20, color: 'var(--muted)' }}>Загрузка...</div>

  const totalTasks = stages.reduce((s, st) => s + st.tasks.length + st.substages.reduce((a, sb) => a + sb.tasks.length, 0), 0)
  const doneTasks = stages.reduce((s, st) => s + st.tasks.filter(t => t.done).length + st.substages.reduce((a, sb) => a + sb.tasks.filter(t => t.done).length, 0), 0)
  const totalProgress = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn-sec" style={{ padding: '6px 10px' }} onClick={() => navigate('/projects')}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, color: 'var(--navy)' }}>{project.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{project.client_name || '—'} · {project.status}</div>
        </div>
        {isAdmin && (
          <button className="btn" onClick={() => { setModal({ type: 'stage' }); setForm({ name: '' }) }}>
            <i className="ti ti-plus" /> Этап
          </button>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--navy)' }}>Общий прогресс</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif", color: 'var(--navy)' }}>{totalProgress}%</div>
        </div>
        <div style={{ height: 6, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalProgress}%`, background: totalProgress === 100 ? '#1a7a45' : 'var(--navy)', transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{doneTasks} из {totalTasks} задач выполнено</div>
      </div>

      {stages.length === 0 && (
        <div className="panel" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Этапы ещё не созданы</div>
          {isAdmin && <button className="btn" onClick={addDefaults}><i className="ti ti-template" /> Добавить стандартные этапы</button>}
        </div>
      )}

      {stages.map(stage => (
        <div key={stage.id} className="panel" style={{ marginBottom: 12 }}>
          <div style={{ padding: '12px 14px', borderBottom: expanded[`s${stage.id}`] ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => toggle(`s${stage.id}`)}>
            <i className={`ti ti-chevron-${expanded[`s${stage.id}`] ? 'down' : 'right'}`} style={{ color: 'var(--muted)', fontSize: 14 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{stage.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stage.progress}%`, background: stage.progress === 100 ? '#1a7a45' : 'var(--red)', transition: 'width .3s' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{stage.progress}%</span>
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <button className="btn-sec" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => { setModal({ type: 'substage', stage_id: stage.id }); setForm({ name: '' }) }}>
                  <i className="ti ti-plus" /> Подэтап
                </button>
                <button className="btn-sec" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => { setModal({ type: 'task', stage_id: stage.id }); setForm({ text: '', priority: 'med' }); setSelectedUsers([]) }}>
                  <i className="ti ti-checkbox" /> Задача
                </button>
                <button className="btn-danger" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => { if (confirm(`Удалить этап «${stage.name}»?`)) del('stage', stage.id) }}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            )}
          </div>

          {expanded[`s${stage.id}`] && (
            <div>
              {stage.tasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={t => del('task', t)} onEdit={t => openEditTask(t, stage.id, null)} isAdmin={isAdmin} />
              ))}
              {stage.substages.map(sub => (
                <div key={sub.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <div style={{ padding: '10px 14px 10px 28px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#fafaf8' }} onClick={() => toggle(`sb${sub.id}`)}>
                    <i className={`ti ti-chevron-${expanded[`sb${sub.id}`] ? 'down' : 'right'}`} style={{ color: 'var(--muted)', fontSize: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{sub.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <div style={{ flex: 1, height: 2, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${sub.progress}%`, background: sub.progress === 100 ? '#1a7a45' : 'var(--navy)' }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{sub.progress}%</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-sec" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => { setModal({ type: 'task', stage_id: stage.id, substage_id: sub.id }); setForm({ text: '', priority: 'med' }); setSelectedUsers([]) }}>
                          <i className="ti ti-plus" /> Задача
                        </button>
                        <button className="btn-danger" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => { if (confirm(`Удалить «${sub.name}»?`)) del('substage', sub.id) }}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    )}
                  </div>
                  {expanded[`sb${sub.id}`] && (
                    <div>
                      {sub.tasks.map(task => (
                        <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={t => del('task', t)} onEdit={t => openEditTask(t, stage.id, sub.id)} isAdmin={isAdmin} indent />
                      ))}
                      {sub.tasks.length === 0 && <div style={{ padding: '8px 14px 8px 42px', fontSize: 11, color: 'var(--muted)' }}>Нет задач</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {modal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mh">
              <div className="mh-title">
                {modal.type === 'stage' ? (modal.id ? 'Редактировать этап' : 'Новый этап') :
                 modal.type === 'substage' ? 'Новый подэтап' :
                 modal.id ? 'Редактировать задачу' : 'Новая задача'}
              </div>
              <button className="mclose" onClick={() => setModal(null)}><i className="ti ti-x" /></button>
            </div>
            <div className="mb">
              {err && <div style={{ background: '#fdeaea', color: 'var(--red)', padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{err}</div>}
              {(modal.type === 'stage' || modal.type === 'substage') && (
                <div className="fg"><label>Название *</label><input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder={modal.type === 'stage' ? 'Дизайн' : 'ТЗ'} /></div>
              )}
              {modal.type === 'task' && (
                <>
                  <div className="fg"><label>Задача *</label><input value={form.text || ''} onChange={e => set('text', e.target.value)} placeholder="Описание задачи..." /></div>
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
                  <div className="fg">
                    <label>Исполнители</label>
                    <div style={{ border: '1px solid var(--border)', padding: 8 }}>
                      {users.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', cursor: 'pointer' }} onClick={() => toggleUser(u)}>
                          <div style={{ width: 16, height: 16, border: `1.5px solid ${selectedUsers.find(x => x.id === u.id) ? 'var(--navy)' : 'var(--border)'}`, background: selectedUsers.find(x => x.id === u.id) ? 'var(--navy)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selectedUsers.find(x => x.id === u.id) && <span style={{ fontSize: 10, color: '#fff' }}>✓</span>}
                          </div>
                          <div style={{ width: 24, height: 24, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13 }}>{u.name}</span>
                        </div>
                      ))}
                    </div>
                    {selectedUsers.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--navy)' }}>Выбрано: {selectedUsers.map(u => u.name).join(', ')}</div>}
                  </div>
                </>
              )}
            </div>
            <div className="mf">
              <button className="btn-sec" onClick={() => setModal(null)}>Отмена</button>
              <button className="btn" onClick={save} disabled={loading}><i className="ti ti-check" /> {loading ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete, onEdit, isAdmin, indent }) {
  const today = new Date().toISOString().slice(0, 10)
  const assignees = task.assignees || (task.assigned_name ? [{ name: task.assigned_name }] : [])
  return (
    <div className="ti" style={{ paddingLeft: indent ? 42 : 28, borderTop: '1px solid var(--border)' }}>
      <button className={`tc${task.done ? ' done' : ''}`} onClick={() => onToggle(task.id)} />
      <div style={{ flex: 1 }}>
        <div className={`tt${task.done ? ' dt' : ''}`}>{task.text}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {task.due && <span className={`td${task.due < today && !task.done ? ' ov' : ''}`}>{task.due < today && !task.done ? '⚠ ' : ''}{task.due.split('-').reverse().join('.')}</span>}
          {assignees.map((a, i) => <span key={i} style={{ fontSize: 10, color: 'var(--navy)', background: '#eef0fa', padding: '1px 6px' }}>{a.name}</span>)}
        </div>
      </div>
      {task.priority === 'high' && <span className="tp-h">Срочно</span>}
      {task.priority === 'med' && <span className="tp-m">Средний</span>}
      {isAdmin && <>
        <button className="btn-sec" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => onEdit(task)}>
          <i className="ti ti-pencil" />
        </button>
        <button className="btn-danger" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => onDelete(task.id)}>
          <i className="ti ti-trash" />
        </button>
      </>}
    </div>
  )
}
