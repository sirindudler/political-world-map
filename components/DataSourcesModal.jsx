"use client"

const SOURCES = {
  regime: {
    label: 'Political Regime',
    color: '#1d4ed8',
    fullName: 'Varieties of Democracy (V-Dem)',
    url: 'https://www.v-dem.net',
    lastUpdated: '2025 (covers up to 2024)',
    coverage: '179 countries',
    coverageNote: 'A small number of territories are not covered: disputed or unrecognised regions (Western Sahara, Kosovo, Northern Cyprus, Somaliland), overseas territories (Falkland Islands, Puerto Rico, New Caledonia, Greenland), and Antarctica. Countries where current-year data is not yet available use the most recent year on record.',
    methodology: `V-Dem is a research project based at the University of Gothenburg. Over 3,500 country experts worldwide score political conditions using standardized questionnaires. Their answers feed into statistical models that produce comparable scores across countries and time.

The "Regimes of the World" classification (Anna Lührmann et al., 2018) combines two underlying indices:
• The Electoral Democracy Index — measures whether elections are free, fair, and competitive
• The Liberal Component Index — measures rule of law, civil liberties, and checks on executive power

Where the primary V-Dem survey is incomplete for a given year, this map uses the Boix-Miller-Rosato (BMR) democracy indicator as a fallback — a binary democracy/autocracy measure from the same dataset, based on electoral competition and universal suffrage. If neither is available for the current year, the most recent available year is shown.`,
    categories: [
      {
        name: 'Liberal Democracy',
        color: '#2E7D32',
        description: 'Free and fair elections + strong rule of law, civil liberties, and independent institutions that check executive power. The most complete form of democratic governance.',
      },
      {
        name: 'Electoral Democracy',
        color: '#90EE90',
        description: 'Free and fair multiparty elections exist, but liberal checks — like an independent judiciary or free press — are weaker or inconsistent.',
      },
      {
        name: 'Electoral Autocracy',
        color: '#FF6B6B',
        description: 'Elections take place but are meaningfully manipulated through repression, media control, or unfair rules. Opposition exists but cannot realistically win.',
      },
      {
        name: 'Closed Autocracy',
        color: '#8B0000',
        description: 'No multiparty elections. The ruling party or leader faces no meaningful electoral competition. Political opposition is banned or severely suppressed.',
      },
    ],
  },

  freedom: {
    label: 'Freedom Status',
    color: '#15803d',
    fullName: 'Freedom House — Freedom in the World',
    url: 'https://freedomhouse.org',
    lastUpdated: 'Annual (2024 edition)',
    coverage: '195 countries and territories',
    coverageNote: 'Near-complete global coverage including disputed territories.',
    methodology: `Freedom House is a U.S.-based independent watchdog organisation founded in 1941. Their "Freedom in the World" report has been published annually since 1973 and is one of the most widely cited political freedom assessments.

Each country is evaluated by a team of regional analysts and expert advisors using a standardized checklist:
• Political Rights (10 questions): Electoral process, political pluralism, government functioning — scored 0–40
• Civil Liberties (15 questions): Freedom of expression, rule of law, personal autonomy — scored 0–60

Total score (0–100) determines the category. Ratings are reviewed by senior analysts and an academic advisory board before publication.`,
    categories: [
      {
        name: 'Free',
        color: '#2E7D32',
        description: 'Score 70–100. Citizens enjoy open political competition, a climate of respect for civil liberties, significant independent civic life, and independent media.',
      },
      {
        name: 'Partly Free',
        color: '#FFA726',
        description: 'Score 40–69. Some political rights and civil liberties exist but are limited by factors such as corruption, weak rule of law, ethnic conflict, or dominant political parties.',
      },
      {
        name: 'Not Free',
        color: '#8B0000',
        description: 'Score 0–39. Basic political rights are absent and civil liberties are widely and systematically denied.',
      },
    ],
  },

  income: {
    label: 'Income Level',
    color: '#1976D2',
    fullName: 'World Bank — Country Income Classifications',
    url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/906519',
    lastUpdated: 'Updated annually on July 1',
    coverage: '217 economies',
    coverageNote: 'A small number of territories and disputed regions are not classified.',
    methodology: `The World Bank classifies every economy by Gross National Income (GNI) per capita, calculated using the Atlas method — a conversion that smooths out exchange rate fluctuations by using a three-year average.

GNI per capita measures the total income earned by a country's residents (including income from abroad) divided by the population. It differs from GDP in that it captures income flows across borders.

Thresholds are updated each year on July 1 based on the previous year's data. The 2024 thresholds are:`,
    categories: [
      {
        name: 'High Income',
        color: '#1976D2',
        description: 'GNI per capita above $14,005. Includes most of Western Europe, North America, Japan, South Korea, and Australia.',
      },
      {
        name: 'Upper Middle Income',
        color: '#4CAF50',
        description: 'GNI per capita $4,516–$14,005. Includes China, Brazil, Mexico, South Africa, and much of South America.',
      },
      {
        name: 'Lower Middle Income',
        color: '#FFA726',
        description: 'GNI per capita $1,146–$4,515. Includes India, Nigeria, Egypt, and much of Southeast Asia.',
      },
      {
        name: 'Low Income',
        color: '#D32F2F',
        description: 'GNI per capita $1,145 or below. Concentrated in Sub-Saharan Africa and parts of South and Southeast Asia.',
      },
    ],
  },
}

export default function DataSourcesModal({ activeDataset, onClose }) {
  const source = SOURCES[activeDataset]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: source.color }}>
              {source.label}
            </div>
            <h2 className="font-bold text-gray-900 text-base leading-tight">{source.fullName}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <span className="text-xs text-gray-400">{source.coverage}</span>
              <span className="text-xs text-gray-400">{source.lastUpdated}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg font-bold mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* How the data is collected */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">How the data is collected</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{source.methodology}</p>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What each category means</h3>
            <div className="space-y-3">
              {source.categories.map(cat => (
                <div key={cat.name} className="flex gap-3">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 mt-1 border border-black/10"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{cat.name}</div>
                    <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{cat.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Coverage note */}
          {source.coverageNote && (
            <section className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <div className="text-xs font-semibold text-amber-700 mb-1">Coverage note</div>
              <p className="text-xs text-amber-800 leading-relaxed">{source.coverageNote}</p>
            </section>
          )}

          {/* Source link */}
          <div className="pt-1 border-t border-gray-100">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View original data source →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
