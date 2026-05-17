import { useState, useEffect } from 'react'
import NewsTicker from './components/NewsTicker'
import PhotoAnalyzer from './components/PhotoAnalyzer'

const API = import.meta.env.VITE_API_URL || '/api'

const CROP_RU   = { Wheat:'Пшеница', Rice:'Рис', Maize:'Кукуруза', Barley:'Ячмень', Soybean:'Соя', Cotton:'Хлопок', Groundnut:'Арахис', Millets:'Просо' }
const SOIL_RU   = { Sandy:'Песчаная', Loamy:'Суглинок', Clay:'Глинистая', Silt:'Илистая', Peaty:'Торфяная' }
const REGION_RU = { North:'Северный', South:'Южный', East:'Восточный', West:'Западный' }

const INIT_FORM = {
  Region: '', Soil_Type: '', Crop: '',
  Rainfall_mm: '', Temperature_Celsius: '',
  Fertilizer_Used: false, Irrigation_Used: false,
  Weather_Condition: '', Days_to_Harvest: '',
}

function buildFactors(d) {
  const res = []
  const T = Number(d.Temperature_Celsius)
  const R = Number(d.Rainfall_mm)

  if (T > 35)     res.push({ t: `Высокая температура (${T} °C) — риск теплового стресса культуры`, cls: 'bad' })
  else if (T < 8) res.push({ t: `Низкая температура (${T} °C) — замедление вегетации`, cls: 'bad' })
  else            res.push({ t: `Температура (${T} °C) — в благоприятном диапазоне`, cls: 'ok' })

  if (R < 40)       res.push({ t: `Низкий уровень осадков (${R} мм) — возможен дефицит влаги`, cls: 'bad' })
  else if (R > 900) res.push({ t: `Избыточные осадки (${R} мм) — риск переувлажнения почвы`, cls: 'mid' })
  else              res.push({ t: `Осадки (${R} мм) — удовлетворительный уровень`, cls: 'ok' })

  if (d.Fertilizer_Used) res.push({ t: 'Применение удобрений — положительный эффект на урожайность', cls: 'ok' })
  if (d.Irrigation_Used) res.push({ t: 'Орошение — обеспечивает стабильную влагообеспеченность', cls: 'ok' })

  const soilOk = { Loamy: true, Silt: true }
  res.push({ t: `Тип почвы: ${SOIL_RU[d.Soil_Type] || d.Soil_Type}`, cls: soilOk[d.Soil_Type] ? 'ok' : 'mid' })

  return res
}

/* ─── SVG-иконки ─────────────────────────────────────── */
const IconWheat = () => (
  <svg className="logo-mark" viewBox="0 0 34 34" fill="none">
    <line x1="17" y1="31" x2="17" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <ellipse cx="17" cy="5.5" rx="2.8" ry="4.5" stroke="currentColor" strokeWidth="1.3"/>
    <ellipse cx="13.2" cy="10.5" rx="2.4" ry="4" stroke="currentColor" strokeWidth="1.3" transform="rotate(-22 13.2 10.5)"/>
    <ellipse cx="20.8" cy="10.5" rx="2.4" ry="4" stroke="currentColor" strokeWidth="1.3" transform="rotate(22 20.8 10.5)"/>
    <ellipse cx="12.5" cy="16.5" rx="2" ry="3.4" stroke="currentColor" strokeWidth="1.2" transform="rotate(-27 12.5 16.5)"/>
    <ellipse cx="21.5" cy="16.5" rx="2" ry="3.4" stroke="currentColor" strokeWidth="1.2" transform="rotate(27 21.5 16.5)"/>
    <line x1="8" y1="29" x2="17" y2="31" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="26" y1="29" x2="17" y2="31" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

const IconClipboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
)

const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const IconTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
)

const IconSprout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M12 22V12"/>
    <path d="M12 12C12 7 8 4 4 4c0 4 2.5 7.5 8 8z"/>
    <path d="M12 12c0-5 4-8 8-8 0 4-2.5 7.5-8 8z"/>
  </svg>
)

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 2s8 0 13 5c4 4 4 10 1 14"/>
    <path d="M2 2c0 6 2 11 7 14"/>
  </svg>
)

const IconDrop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z"/>
  </svg>
)

