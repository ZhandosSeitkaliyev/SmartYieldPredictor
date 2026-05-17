const NEWS = [
  { text: 'Минсельхоз РК: субсидирование семян зерновых культур увеличено на 30% в 2025 году', url: 'https://www.gov.kz/memleket/entities/moa/press/news' },
  { text: 'Казахстан увеличил экспорт пшеницы на 18% по итогам первого квартала 2025 года', url: 'https://kazakh-zerno.net' },
  { text: 'В Костанайской области завершён сев яровых зерновых на площади 4,2 млн гектаров', url: 'https://agrarnews.kz' },
  { text: 'Правительство РК утвердило программу развития АПК на 2025–2027 годы с объёмом финансирования 1,4 трлн тенге', url: 'https://www.gov.kz/memleket/entities/moa' },
  { text: 'Урожайность пшеницы в Северном Казахстане прогнозируется на уровне 11,2 ц/га — аналитики', url: 'https://kazakh-zerno.net/novosti' },
  { text: 'Аграрии Акмолинской области получат льготные кредиты на приобретение сельхозтехники', url: 'https://agrarnews.kz' },
  { text: 'В Казахстане запущена система дистанционного мониторинга посевов на базе спутниковых данных', url: 'https://www.inform.kz/ru/category/agriculture' },
  { text: 'Экспорт подсолнечного масла из РК вырос на 24% — данные Комитета по статистике', url: 'https://stat.gov.kz' },
  { text: 'Минсельхоз: площадь орошаемых земель в Южном Казахстане увеличится до 2 млн га к 2027 году', url: 'https://www.gov.kz/memleket/entities/moa/press/news' },
  { text: 'Казахстан и страны ЦА обсудили единые стандарты качества зерна на площадке ЕЭК', url: 'https://kaztrade.kz' },
  { text: 'В Алматинской области собран рекордный урожай сахарной свёклы — 420 тыс. тонн', url: 'https://agrarnews.kz' },
  { text: 'Новый сорт засухоустойчивой пшеницы "Астана-85" допущен к использованию в Казахстане', url: 'https://kazakh-zerno.net' },
]

/* дублируем для бесшовной прокрутки */
const ITEMS = [...NEWS, ...NEWS]

export default function NewsTicker() {
  return (
    <div className="ticker-bar">
      <div className="ticker-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Новости РК
      </div>
      <div className="ticker-track">
        <div className="ticker-inner">
          {ITEMS.map((n, i) => (
            <span key={i} className="ticker-item">
              <a href={n.url} target="_blank" rel="noopener noreferrer">{n.text}</a>
              <span className="ticker-sep" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
