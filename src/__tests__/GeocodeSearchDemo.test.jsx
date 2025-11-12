import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GeocodeSearchDemo, { buildDownloadPayload, resolveGeocodeApiKey } from '../GeocodeSearchDemo'

jest.mock('antd')

describe('resolveGeocodeApiKey helper', () => {
  it('prefers the browser provided key when available (positive)', () => {
    expect(
      resolveGeocodeApiKey({
        browserKey: '  browser-secret  ',
        nodeKey: 'node-secret',
      }),
    ).toBe('browser-secret')
  })

  it('falls back to the node key when the browser key is empty (positive)', () => {
    expect(
      resolveGeocodeApiKey({
        browserKey: '   ',
        nodeKey: ' node-secret ',
      }),
    ).toBe('node-secret')
  })

  it('returns the baked-in fallback when no keys are provided (negative)', () => {
    expect(
      resolveGeocodeApiKey({
        browserKey: '',
        nodeKey: '',
      }),
    ).toBe('3cc0da9c1e894f958d2cfa165abd83a9')
  })
})

describe('buildDownloadPayload helper', () => {
  it('serializes lat/lng, confidence, and metadata (positive)', () => {
    const payload = buildDownloadPayload({
      query: 'Space Needle',
      elapsedMs: 120,
      results: [
        {
          id: 'abc',
          formatted: 'Space Needle, Seattle, USA',
          detail: 'Seattle | Washington | United States',
          confidence: 9,
          coords: { lat: 47.6205, lng: -122.3493 },
          timezone: 'America/Los_Angeles',
          mapTile: { url: 'https://tile.openstreetmap.org/1/1/1.png' },
        },
      ],
    })

    expect(payload.query).toBe('Space Needle')
    expect(payload.elapsedMs).toBe(120)
    expect(payload.resultCount).toBe(1)
    expect(payload.items[0]).toMatchObject({
      label: 'Space Needle, Seattle, USA',
      detail: 'Seattle | Washington | United States',
      confidence: 9,
      coordinates: { lat: 47.6205, lng: -122.3493 },
      timezone: 'America/Los_Angeles',
      mapTileUrl: 'https://tile.openstreetmap.org/1/1/1.png',
    })
    expect(typeof payload.generatedAt).toBe('string')
  })
})

