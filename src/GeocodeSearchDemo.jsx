import { Button, Input } from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'
import './GeocodeSearchDemo.css'

const FALLBACK_API_KEY = '3cc0da9c1e894f958d2cfa165abd83a9'

export const resolveGeocodeApiKey = (
  {
    browserKey,
    nodeKey,
  } = {},
) => {
  const normalizedBrowserKey =
    typeof browserKey === 'string'
      ? browserKey.trim()
      : (typeof globalThis !== 'undefined' &&
          typeof globalThis.__APP_ENV__?.VITE_GEOCODE_API_KEY === 'string'
          ? globalThis.__APP_ENV__.VITE_GEOCODE_API_KEY.trim()
          : '')

  if (normalizedBrowserKey) {
    return normalizedBrowserKey
  }

  const normalizedNodeKey =
    typeof nodeKey === 'string'
      ? nodeKey.trim()
      : (typeof process !== 'undefined' && typeof process.env?.VITE_GEOCODE_API_KEY === 'string'
          ? process.env.VITE_GEOCODE_API_KEY.trim()
          : '')

  return normalizedNodeKey || FALLBACK_API_KEY
}

const GEOCODE_API_KEY = resolveGeocodeApiKey()

export const GEOCODE_ENDPOINT = 'https://api.opencagedata.com/geocode/v1/json'
const MAX_RESULTS = 5
const SUGGESTED_QUERIES = [
  'Seattle, Washington',
  'Mount Fuji, Japan',
  'Nairobi National Park, Kenya',
  'Lisbon, Portugal',
]

export const confidenceLabel = (score = 0) => {
  if (score >= 8) {
    return 'High accuracy'
  }
  if (score >= 5) {
    return 'Medium accuracy'
  }
  return 'Needs verification'
}

export const createTilePreviewUrl = (lat, lng, zoom = 6) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null
  }

  const latRad = (lat * Math.PI) / 180
  const n = 2 ** zoom
  const tileX = Math.floor(((lng + 180) / 360) * n)
  const tileY = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  )
  return {
    url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
    zoom,
  }
}

export const normalizeResult = (item, index) => {
  const lat = typeof item?.geometry?.lat === 'number' ? item.geometry.lat : null
  const lng = typeof item?.geometry?.lng === 'number' ? item.geometry.lng : null
  const components = item?.components ?? {}
  const locality =
    components.city ||
    components.town ||
    components.village ||
    components.hamlet ||
    components.locality ||
    components.suburb
  const region = components.state || components.state_district || components.region
  const country = components.country

  return {
    id: item?.annotations?.geohash ?? `${lat}-${lng}-${index}`,
    formatted: item?.formatted ?? 'Unknown location',
    confidence: item?.confidence ?? 0,
    coords: { lat, lng },
    detail: [locality, region, country].filter(Boolean).join(' | '),
    timezone: item?.annotations?.timezone?.name ?? 'Timezone unavailable',
    mapTile: createTilePreviewUrl(lat, lng),
  }
}

export const buildDownloadPayload = ({
  query,
  elapsedMs,
  results: exportResults,
}) => ({
  query,
  generatedAt: new Date().toISOString(),
  elapsedMs: typeof elapsedMs === 'number' ? elapsedMs : null,
  resultCount: exportResults.length,
  items: exportResults.map((result) => ({
    id: result.id,
    label: result.formatted,
    detail: result.detail || null,
    confidence: result.confidence,
    coordinates: {
      lat: typeof result.coords.lat === 'number' ? result.coords.lat : null,
      lng: typeof result.coords.lng === 'number' ? result.coords.lng : null,
    },
    timezone: result.timezone,
    mapTileUrl: result.mapTile?.url ?? null,
  })),
})

const getTimestamp = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

