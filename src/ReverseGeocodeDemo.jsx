import { Button, Input } from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  GEOCODE_ENDPOINT,
  buildDownloadPayload,
  confidenceLabel,
  normalizeResult,
  resolveGeocodeApiKey,
} from './GeocodeSearchDemo'
import './ReverseGeocodeDemo.css'

const PRESET_COORDINATES = [
  { label: 'Eiffel Tower', lat: '48.8584', lng: '2.2945' },
  { label: 'Sydney Opera House', lat: '-33.8568', lng: '151.2153' },
  { label: 'Machu Picchu', lat: '-13.1631', lng: '-72.5450' },
  { label: 'Table Mountain', lat: '-33.9628', lng: '18.4098' },
]

const clampPrecision = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : '--'

const parseCoordinate = (rawValue, { min, max, label }) => {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) {
    return { error: `${label} must be a number.` }
  }
  if (value < min || value > max) {
    return { error: `${label} must be between ${min} and ${max}.` }
  }
  return { value }
}

const getTimestamp = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

function ReverseGeocodeDemo({ apiKey = resolveGeocodeApiKey() } = {}) {
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [results, setResults] = useState([])
  const [elapsedMs, setElapsedMs] = useState(null)
  const [lastCoords, setLastCoords] = useState('')
  const downloadAnchorRef = useRef(null)

  const normalizedApiKey = useMemo(
    () => (typeof apiKey === 'string' ? apiKey.trim() : ''),
    [apiKey],
  )

  const canSubmit = latInput.trim().length > 0 && lngInput.trim().length > 0 && status !== 'loading'
  const hasResults = results.length > 0
  const canDownload = hasResults && status === 'success'

  const runLookup = useCallback(
    async (lat, lng) => {
      if (!normalizedApiKey) {
        setStatus('error')
        setErrorMessage('The geocoding API key is missing.')
        return
      }

      setStatus('loading')
      setErrorMessage('')

      const start = getTimestamp()

      try {
        const response = await fetch(
          `${GEOCODE_ENDPOINT}?q=${lat}+${lng}&key=${normalizedApiKey}&limit=5&no_annotations=0`,
        )

        if (!response.ok) {
          throw new Error('Reverse geocoding lookup failed. Please retry in a moment.')
        }

        const payload = await response.json()
        const normalizedResults = (payload?.results ?? []).map(normalizeResult)

        setResults(normalizedResults)
        setElapsedMs(Math.round(getTimestamp() - start))
        setLastCoords(`${clampPrecision(lat)}, ${clampPrecision(lng)}`)

        if (normalizedResults.length === 0) {
          setStatus('empty')
          setErrorMessage(
            'No address matches were returned for those coordinates. Try adjusting the location slightly.',
          )
          return
        }

        setStatus('success')
      } catch (lookupError) {
        setStatus('error')
        setErrorMessage(
          lookupError.message ??
            'Unexpected error while contacting the geocoding service. Please try again.',
        )
      }
    },
    [normalizedApiKey],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsedLat = parseCoordinate(latInput, { min: -90, max: 90, label: 'Latitude' })
    if (parsedLat.error) {
      setErrorMessage(parsedLat.error)
      setStatus('invalid')
      setResults([])
      return
    }
    const parsedLng = parseCoordinate(lngInput, { min: -180, max: 180, label: 'Longitude' })
    if (parsedLng.error) {
      setErrorMessage(parsedLng.error)
      setStatus('invalid')
      setResults([])
      return
    }

    runLookup(parsedLat.value, parsedLng.value)
  }

  const handlePresetClick = (lat, lng) => {
    setLatInput(lat)
    setLngInput(lng)
    const latNumber = Number(lat)
    const lngNumber = Number(lng)
    if (Number.isFinite(latNumber) && Number.isFinite(lngNumber)) {
      runLookup(latNumber, lngNumber)
    }
  }

  const handleSwap = () => {
    setLatInput(lngInput)
    setLngInput(latInput)
  }

  const handleReset = () => {
    setLatInput('')
    setLngInput('')
    setResults([])
    setStatus('idle')
    setErrorMessage('')
    setLastCoords('')
    setElapsedMs(null)
  }

  const handleDownload = () => {
    const anchor = downloadAnchorRef.current
    const payload = buildDownloadPayload({
      query: lastCoords,
      elapsedMs,
      results,
    })

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const blobUrl = window.URL?.createObjectURL?.(blob)

      if (!blobUrl) {
        throw new Error('Unable to generate download link.')
      }

      const fileStamp = new Date().toISOString().replace(/[:.]/g, '-')
      anchor.href = blobUrl
      anchor.download = `reverse-geocode-${fileStamp}.json`
      anchor.click()
      window.URL?.revokeObjectURL?.(blobUrl)
    } catch (downloadError) {
      console.warn('Failed to download reverse geocode results', downloadError)
      setErrorMessage(
        'Unable to download the latest reverse lookup. Please try again after a new search.',
      )
    }
  }

  const statusLabel = useMemo(() => {
    if (status === 'loading') {
      return 'Translating coordinates into an address...'
    }
    if (status === 'success') {
      return `Showing ${results.length} nearby place${
        results.length === 1 ? '' : 's'
      } for these coordinates.`
    }
    if (status === 'empty') {
      return 'No matches nearby.'
    }
    if (status === 'error') {
      return 'Lookup failed.'
    }
    if (status === 'invalid') {
      return 'Check the coordinate values and try again.'
    }
    return 'Awaiting your coordinates.'
  }, [results.length, status])

  return (
    <div className="demo-shell">
      <section className="reverse-card">
        <p className="reverse-eyebrow">Reverse geocoding</p>
        <h1 className="reverse-title">Find the nearest address from latitude/longitude</h1>
        <p className="reverse-description">
          Drop in a coordinate pair. The lookup calls OpenCage, surfaces nearby places, confidence
          scores, timezone data, and downloadable JSON for audit trails.
        </p>

        <form className="reverse-form" onSubmit={handleSubmit} aria-label="Reverse geocode form">
          <label className="reverse-field">
            <span>Latitude (-90 to 90)</span>
            <Input
              value={latInput}
              inputMode="decimal"
              onChange={(event) => setLatInput(event.target.value)}
              placeholder="e.g., 40.7484"
            />
          </label>
          <label className="reverse-field">
            <span>Longitude (-180 to 180)</span>
            <Input
              value={lngInput}
              inputMode="decimal"
              onChange={(event) => setLngInput(event.target.value)}
              placeholder="e.g., -73.9857"
            />
          </label>

          <div className="reverse-actions">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              disabled={!canSubmit}
              loading={status === 'loading'}
            >
              Lookup address
            </Button>
            <Button size="large" onClick={handleSwap}>
              Swap lat/lng
            </Button>
            <Button size="large" onClick={handleReset} disabled={!latInput && !lngInput && !hasResults}>
              Reset
            </Button>
          </div>
        </form>

        <div className="reverse-presets" aria-label="Suggested coordinates">
          {PRESET_COORDINATES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="reverse-chip"
              disabled={status === 'loading'}
              onClick={() => handlePresetClick(preset.lat, preset.lng)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="reverse-status" aria-live="polite">
          <span className="reverse-status__label">{statusLabel}</span>
          {lastCoords && (
            <span className="reverse-status__meta">
              Coords: <strong>{lastCoords}</strong>
            </span>
          )}
          {typeof elapsedMs === 'number' && (
            <span className="reverse-status__meta">
              API time: <strong>{elapsedMs}ms</strong>
            </span>
          )}
        </div>

        <div className="reverse-export">
          <Button size="large" onClick={handleDownload} disabled={!canDownload}>
            Download reverse results (JSON)
          </Button>
          <p>Export includes the resolved place name, components, confidence, map tile URL, and timezone.</p>
        </div>

        {errorMessage && (
          <div className="reverse-alert" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="reverse-results">
          {status === 'idle' && (
            <div className="reverse-placeholder">
              <p>Enter any coordinate pair or tap a preset to jump directly to a famous landmark.</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="geocode-skeleton-grid">
              {[0, 1].map((slot) => (
                <div key={slot} className="geocode-skeleton-card">
                  <div className="geocode-skeleton-thumb" />
                  <div className="geocode-skeleton-line geocode-skeleton-line--lg" />
                  <div className="geocode-skeleton-line geocode-skeleton-line--md" />
                  <div className="geocode-skeleton-line geocode-skeleton-line--sm" />
                </div>
              ))}
            </div>
          )}

          {(status === 'success' || status === 'empty') && hasResults && (
            <ul className="geocode-results__grid">
              {results.map((result) => (
                <li key={result.id} className="geocode-result-card">
                  {result.mapTile && (
                    <div className="geocode-result-card__map" aria-hidden="true">
                      <img src={result.mapTile.url} alt="" loading="lazy" role="presentation" />
                      <div className="geocode-map-overlay">
                        <span aria-hidden="true">+</span>
                        <p>
                          {clampPrecision(result.coords.lat)}, {clampPrecision(result.coords.lng)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="geocode-result-card__body">
                    <h3>{result.formatted}</h3>
                    {result.detail && <p className="geocode-result-card__detail">{result.detail}</p>}
                    <div className="geocode-result-card__metrics">
                      <span className="geocode-pill">
                        Confidence {result.confidence}/10 - {confidenceLabel(result.confidence)}
                      </span>
                      <span className="geocode-pill">Timezone {result.timezone}</span>
                      <span className="geocode-pill">
                        Lat {clampPrecision(result.coords.lat)}
                      </span>
                      <span className="geocode-pill">
                        Lng {clampPrecision(result.coords.lng)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <a
          ref={downloadAnchorRef}
          style={{ display: 'none' }}
          aria-hidden="true"
          tabIndex={-1}
        />
      </section>
    </div>
  )
}

export default ReverseGeocodeDemo