describe('GeocodeSearchDemo', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('exports results as JSON once a search succeeds (positive)', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      results: [
        {
          formatted: 'Seattle, WA, USA',
          confidence: 9,
          geometry: { lat: 47.6062, lng: -122.3321 },
          components: { city: 'Seattle', state: 'Washington', country: 'United States' },
          annotations: { timezone: { name: 'America/Los_Angeles' }, geohash: 'c22yz' },
        },
      ],
    }
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const originalCreateObjectURL = window.URL.createObjectURL
    const originalRevokeObjectURL = window.URL.revokeObjectURL
    const clickSpy = jest.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURL = jest.fn(() => 'blob:mock')
    const revokeObjectURL = jest.fn()
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })

    render(<GeocodeSearchDemo />)

    const downloadButton = screen.getByRole('button', { name: /download results \(json\)/i })
    expect(downloadButton).toBeDisabled()

    const input = screen.getByRole('textbox', { name: /search for a location/i })
    await user.type(input, 'Seattle')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByRole('heading', { name: /seattle, wa, usa/i })).toBeInTheDocument()
    expect(downloadButton).toBeEnabled()

    await user.click(downloadButton)

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = createObjectURL.mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toBe('application/json')

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

    clickSpy.mockRestore()

    if (originalCreateObjectURL) {
      Object.defineProperty(window.URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreateObjectURL,
      })
    } else {
      delete window.URL.createObjectURL
    }

    if (originalRevokeObjectURL) {
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevokeObjectURL,
      })
    } else {
      delete window.URL.revokeObjectURL
    }
  })

  it('surfaces an error when the browser cannot create a download link (negative)', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      results: [
        {
          formatted: 'Seattle, WA, USA',
          confidence: 9,
          geometry: { lat: 47.6062, lng: -122.3321 },
          components: { city: 'Seattle', state: 'Washington', country: 'United States' },
          annotations: { timezone: { name: 'America/Los_Angeles' }, geohash: 'c22yz' },
        },
      ],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const originalCreateObjectURL = window.URL.createObjectURL
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    render(<GeocodeSearchDemo />)

    const input = screen.getByRole('textbox', { name: /search for a location/i })
    await user.type(input, 'Seattle')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByRole('heading', { name: /seattle, wa, usa/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /download results \(json\)/i }))

    expect(
      await screen.findByText(/Unable to download the latest results/i),
    ).toBeInTheDocument()
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()

    if (originalCreateObjectURL) {
      Object.defineProperty(window.URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreateObjectURL,
      })
    } else {
      delete window.URL.createObjectURL
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('disables search until input has enough characters and surfaces helper text (positive)', async () => {
    const user = userEvent.setup()
    render(<GeocodeSearchDemo />)

    const input = screen.getByRole('textbox', { name: /search for a location/i })
    const searchButton = screen.getByRole('button', { name: /search/i })

    expect(searchButton).toBeDisabled()

    await user.type(input, 'NY')
    expect(searchButton).toBeDisabled()

    await user.type(input, 'C')
    expect(searchButton).toBeEnabled()

    expect(screen.getByText(/Live geocoding lookup/i)).toBeInTheDocument()
    expect(screen.getByText(/Search places and get precise coordinates/i)).toBeInTheDocument()
  })

  it('renders API results with multiple accuracy levels and handles missing geometry (positive)', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      results: [
        {
          formatted: 'Seattle, WA, USA',
          confidence: 9,
          geometry: { lat: 47.6062, lng: -122.3321 },
          components: {
            city: 'Seattle',
            state: 'Washington',
            country: 'United States',
          },
          annotations: {
            timezone: { name: 'America/Los_Angeles' },
            geohash: 'c22yz',
          },
        },
        {
          formatted: 'Lisbon, Portugal',
          confidence: 6,
          geometry: { lat: 38.7223, lng: -9.1393 },
          components: {
            city: 'Lisbon',
            state: 'Lisbon',
            country: 'Portugal',
          },
          annotations: {
            timezone: { name: 'Europe/Lisbon' },
            geohash: 'eyckp',
          },
        },
        {
          formatted: 'Mystery landmark',
          confidence: 2,
          components: {
            country: 'Unknown',
          },
          annotations: {
            timezone: { name: 'Etc/UTC' },
          },
        },
      ],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    render(<GeocodeSearchDemo />)

    const input = screen.getByRole('textbox', { name: /search for a location/i })
    await user.type(input, 'Seattle')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('Seattle'),
      expect.objectContaining({ signal: expect.any(Object) }),
    )

    expect(await screen.findByRole('heading', { name: /seattle, wa, usa/i })).toBeInTheDocument()
    expect(screen.getByText(/Confidence 9\/10 - High accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/Confidence 6\/10 - Medium accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/Confidence 2\/10 - Needs verification/i)).toBeInTheDocument()
    expect(screen.getByText(/Timezone America\/Los_Angeles/i)).toBeInTheDocument()
    expect(screen.getByText(/Timezone Europe\/Lisbon/i)).toBeInTheDocument()
    expect(screen.getByText(/Timezone Etc\/UTC/i)).toBeInTheDocument()
    const mysteryCard = screen.getByRole('heading', { name: /mystery landmark/i }).closest('li')
    expect(mysteryCard).not.toBeNull()
    expect(within(mysteryCard).queryByTestId('geocode-map')).toBeNull()
  })

  it('validates short queries when the form submits manually (negative)', async () => {
    const user = userEvent.setup()
    render(<GeocodeSearchDemo />)

    const input = screen.getByRole('textbox', { name: /search for a location/i })
    await user.type(input, 'NY')

    const form = screen.getByRole('form', { name: /geocode search form/i })
    fireEvent.submit(form)

    expect(
      await screen.findByText(/Type at least 3 characters to search for a location/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Awaiting your first lookup/i)).toBeInTheDocument()
  })

  it('surfaces missing API key errors via the apiKey prop (negative)', async () => {
    const user = userEvent.setup()
    render(<GeocodeSearchDemo apiKey="   " />)

    await user.type(screen.getByRole('textbox', { name: /search for a location/i }), 'Paris')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(
      await screen.findByText(/The geocoding API key is missing/i),
    ).toBeInTheDocument()
  })

  it('renders an empty-state warning when the API returns no matches (negative)', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    })

    render(<GeocodeSearchDemo />)
    await user.type(screen.getByRole('textbox', { name: /search for a location/i }), 'Mars')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(
      await screen.findByText(/No matches found. Try adding a city/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/No matches for that query/i)).toBeInTheDocument()
  })

  it('ignores abort errors without surfacing UI noise (negative)', async () => {
    const user = userEvent.setup()
    global.fetch.mockRejectedValue({ name: 'AbortError' })

    render(<GeocodeSearchDemo />)
    await user.type(screen.getByRole('textbox', { name: /search for a location/i }), 'Rome')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await Promise.resolve()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('aborts the in-flight request before starting a new one (positive)', async () => {
    const user = userEvent.setup()
    const originalAbortController = global.AbortController
    const abortSpy = jest.fn()
    class StubAbortController {
      constructor() {
        this.signal = { aborted: false }
      }

      abort() {
        this.signal.aborted = true
        abortSpy()
      }
    }

    global.AbortController = StubAbortController
    try {
      let firstSignal
      global.fetch
        .mockImplementationOnce((_, { signal }) => {
          firstSignal = signal
          return new Promise(() => {})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                formatted: 'Tokyo, Japan',
                confidence: 8,
                geometry: { lat: 35.6762, lng: 139.6503 },
                components: { city: 'Tokyo', country: 'Japan' },
                annotations: { timezone: { name: 'Asia/Tokyo' }, geohash: 'xn774' },
              },
            ],
          }),
        })

      render(<GeocodeSearchDemo />)
      const input = screen.getByRole('textbox', { name: /search for a location/i })
      await user.type(input, 'First search')
      await user.click(screen.getByRole('button', { name: /search/i }))

      await user.clear(input)
      await user.type(input, 'Second search')
      const form = screen.getByRole('form', { name: /geocode search form/i })
      fireEvent.submit(form)

      await waitFor(() => expect(abortSpy).toHaveBeenCalledTimes(1))
      expect(firstSignal.aborted).toBe(true)
      expect(await screen.findByText(/Showing 1 result/i)).toBeInTheDocument()
    } finally {
      global.AbortController = originalAbortController
    }
  })

  it('aborts the current lookup and resets UI when Reset is clicked (positive)', async () => {
    const user = userEvent.setup()
    let pendingResolver
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          pendingResolver = resolve
        }),
    )

    render(<GeocodeSearchDemo />)
    const input = screen.getByRole('textbox', { name: /search for a location/i })
    await user.type(input, 'Reset me')
    await user.click(screen.getByRole('button', { name: /search/i }))

    const { signal } = global.fetch.mock.calls[0][1]
    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(signal.aborted).toBe(true)
    expect(input).toHaveValue('')
    expect(screen.getByText(/Awaiting your first lookup/i)).toBeInTheDocument()

    if (pendingResolver) {
      await act(async () => {
        pendingResolver({
          ok: true,
          json: async () => ({ results: [] }),
        })
      })
    }
  })

  it('runs a lookup via suggestion chips and disables them while loading (positive)', async () => {
    const user = userEvent.setup()
    let resolveFetch
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    render(<GeocodeSearchDemo />)
    const suggestionButton = screen.getByRole('button', { name: /Seattle, Washington/i })
    await user.click(suggestionButton)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('Seattle%2C%20Washington'),
      expect.any(Object),
    )
    expect(suggestionButton).toBeDisabled()

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          results: [
            {
              formatted: 'Seattle, Washington, USA',
              confidence: 9,
              geometry: { lat: 47.6, lng: -122.3 },
              components: { city: 'Seattle', country: 'United States' },
              annotations: { timezone: { name: 'America/Los_Angeles' }, geohash: 'c22yz' },
            },
          ],
        }),
      })
    })

    expect(await screen.findByRole('heading', { name: /seattle, washington, usa/i })).toBeInTheDocument()
  })

  it('shows error banner when API rejects the request (negative)', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })

    render(<GeocodeSearchDemo />)

    const input = screen.getByRole('textbox', { name: /search for a location/i })
    await user.type(input, 'Atlantis')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Geocoding lookup failed/i)
  })
})