function GeocodeSearchDemo({ apiKey = GEOCODE_API_KEY } = {}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastSearch, setLastSearch] = useState('')
  const [elapsedMs, setElapsedMs] = useState(null)
  const abortControllerRef = useRef(null)
  const downloadAnchorRef = useRef(null)

  const canSubmit = query.trim().length >= 3 && status !== 'loading'
  const hasResults = results.length > 0
  const normalizedApiKey = useMemo(
    () => (typeof apiKey === 'string' ? apiKey.trim() : ''),
    [apiKey],
  )
  const canDownload = hasResults && status !== 'loading'

  const runSearch = useCallback(
    async (rawValue) => {
      const searchValue = rawValue.trim()
      if (searchValue.length < 3) {
        setErrorMessage('Type at least 3 characters to search for a location.')
        setResults([])
        setLastSearch('')
        setElapsedMs(null)
        setStatus('idle')
        return
      }

      if (!normalizedApiKey) {
        setErrorMessage('The geocoding API key is missing.')
        setStatus('error')
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      setStatus('loading')
      setErrorMessage('')
      const start = getTimestamp()

      try {
        const response = await fetch(
          `${GEOCODE_ENDPOINT}?q=${encodeURIComponent(searchValue)}&key=${normalizedApiKey}&limit=${MAX_RESULTS}&no_annotations=0`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Geocoding lookup failed. Please retry in a moment.')
        }

        const payload = await response.json()
        const normalizedResults = (payload?.results ?? []).map(normalizeResult)

        setResults(normalizedResults)
        setLastSearch(searchValue)
        setElapsedMs(Math.round(getTimestamp() - start))

        if (normalizedResults.length === 0) {
          setStatus('empty')
          setErrorMessage(
            'No matches found. Try adding a city, country, or postal code for more context.',
          )
          return
        }

        setStatus('success')
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }
        setStatus('error')
        setErrorMessage(
          error.message ??
            'Unexpected error while contacting the geocoding service. Please try again.',
        )
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      }
    },
    [normalizedApiKey],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    runSearch(query)
  }

  const handleSuggestionClick = (value) => {
    setQuery(value)
    runSearch(value)
  }

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setQuery('')
    setResults([])
    setStatus('idle')
    setErrorMessage('')
    setLastSearch('')
    setElapsedMs(null)
  }

  const handleDownload = () => {
    const payload = buildDownloadPayload({
      query: lastSearch,
      elapsedMs,
      results,
    })

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const blobUrl = window.URL?.createObjectURL?.(blob)
      const anchor = downloadAnchorRef.current

      if (!blobUrl || !anchor) {
        throw new Error('Unable to generate download link.')
      }

      const fileStamp = new Date().toISOString().replace(/[:.]/g, '-')
      anchor.href = blobUrl
      anchor.download = `geocode-results-${fileStamp}.json`
      anchor.click()
      window.URL?.revokeObjectURL?.(blobUrl)
    } catch (downloadError) {
      console.warn('Failed to download geocode results', downloadError)
      setErrorMessage(
        'Unable to download the latest results. Please try again after a new lookup.',
      )
    }
  }

  const statusLabel = useMemo(() => {
    if (status === 'loading') {
      return 'Searching for coordinates...'
    }
    if (status === 'success') {
      return `Showing ${results.length} result${results.length === 1 ? '' : 's'}.`
    }
    if (status === 'empty') {
      return 'No matches for that query.'
    }
    if (status === 'error') {
      return 'Lookup failed.'
    }
    return 'Awaiting your first lookup.'
  }, [results.length, status])

  return (
    <div className="demo-shell">
      <section className="geocode-card">
        <p className="geocode-eyebrow">Live geocoding lookup</p>
        <h1 className="geocode-title">Search places and get precise coordinates</h1>
        <p className="geocode-description">
          Type a city, landmark, or address. The demo calls the OpenCage Geocoder API, surfaces
          lat/lng pairs, confidence scores, and ready-to-embed static map previews in real time.
        </p>

        <form
          className="geocode-search"
          onSubmit={handleSubmit}
          aria-label="Geocode search form"
        >
          <Input
            size="large"
            value={query}
            spellCheck={false}
            aria-label="Search for a location"
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Try "Seattle, Washington" or "Eiffel Tower"'
          />
          <div className="geocode-search__actions">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              disabled={!canSubmit}
              loading={status === 'loading'}
            >
              Search
            </Button>
            <Button size="large" onClick={handleReset} disabled={!query && !hasResults}>
              Reset
            </Button>
          </div>
        </form>

        <div className="geocode-suggestions" aria-label="Suggested searches">
          {SUGGESTED_QUERIES.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="geocode-suggestion-chip"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={status === 'loading'}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="geocode-status" aria-live="polite">
          <span className="geocode-status__label">{statusLabel}</span>
          {lastSearch && (
            <span className="geocode-status__meta">
              Query: <strong>{lastSearch}</strong>
            </span>
          )}
          {typeof elapsedMs === 'number' && (
            <span className="geocode-status__meta">
              API time: <strong>{elapsedMs}ms</strong>
            </span>
          )}
        </div>

        <div className="geocode-export">
          <Button
            size="large"
            onClick={handleDownload}
            disabled={!canDownload}
          >
            Download results (JSON)
          </Button>
          <p>
            Includes formatted address, lat/lng, confidence, timezone, and API timing
            metadata.
          </p>
        </div>

        {errorMessage && (
          <div className="geocode-alert" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="geocode-results">
          {status === 'idle' && (
            <div className="geocode-placeholder">
              <p>Start by searching for any address, landmark, or postal code.</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="geocode-skeleton-grid">
              {[0, 1, 2].map((slot) => (
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
                    <div
                      className="geocode-result-card__map"
                      aria-hidden="true"
                      data-testid="geocode-map"
                    >
                      <img
                        src={result.mapTile.url}
                        alt=""
                        loading="lazy"
                        role="presentation"
                      />
                      <div className="geocode-map-overlay">
                        <span aria-hidden="true">+</span>
                        <p>
                          {typeof result.coords.lat === 'number'
                            ? result.coords.lat.toFixed(4)
                            : '--'}
                          ,{' '}
                          {typeof result.coords.lng === 'number'
                            ? result.coords.lng.toFixed(4)
                            : '--'}
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
                      <span className="geocode-pill">
                        Lat {typeof result.coords.lat === 'number' ? result.coords.lat.toFixed(4) : '--'}
                      </span>
                      <span className="geocode-pill">
                        Lng {typeof result.coords.lng === 'number' ? result.coords.lng.toFixed(4) : '--'}
                      </span>
                      <span className="geocode-pill">Timezone {result.timezone}</span>
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

export default GeocodeSearchDemo
