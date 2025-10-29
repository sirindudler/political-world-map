"use client"

import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"

const regimeColors = {
  'Closed Autocracy': '#8B0000',      // Dark Red
  'Electoral Autocracy': '#FF6B6B',   // Light Red/Coral
  'Electoral Democracy': '#90EE90',   // Light Green
  'Liberal Democracy': '#2E7D32',     // Dark Green
  'No Data': '#CCCCCC'                // Gray
}

export default function WorldMap() {
  const [tooltipContent, setTooltipContent] = useState("")
  const [regimeData, setRegimeData] = useState({})
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1.2 })
  const [clickedCountry, setClickedCountry] = useState(null)
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Load regime classification data
    fetch('/regime-data.json')
      .then(res => res.json())
      .then(data => setRegimeData(data))
      .catch(err => console.error('Error loading regime data:', err))
  }, [])

  const getCountryColor = (isoCode) => {
    const regime = regimeData[isoCode]
    return regimeColors[regime] || regimeColors['No Data']
  }

  const handleZoom = (e) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    // Minimum zoom of 1.2 ensures map fills screen without showing water below Antarctica
    const newZoom = Math.min(Math.max(position.zoom + delta, 1.2), 8)
    setPosition(prev => ({ ...prev, zoom: newZoom }))
  }

  const handleMoveEnd = (newPosition) => {
    const minZoom = 1.2
    const zoom = newPosition.zoom

    // Don't allow panning at minimum zoom
    if (zoom <= minZoom) {
      setPosition({ coordinates: [0, 0], zoom })
      return
    }

    // Calculate max panning boundaries based on zoom level
    // The more zoomed in, the more you can pan
    const maxLng = (zoom - minZoom) * 100
    const maxLat = (zoom - minZoom) * 50

    let [lng, lat] = newPosition.coordinates

    // Constrain longitude
    lng = Math.max(-maxLng, Math.min(maxLng, lng))
    // Constrain latitude
    lat = Math.max(-maxLat, Math.min(maxLat, lat))

    setPosition({ coordinates: [lng, lat], zoom })
  }

  const handleCountryClick = (geo, event) => {
    event.stopPropagation() // Prevent map click handler from firing

    const isoCode = geo.properties.ISO_A3 === '-99' ? geo.properties.ISO_A3_EH : geo.properties.ISO_A3
    const countryName = geo.properties.NAME || geo.properties.ADMIN
    const regime = regimeData[isoCode] || 'No Data'

    // If clicking the same country, toggle it off
    if (clickedCountry && clickedCountry.name === countryName) {
      setClickedCountry(null)
    } else {
      // Set new country with cursor position
      setClickedCountry({ name: countryName, regime })
      setLabelPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handleMapClick = () => {
    // Clear the label when clicking anywhere on the map (not a country)
    setClickedCountry(null)
  }

  return (
    <div className="relative w-full h-full" onWheel={handleZoom}>
      <ComposableMap
        width={800}
        height={600}
        projection="geoNaturalEarth1"
        projectionConfig={{
          scale: 180
        }}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography="/world-countries.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              // Use ISO_A3_EH as fallback for countries with ISO_A3 = "-99" (France, Norway, etc.)
              const isoCode = geo.properties.ISO_A3 === '-99' ? geo.properties.ISO_A3_EH : geo.properties.ISO_A3
              const countryName = geo.properties.NAME || geo.properties.ADMIN
              const regime = regimeData[isoCode] || 'No Data'

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(isoCode)}
                  stroke="#000000"
                  strokeWidth={0.5}
                  onClick={(event) => handleCountryClick(geo, event)}
                  onMouseEnter={() => {
                    setTooltipContent(`${countryName} - ${regime}`)
                  }}
                  onMouseLeave={() => {
                    setTooltipContent("")
                  }}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: '#F0F0F0',
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: { outline: 'none' }
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
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2
                        bg-white px-4 py-2 rounded shadow-lg border border-gray-300 z-10
                        text-sm font-medium whitespace-nowrap">
          {tooltipContent}
        </div>
      )}

      {/* Click Label at Cursor */}
      {clickedCountry && (
        <div
          className="fixed bg-white px-4 py-2 rounded shadow-lg border border-gray-300 z-50
                     text-sm font-medium whitespace-nowrap pointer-events-none"
          style={{
            left: `${labelPosition.x + 10}px`,
            top: `${labelPosition.y + 10}px`
          }}
        >
          <div className="font-bold">{clickedCountry.name}</div>
          <div className="text-gray-600">{clickedCountry.regime}</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <h3 className="font-bold mb-3 text-sm">Regime Types (2024)</h3>
        {Object.entries(regimeColors).filter(([type]) => type !== 'No Data').map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mb-0 mt-3 pt-2 border-t border-gray-200">
          <div
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: regimeColors['No Data'] }}
          />
          <span className="text-xs text-gray-600">No Data</span>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
          Data: V-Dem Institute
        </div>
      </div>
    </div>
  )
}
