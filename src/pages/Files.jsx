import { useState, useEffect, useRef } from 'react'
import api from '../api'

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'ti-photo'
  if (ext === 'pdf') return 'ti-file-type-pdf'
  if (['dwg', 'dxf'].includes(ext)) return 'ti-file-vector'
  return 'ti-file'
}

export default function Files() {
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  useEffect(() => { load() }, [])
  async function load() { const r = await api.get('/files'); setFiles(r.data) }

  async function upload(fileList) {
    if (!fileList.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(fileList).forEach(f => fd.append('files', f))
    try { await api.post('/files/upload', fd); await load() } catch {}
    setUploading(false)
  }

  async function del(id) {
    if (!confirm('Удалить файл?')) return
    await api.delete(`/files/${id}`)
    setFiles(fs => fs.filter(f => f.id !== id))
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="ph"><div className="pt">Загрузить файлы</div></div>
        <div style={{ padding: 16 }}>
          <div
            className={`file-drop${dragging ? ' drag' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files) }}
          >
            <i className="ti ti-cloud-upload" />
            <p>Перетащите файлы или <strong>нажмите для выбора</strong></p>
            <p style={{ fontSize: 10, marginTop: 4, color: 'var(--muted)' }}>Чертежи, фото, PDF, DWG — до 50 МБ</p>
          </div>
          <input ref={inputRef} id="main-file-input" type="file" multiple style={{ display: 'none' }} onChange={e => upload(e.target.files)} />
          {uploading && <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--muted)' }}>Загрузка...</div>}
        </div>
      </div>
      <div className="panel">
        <div className="ph"><div className="pt">Все файлы ({files.length})</div></div>
        <div style={{ padding: 14 }}>
          {files.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Файлов пока нет</div>}
          <div className="files-grid">
            {files.map(f => (
              <div key={f.id} className="fc">
                <i className={`ti ${fileIcon(f.original_name || f.name)}`} />
                <div className="fc-n">{f.original_name || f.name}</div>
                <div className="fc-m">{f.project_name || 'Без проекта'} · {f.size}</div>
                <button className="btn-danger" style={{ marginTop: 8, width: '100%', padding: '4px', fontSize: 11 }} onClick={() => del(f.id)}>Удалить</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