/* ─── Карточка культуры (правая колонка) ───────────────── */
function CropCard({ form }) {
  const crop   = form.Crop
  const region = form.Region
  return (
    <div className="crop-card">
      <div className="cc-head">
        <div className="cc-icon"><IconSprout /></div>
        <div>
          <div className="cc-name">{crop ? (CROP_RU[crop] || crop) : 'Выберите культуру'}</div>
          <div className="cc-region">
            {region ? `${REGION_RU[region] || region} регион` : 'и заполните параметры поля'}
          </div>
        </div>
      </div>
      <div className="cc-grid">
        <div className="cc-param">
          <div className="cc-param-l">Осадки</div>
          <div className="cc-param-v gold">{form.Rainfall_mm ? `${form.Rainfall_mm} мм` : '— мм'}</div>
        </div>
        <div className="cc-param">
          <div className="cc-param-l">Температура</div>
          <div className="cc-param-v gold">{form.Temperature_Celsius ? `${form.Temperature_Celsius} °C` : '— °C'}</div>
        </div>
        <div className="cc-param">
          <div className="cc-param-l">Тип почвы</div>
          <div className="cc-param-v">{form.Soil_Type ? (SOIL_RU[form.Soil_Type] || form.Soil_Type) : '—'}</div>
        </div>
        <div className="cc-param">
          <div className="cc-param-l">Дней до сбора</div>
          <div className="cc-param-v">{form.Days_to_Harvest ? `${form.Days_to_Harvest} дн.` : '—'}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Карточка результата ───────────────────────────────── */
function ResultCard({ result }) {
  const [fillWidth, setFillWidth] = useState(0)

  useEffect(() => {
    const pct = Math.min((result.yieldVal / 10) * 100, 100)
    const t = setTimeout(() => setFillWidth(pct), 80)
    return () => clearTimeout(t)
  }, [result])

  return (
    <div className="card result-anim">
      <div className="card-head"><IconTrendUp />Прогноз урожайности</div>
      <div className="yield-block">
        <div className="yield-lbl">Ожидаемая урожайность</div>
        <div className="yield-num">{result.yieldVal.toFixed(2)}</div>
        <div className="yield-unit">тонн на гектар</div>
        <div className="yield-track">
          <div className="yield-fill" style={{ width: `${fillWidth}%` }} />
        </div>
      </div>
      <div className="factors-label">Ключевые факторы</div>
      <div className="factors">
        {result.factors.map((f, i) => (
          <div key={i} className="factor">
            <div className={`f-dot ${f.cls}`} />
            <span>{f.t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Карточка рекомендаций ─────────────────────────────── */
function AdviceCard({ advice, loading }) {
  return (
    <div className="card advice-anim">
      <div className="card-head"><IconBook />Агрономические рекомендации</div>
      {loading ? (
        <div className="loading-row">
          <div className="spin" />
          Формирование рекомендаций…
        </div>
      ) : (
        <div
          className="advice-body"
          dangerouslySetInnerHTML={{ __html: advice }}
        />
      )}
    </div>
  )
}

/* ─── Главный компонент ─────────────────────────────────── */
export default function App() {
  const [form, setForm]               = useState(INIT_FORM)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [result, setResult]           = useState(null)
  const [advice, setAdvice]           = useState(null)
  const [adviceLoading, setAdviceLoading] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      Region:              form.Region,
      Soil_Type:           form.Soil_Type,
      Crop:                form.Crop,
      Rainfall_mm:         parseFloat(form.Rainfall_mm),
      Temperature_Celsius: parseFloat(form.Temperature_Celsius),
      Fertilizer_Used:     form.Fertilizer_Used,
      Irrigation_Used:     form.Irrigation_Used,
      Weather_Condition:   form.Weather_Condition,
      Days_to_Harvest:     parseInt(form.Days_to_Harvest),
    }

    if (
      !payload.Region || !payload.Soil_Type || !payload.Crop || !payload.Weather_Condition ||
      isNaN(payload.Rainfall_mm) || isNaN(payload.Temperature_Celsius) || isNaN(payload.Days_to_Harvest)
    ) {
      setError('Пожалуйста, заполните все поля перед расчётом.')
      return
    }

    setLoading(true)
    setResult(null)
    setAdvice(null)

    try {
      /* 1. Прогноз урожайности */
      const pr = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!pr.ok) {
        const d = await pr.json().catch(() => ({}))
        throw new Error(d.detail || `Ошибка сервера (${pr.status})`)
      }
      const { predicted_yield_tons_per_ha: yieldVal } = await pr.json()
      setResult({ yieldVal, factors: buildFactors(payload) })

      /* 2. Рекомендации агронома */
      setAdviceLoading(true)
      const ar = await fetch(`${API}/advice?predicted_yield=${yieldVal}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const adviceText = ar.ok
        ? ((await ar.json()).advice || '<p>Рекомендации не получены.</p>')
        : '<p>Рекомендации временно недоступны.</p>'
      setAdvice(adviceText)
    } catch (ex) {
      setError(ex.message || 'Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на порту 8000.')
    } finally {
      setLoading(false)
      setAdviceLoading(false)
    }
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <IconWheat />
            <div className="logo-label">
              <div className="logo-title">Smart Yield Predictor</div>
              <div className="logo-sub">Система прогноза урожайности</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Бегущая строка новостей ── */}
      <NewsTicker />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">
            <span className="hero-tag-line" />
            Аналитика агропроизводства
          </div>
          <h1>Прогноз урожайности<br />сельскохозяйственных культур</h1>
          <div className="hero-divider" />
          <p>Оцените ожидаемую урожайность на основе региона, типа почвы, погодных условий и агротехнических параметров</p>
        </div>
      </section>

      {/* ── Основной контент ── */}
      <div className="wrap">

        {/* Левая колонка: форма */}
        <div>
          <div className="card">
            <div className="card-head"><IconClipboard />Параметры поля и культуры</div>
            <div className="card-sub">Заполните характеристики участка для расчёта прогнозируемой урожайности</div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Регион и культура */}
              <div className="form-sec">
                <div className="sec-label">Регион и культура</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="region">Регион</label>
                    <select id="region" value={form.Region} onChange={e => set('Region', e.target.value)} required>
                      <option value="">Выберите регион</option>
                      <option value="North">Северный</option>
                      <option value="South">Южный</option>
                      <option value="East">Восточный</option>
                      <option value="West">Западный</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="soil">Тип почвы</label>
                    <select id="soil" value={form.Soil_Type} onChange={e => set('Soil_Type', e.target.value)} required>
                      <option value="">Выберите тип</option>
                      <option value="Sandy">Песчаная</option>
                      <option value="Loamy">Суглинок</option>
                      <option value="Clay">Глинистая</option>
                      <option value="Silt">Илистая</option>
                      <option value="Peaty">Торфяная</option>
                    </select>
                  </div>
                  <div className="form-group span2">
                    <label htmlFor="crop">Сельскохозяйственная культура</label>
                    <select id="crop" value={form.Crop} onChange={e => set('Crop', e.target.value)} required>
                      <option value="">Выберите культуру</option>
                      <option value="Wheat">Пшеница</option>
                      <option value="Rice">Рис</option>
                      <option value="Maize">Кукуруза</option>
                      <option value="Barley">Ячмень</option>
                      <option value="Soybean">Соя</option>
                      <option value="Cotton">Хлопок</option>
                      <option value="Groundnut">Арахис</option>
                      <option value="Millets">Просо</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Климатические условия */}
              <div className="form-sec">
                <div className="sec-label">Климатические условия</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="weather">Погодные условия</label>
                    <select id="weather" value={form.Weather_Condition} onChange={e => set('Weather_Condition', e.target.value)} required>
                      <option value="">Выберите условия</option>
                      <option value="Sunny">Солнечно</option>
                      <option value="Cloudy">Облачно</option>
                      <option value="Rainy">Дождливо</option>
                      <option value="Windy">Ветрено</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="days">Дней до сбора урожая</label>
                    <input type="number" id="days" min="30" max="365" placeholder="90"
                      value={form.Days_to_Harvest}
                      onChange={e => set('Days_to_Harvest', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="rain">Осадки, мм</label>
                    <input type="number" id="rain" min="0" max="3000" step="0.1" placeholder="150"
                      value={form.Rainfall_mm}
                      onChange={e => set('Rainfall_mm', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="temp">Температура, °C</label>
                    <input type="number" id="temp" min="-10" max="55" step="0.1" placeholder="22"
                      value={form.Temperature_Celsius}
                      onChange={e => set('Temperature_Celsius', e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Агротехника */}
              <div className="form-sec">
                <div className="sec-label">Агротехника</div>
                <div className="toggle-row">
                  <label className="toggle-item">
                    <span className="toggle-lbl"><IconLeaf />Удобрения</span>
                    <div className="sw">
                      <input type="checkbox" checked={form.Fertilizer_Used}
                        onChange={e => set('Fertilizer_Used', e.target.checked)} />
                      <span className="sw-track" />
                    </div>
                  </label>
                  <label className="toggle-item">
                    <span className="toggle-lbl"><IconDrop />Орошение</span>
                    <div className="sw">
                      <input type="checkbox" checked={form.Irrigation_Used}
                        onChange={e => set('Irrigation_Used', e.target.checked)} />
                      <span className="sw-track" />
                    </div>
                  </label>
                </div>
              </div>

              {error && <div className="err-box">{error}</div>}

              <button type="submit" className="btn-calc" disabled={loading}>
                {loading
                  ? <><div className="spin" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />Вычисление…</>
                  : <><IconChart />Рассчитать урожайность</>
                }
              </button>
            </form>
          </div>

          {/* Методика */}
          <div className="method-note">
            <span className="method-note-label">Методика расчёта:</span>
            <div className="method-chips">
              <div className="chip"><span className="chip-dot" />Модель: Random Forest</div>
              <div className="chip"><span className="chip-dot" />Рекомендации: Gemini API</div>
            </div>
          </div>

          {/* Анализ фото поля */}
          <PhotoAnalyzer />
        </div>

        {/* Правая колонка: карточка + результат */}
        <div className="r-col">
          <CropCard form={form} />
          {result && <ResultCard result={result} />}
          {(adviceLoading || advice) && <AdviceCard advice={advice} loading={adviceLoading} />}
        </div>
      </div>

      <footer>
        <div>Smart Yield Predictor &nbsp;·&nbsp; Система поддержки принятия решений в агрономии</div>
        <div>Модель прогнозирования: Random Forest &nbsp;·&nbsp; Генерация рекомендаций: Gemini API</div>
      </footer>
    </>
  )
}
