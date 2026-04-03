"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import DataSourcesModal from './DataSourcesModal'

const DATASET_CONFIGS = {
  regime: {
    title: 'Political Regime (V-Dem)',
    file: '/regime-data.json',
    colors: {
      'Closed Autocracy': '#8B0000',
      'Electoral Autocracy': '#FF6B6B',
      'Electoral Democracy': '#90EE90',
      'Liberal Democracy': '#2E7D32',
      'No Data': '#CCCCCC',
    },
  },
  freedom: {
    title: 'Freedom Status (Freedom House)',
    file: '/freedom-house-data.json',
    colors: {
      'Free': '#2E7D32',
      'Partly Free': '#FFA726',
      'Not Free': '#8B0000',
      'No Data': '#CCCCCC',
    },
  },
  income: {
    title: 'Income Level (World Bank)',
    file: '/world-bank-income-data.json',
    colors: {
      'High Income': '#1976D2',
      'Upper Middle Income': '#4CAF50',
      'Lower Middle Income': '#FFA726',
      'Low Income': '#D32F2F',
      'No Data': '#CCCCCC',
    },
  },
}

const REGIME_ORDER = ['Closed Autocracy', 'Electoral Autocracy', 'Electoral Democracy', 'Liberal Democracy']
const REGIME_COLORS = DATASET_CONFIGS.regime.colors

