import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Modal from './Modal'

const NAV = [
  { to: '/', label: 'Дашборд', icon: 'ti-layout-dashboard', section: 'Главная' },
  { to: '/projects', label: 'Проекты', icon: 'ti-building', badge: 'proj' },
  { to: '/clients', label: 'Клиенты', icon: 'ti-users' },
  { to: '/files', label: 'Файлы', icon: 'ti-folder' },
  { to: '/calendar', label: 'Календарь', icon: 'ti-calendar' },
  { to: '/pipeline', label: 'Воронка', icon: 'ti-chart-dots', section: 'Продажи' },
  { to: '/finance', label: 'Финансы', icon: 'ti-coin' },
  { to: '/tasks', label: 'Задачи', icon: 'ti-checkbox', section: 'Задачи', badge: 'tasks' },
  { to: '/team', label: 'Команда', icon: 'ti-users-group', section: 'Аккаунт', adminOnly: true },
  { to: '/profile', label: 'Профиль', icon: 'ti-user' },
]
const TITLES = { '/': 'Дашборд', '/projects': 'Проекты', '/clients': 'Клиенты', '/files': 'Файлы', '/calendar': 'Календарь', '/pipeline': 'Воронка', '/finance': 'Финансы', '/tasks': 'Задачи', '/team': 'Команда', '/profile': 'Профиль' }
const ADD_LABELS = { '/': 'Новый проект', '/projects': 'Новый проект', '/clients': 'Новый клиент', '/tasks': 'Новая задача', '/pipeline': 'Новая сделка', '/finance': 'Транзакция' }

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [modal, setModal] = useState(null)
  const [badges, setBadges] = useState({ proj: 0, tasks: 0 })
  const toastRef = useRef()
  const path = location.pathname

  useEffect(() => { loadNotifs(); loadBadges() }, [])

  async function loadNotifs() {
    try { const { data } = await api.get('/notifications'); setNotifs(data) } catch {}
  }
  async function loadBadges() {
    try {
      const [p, t] = await Promise.all([api.get('/projects'), api.get('/tasks')])
      setBadges({ proj: p.data.length, tasks: t.data.filter(x => !x.done).length })
    } catch {}
  }

  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return }
    const q = searchQ.toLowerCase()
    async function run() {
      try {
        const [p, c, t] = await Promise.all([api.get('/projects'), api.get('/clients'), api.get('/tasks')])
        const res = [
          ...p.data.filter(x => x.name.toLowerCase().includes(q) || (x.client_name||'').toLowerCase().includes(q)).map(x => ({ type: 'Проект', name: x.name, sub: x.client_name, to: '/projects' })),
          ...c.data.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'Клиент', name: x.name, sub: x.type, to: '/clients' })),
          ...t.data.filter(x => x.text.toLowerCase().includes(q)).map(x => ({ type: 'Задача', name: x.text, sub: x.due, to: '/tasks' })),
        ].slice(0, 7)
        setSearchRes(res)
      } catch {}
    }
    const tid = setTimeout(run, 250)
    return () => clearTimeout(tid)
  }, [searchQ])

  async function readNotif(id) {
    await api.patch(`/notifications/${id}/read`)
    setNotifs(n => n.map(x => x.id === id ? { ...x, unread: false } : x))
  }

  function showToast(msg, type = '') {
    const el = toastRef.current
    if (!el) return
    el.textContent = msg; el.className = 'toast show' + (type ? ' ' + type : '')
    setTimeout(() => el && (el.className = 'toast'), 2500)
  }

  function openAdd() {
    const forms = { '/projects': 'project', '/': 'project', '/clients': 'client', '/tasks': 'task', '/pipeline': 'deal', '/finance': 'finance' }
    const type = forms[path]
    if (!type) { if (path === '/files') { document.getElementById('main-file-input')?.click(); return } return }
    setModal({ type, onSaved: () => { setModal(null); loadBadges(); showToast('Сохранено', 'ok') } })
  }

  const unread = notifs.filter(n => n.unread).length
  const visibleNav = NAV.filter(item => !item.adminOnly || user?.role === 'admin')

  return (
    <div className="app">
      <div className={`mob-ov${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="logo-area">
          <div className="logo-mark">DESHT<span className="logo-red">H</span>AUS<span style={{ display: 'inline-block', width: 7, height: 7, background: 'var(--red)', marginLeft: 2, transform: 'translateY(-2px)' }} /></div>
          <div className="logo-sub">ARCHITECTS · CRM</div>
        </div>
        <nav className="nav">
          {visibleNav.map((item) => (
            <div key={item.to}>
              {item.section && <div className="ns">{item.section}</div>}
              <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => 'ni' + (isActive ? ' active' : '')} onClick={() => setSidebarOpen(false)}>
                <i className={`ti ${item.icon}`} />
                {item.label}
                {item.badge && badges[item.badge] > 0 && <span className="nb">{badges[item.badge]}</span>}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sf">
          <div className="ua">
            <div className="av">{user?.name?.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="un">{user?.name}</div>
              <div className="ur" style={{ cursor: 'pointer' }} onClick={() => { logout(); navigate('/login') }}>Выйти</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(v => !v)}><i className="ti ti-menu-2" /></button>
          <div className="tb-title">{TITLES[path] || 'CRM'}</div>
          <div className="search-wrap">
            <div className="search-box">
              <i className="ti ti-search" />
              <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setShowSearch(true) }} onFocus={() => setShowSearch(true)} onBlur={() => setTimeout(() => setShowSearch(false), 200)} placeholder="Поиск..." />
            </div>
            {showSearch && searchRes.length > 0 && (
              <div className="search-drop">
                {searchRes.map((r, i) => (
                  <div key={i} className="sr" onClick={() => { navigate(r.to); setSearchQ(''); setShowSearch(false) }}>
                    <span className="sr-type">{r.type}</span>
                    <div><div className="sr-name">{r.name}</div><div className="sr-sub">{r.sub}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="notif-btn" onClick={() => setNotifOpen(v => !v)}>
            <i className="ti ti-bell" />
            {unread > 0 && <span className="notif-dot" />}
          </button>
          <button className="btn" onClick={openAdd}><i className="ti ti-plus" /><span className="btn-lbl">{ADD_LABELS[path] || 'Добавить'}</span></button>
        </div>
        <div className="content">
          <Outlet context={{ showToast, loadBadges }} />
        </div>
      </div>

      <div className={`notif-panel${notifOpen ? ' open' : ''}`}>
        <div className="np-head">
          <div className="np-title">Уведомления</div>
          <button className="np-close" onClick={() => setNotifOpen(false)}><i className="ti ti-x" /></button>
        </div>
        {notifs.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Нет уведомлений</div>}
        {notifs.map(n => (
          <div key={n.id} className={`nitem${n.unread ? ' unread' : ''}${n.type === 'ok' ? ' ok' : ''}`} onClick={() => readNotif(n.id)}>
            <div className="nit">{n.text}</div>
            <div className="nis">{n.sub}</div>
            <div className="ntime">{new Date(n.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
      </div>

      {modal && <Modal {...modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadBadges(); showToast('Сохранено', 'ok') }} />}
      <div className="toast" ref={toastRef} />
    </div>
  )
}
