import { useState, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
)

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
  </svg>
)

export default function PhotoAnalyzer() {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const inputRef = useRef()

  const applyFile = useCallback((f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Поддерживаются только изображения: JPG, PNG, WEBP')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10 МБ')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError('')
  }, [preview])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    applyFile(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch(`${API}/analyze-photo`, { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || `Ошибка сервера (${res.status})`)
      }
      const { analysis } = await res.json()
      setResult(analysis)
    } catch (ex) {
      setError(ex.message || 'Не удалось проанализировать изображение')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  return (
    <div className="photo-section">

      {/* Загрузка и превью */}
      <div className="card">
        <div className="card-head">
          <IconCamera />
          Анализ состояния посевов по фото
        </div>
        <div className="card-sub">
          Загрузите снимок поля или посевов — Gemini Vision оценит состояние и даст агрономические рекомендации
        </div>

        {!preview ? (
          /* ── Drop zone ── */
          <div
            className={`drop-zone${dragging ? ' dz-active' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => applyFile(e.target.files[0])}
            />
            <div className="dz-icon"><IconImage /></div>
            <div className="dz-title">Перетащите фото или нажмите для выбора</div>
            <div className="dz-hint">JPG, PNG, WEBP &nbsp;·&nbsp; до 10 МБ</div>
          </div>
        ) : (
          /* ── Превью + кнопки ── */
          <div className="photo-wrap">
            <div className="photo-img-wrap">
              <img src={preview} alt="Фото поля" className="photo-img" />
              <button className="photo-clear-btn" onClick={handleClear} title="Удалить фото">
                <IconX />
              </button>
            </div>

            <div className="photo-actions">
              <button
                className="btn-calc"
                onClick={handleAnalyze}
                disabled={loading}
                style={{ marginTop: 0, flex: 1 }}
              >
                {loading
                  ? <><div className="spin" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />Анализ изображения…</>
                  : <><IconCamera />Проанализировать поле</>
                }
              </button>
              {result && (
                <button className="btn-reupload" onClick={handleClear} title="Загрузить другое фото">
                  <IconRefresh />
                </button>
              )}
            </div>
          </div>
        )}

        {error && <div className="err-box" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>

      {/* Результат анализа */}
      {loading && !result && (
        <div className="card photo-result-card">
          <div className="card-head"><IconBook />Анализ изображения</div>
          <div className="loading-row">
            <div className="spin" />
            Gemini Vision обрабатывает снимок…
          </div>
        </div>
      )}

      {result && (
        <div className="card photo-result-card photo-result-anim">
          <div className="card-head"><IconBook />Результат визуального анализа</div>
          <div
            className="advice-body"
            dangerouslySetInnerHTML={{ __html: result }}
          />
        </div>
      )}
    </div>
  )
}