function RegimeHistory({ isoCode, timeseries }) {
  const data = timeseries[isoCode]
  if (!data) return null

  const years = Object.keys(data).sort()
  const W = 240  // fits inside w-72 popup with p-4 padding
  const H = 48
  const barW = Math.floor((W - (years.length - 1) * 2) / years.length)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-xs font-semibold text-gray-500 mb-2">
        Regime History ({years[0]}–{years[years.length - 1]})
      </div>
      <svg width={W} height={H + 14} className="block overflow-visible">
        {years.map((yr, i) => {
          const cat = data[yr]
          const fill = REGIME_COLORS[cat] || REGIME_COLORS['No Data']
          const rank = REGIME_ORDER.indexOf(cat)
          const barH = rank === -1 ? 8 : 12 + rank * 9
          const x = i * (barW + 2)
          return (
            <g key={yr}>
              <rect x={x} y={H - barH} width={barW} height={barH} fill={fill} rx={2}>
                <title>{yr}: {cat}</title>
              </rect>
              {/* Year label every other year to avoid crowding */}
              {i % 2 === 0 && (
                <text x={x + barW / 2} y={H + 11} textAnchor="middle" fontSize={8} fill="#9CA3AF">
                  {yr}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {/* Legend for chart */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {REGIME_ORDER.map(cat => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: REGIME_COLORS[cat] }} />
            <span className="text-[10px] text-gray-500">{cat.replace('Electoral ', 'El. ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getIsoCode(geo) {
  return geo.properties.ISO_A3 === '-99'
    ? geo.properties.ISO_A3_EH
    : geo.properties.ISO_A3
}

export default function WorldMap() {
  const [tooltipContent, setTooltipContent] = useState("")
  const [currentDataset, setCurrentDataset] = useState('regime')
  const [allData, setAllData] = useState({ regime: {}, freedom: {}, income: {} })
  const [loadErrors, setLoadErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [timeseries, setTimeseries] = useState({})
  const [clickedCountry, setClickedCountry] = useState(null)  // { name, category, isoCode }
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 })
  const [wikiData, setWikiData] = useState(null)
  const [wikiLoading, setWikiLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const [mapPosition, setMapPosition] = useState({ coordinates: [0, 20], zoom: 1 })
  const dragDistRef = useRef(0)

  const MIN_ZOOM = 1

  const zoomAt = useCallback((factor) => {
    setMapPosition(pos => ({
      ...pos,
      zoom: Math.min(Math.max(pos.zoom * factor, MIN_ZOOM), 12),
    }))
  }, [])

  const handleMoveEnd = useCallback((pos) => {
    const zoom = Math.max(pos.zoom, MIN_ZOOM)
    // At zoom=1 the full world is visible — allow more panning as zoom increases
    const maxLng = 180 * (1 - 1 / zoom)
    const maxLat = 80 * (1 - 1 / zoom)
    const lng = Math.max(-maxLng, Math.min(maxLng, pos.coordinates[0]))
    const lat = Math.max(-maxLat, Math.min(maxLat, pos.coordinates[1]))
    setMapPosition({ zoom, coordinates: [lng, lat] })
  }, [])

  // Load all three datasets in parallel on mount
  useEffect(() => {
    const fetchJson = async (url, key) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return { key, data: await res.json() }
      } catch (err) {
        return { key, error: err.message }
      }
    }

    Promise.all([
      fetchJson('/regime-data.json', 'regime'),
      fetchJson('/freedom-house-data.json', 'freedom'),
      fetchJson('/world-bank-income-data.json', 'income'),
      fetchJson('/regime-timeseries.json', 'timeseries'),
    ]).then(results => {
      const newData = { regime: {}, freedom: {}, income: {} }
      const errors = {}
      for (const result of results) {
        if (result.key === 'timeseries') {
          if (!result.error) setTimeseries(result.data)
        } else if (result.error) {
          errors[result.key] = result.error
        } else {
          newData[result.key] = result.data
        }
      }
      setAllData(newData)
      setLoadErrors(errors)
      setLoading(false)
    })
  }, [])

  const config = DATASET_CONFIGS[currentDataset]

  const getCountryColor = (isoCode) => {
    const category = allData[currentDataset][isoCode]
    return config.colors[category] || config.colors['No Data']
  }

  const getCountryCategory = (isoCode) => {
    return allData[currentDataset][isoCode] || 'No Data'
  }

  const handleCountryClick = (geo, event) => {
    event.stopPropagation()

    const isoCode = getIsoCode(geo)
    const countryName = geo.properties.NAME || geo.properties.ADMIN
    const category = getCountryCategory(isoCode)

    if (clickedCountry && clickedCountry.name === countryName) {
      setClickedCountry(null)
      setWikiData(null)
      return
    }

    setClickedCountry({ name: countryName, category, isoCode })
    setLabelPosition({ x: event.clientX, y: event.clientY })
    setWikiData(null)
    setWikiLoading(true)

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`)
      .then(res => res.json())
      .then(data => {
        setWikiData({
          extract: data.extract,
          thumbnail: data.thumbnail?.source,
          url: data.content_urls?.desktop?.page,
        })
        setWikiLoading(false)
      })
      .catch(() => setWikiLoading(false))
  }

  const handleMapClick = () => {
    setClickedCountry(null)
    setWikiData(null)
  }

  const hasErrors = Object.keys(loadErrors).length > 0

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Error banner */}
      {hasErrors && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-red-600 text-white text-xs px-4 py-2">
          Failed to load: {Object.keys(loadErrors).join(', ')} — refresh to retry
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#4A90E2]/80">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-sm font-medium text-gray-700">
            Loading map data...
          </div>
        </div>
      )}

      <ComposableMap
        width={800}
        height={500}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 185, center: [0, 10] }}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={mapPosition.zoom}
          center={mapPosition.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography="/world-countries.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoCode = getIsoCode(geo)
                const countryName = geo.properties.NAME || geo.properties.ADMIN
                const category = getCountryCategory(isoCode)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(isoCode)}
                    stroke="#000000"
                    strokeWidth={0.5}
                    onClick={(event) => handleCountryClick(geo, event)}
                    onMouseEnter={() => setTooltipContent(`${countryName} - ${category}`)}
                    onMouseLeave={() => setTooltipContent("")}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#F0F0F0', outline: 'none', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover Tooltip */}
      {tooltipContent && !clickedCountry && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2
                        bg-white px-4 py-2 rounded shadow-lg border border-gray-300 z-10
                        text-sm font-medium whitespace-nowrap pointer-events-none">
          {tooltipContent}
        </div>
      )}

      {/* Wikipedia Country Info Popup */}
      {clickedCountry && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-72"
          style={{
            left: `${Math.min(labelPosition.x + 16, window.innerWidth - 304)}px`,
            top: `${Math.min(Math.max(labelPosition.y + 16, 8), window.innerHeight - 480)}px`,
          }}
        >
          {wikiData?.thumbnail && (
            <img
              src={wikiData.thumbnail}
              alt={`${clickedCountry.name}`}
              className="w-full h-32 object-cover rounded-t-xl"
            />
          )}
          {wikiLoading && (
            <div className="w-full h-32 bg-gray-100 rounded-t-xl flex items-center justify-center">
              <div className="text-gray-400 text-xs">Loading...</div>
            </div>
          )}

          <div className="p-4">
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full w-6 h-6
                         flex items-center justify-center text-gray-600 hover:text-black
                         shadow text-xs font-bold"
              onClick={() => { setClickedCountry(null); setWikiData(null) }}
            >
              ✕
            </button>

            <div className="font-bold text-base mb-1">{clickedCountry.name}</div>
            <div
              className="text-xs font-medium text-white rounded px-2 py-0.5 inline-block mb-3"
              style={{ backgroundColor: config.colors[clickedCountry.category] || '#999' }}
            >
              {clickedCountry.category}
            </div>

            {wikiData?.extract && (
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                {wikiData.extract}
              </p>
            )}

            {wikiData?.url && (
              <a
                href={wikiData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-blue-600 hover:underline"
              >
                Wikipedia →
              </a>
            )}

            <RegimeHistory isoCode={clickedCountry.isoCode} timeseries={timeseries} />
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="fixed top-4 right-4 flex flex-col gap-1 z-10">
        <button
          onClick={() => zoomAt(2.0)}
          className="w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-200 text-xl font-light text-gray-700 hover:bg-gray-100 flex items-center justify-center"
        >+</button>
        <button
          onClick={() => zoomAt(1 / 2.0)}
          className="w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-200 text-xl font-light text-gray-700 hover:bg-gray-100 flex items-center justify-center"
        >−</button>
      </div>

      {/* Dataset Toggle */}
      <div className="fixed top-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xs text-gray-600">VIEW BY:</h3>
          <button
            onClick={() => setShowInfo(true)}
            aria-label="About this data"
            className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-xs font-bold flex items-center justify-center"
            title="About this data"
          >?</button>
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(DATASET_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setCurrentDataset(key)}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                currentDataset === key
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cfg.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="font-bold text-sm">{config.title}</h3>
          <button
            onClick={() => setShowInfo(true)}
            aria-label="About this data"
            className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-xs font-bold flex items-center justify-center"
            title="About this data"
          >?</button>
        </div>
        {Object.entries(config.colors)
          .filter(([type]) => type !== 'No Data')
          .map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: color }} />
              <span className="text-xs">{type}</span>
            </div>
          ))}
        <div className="flex items-center gap-2 mb-0 mt-3 pt-2 border-t border-gray-200">
          <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: config.colors['No Data'] }} />
          <span className="text-xs text-gray-600">No Data</span>
        </div>
      </div>
      {showInfo && (
        <DataSourcesModal
          activeDataset={currentDataset}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}
