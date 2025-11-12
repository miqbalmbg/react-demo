import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReverseGeocodeDemo from '../ReverseGeocodeDemo'

jest.mock('antd')

describe('ReverseGeocodeDemo', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('rejects non-numeric coordinates (negative)', async () => {
    const user = userEvent.setup()
    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), 'abc')
    await user.type(screen.getByLabelText(/longitude/i), '10')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(
      await screen.findByText(/Latitude must be a number/i),
    ).toBeInTheDocument()
  })

  it('validates longitude range separately (negative)', async () => {
    const user = userEvent.setup()
    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '10')
    await user.type(screen.getByLabelText(/longitude/i), '400')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(
      await screen.findByText(/Longitude must be between -180 and 180/i),
    ).toBeInTheDocument()
  })

  it('handles API failures gracefully (negative)', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })

    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '34')
    await user.type(screen.getByLabelText(/longitude/i), '-118')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(
      await screen.findByText(/Reverse geocoding lookup failed/i),
    ).toBeInTheDocument()
  })

  it('swaps coordinate inputs (positive)', async () => {
    const user = userEvent.setup()
    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '12')
    await user.type(screen.getByLabelText(/longitude/i), '34')
    await user.click(screen.getByRole('button', { name: /swap lat\/lng/i }))

    expect(screen.getByLabelText(/latitude/i)).toHaveValue('34')
    expect(screen.getByLabelText(/longitude/i)).toHaveValue('12')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('translates coordinates into addresses and displays confidence (positive)', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      results: [
        {
          formatted: 'Empire State Building, NY, USA',
          confidence: 8,
          geometry: { lat: 40.7484, lng: -73.9857 },
          components: {
            city: 'New York',
            state: 'New York',
            country: 'United States',
          },
          annotations: {
            timezone: { name: 'America/New_York' },
            geohash: 'dr5ru',
          },
        },
      ],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '40.7484')
    await user.type(screen.getByLabelText(/longitude/i), '-73.9857')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('40.7484+-73.9857'))
    expect(await screen.findByRole('heading', { name: /empire state building/i })).toBeInTheDocument()
    expect(screen.getByText(/Confidence 8\/10 - High accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/Timezone America\/New_York/i)).toBeInTheDocument()
  })

  it('validates coordinate ranges and surfaces errors (negative)', async () => {
    const user = userEvent.setup()
    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '200')
    await user.type(screen.getByLabelText(/longitude/i), '10')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(
      await screen.findByText(/Latitude must be between -90 and 90/i),
    ).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('downloads JSON payload after a successful lookup (positive)', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      results: [
        {
          formatted: 'Opera House, Sydney, Australia',
          confidence: 9,
          geometry: { lat: -33.8568, lng: 151.2153 },
          components: {
            city: 'Sydney',
            state: 'NSW',
            country: 'Australia',
          },
          annotations: {
            timezone: { name: 'Australia/Sydney' },
            geohash: 'r3gx2',
          },
        },
      ],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const originalCreateObjectURL = window.URL.createObjectURL
    const originalRevokeObjectURL = window.URL.revokeObjectURL
    const createObjectURL = jest.fn(() => 'blob:reverse')
    const revokeObjectURL = jest.fn()
    const clickSpy = jest.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

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

    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '-33.8568')
    await user.type(screen.getByLabelText(/longitude/i), '151.2153')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(await screen.findByRole('heading', { name: /opera house/i })).toBeInTheDocument()

    const downloadButton = screen.getByRole('button', {
      name: /download reverse results/i,
    })
    await user.click(downloadButton)

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = createObjectURL.mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:reverse')

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

  it('runs lookups from preset chips (positive)', async () => {
    const user = userEvent.setup()
    let resolveFetch
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    render(<ReverseGeocodeDemo />)

    await user.click(screen.getByRole('button', { name: /Eiffel Tower/i }))

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          results: [
            {
              formatted: 'Eiffel Tower, Paris, France',
              confidence: 10,
              geometry: { lat: 48.8584, lng: 2.2945 },
              components: { city: 'Paris', country: 'France' },
              annotations: { timezone: { name: 'Europe/Paris' }, geohash: 'u09tu' },
            },
          ],
        }),
      })
    })

    expect(await screen.findByRole('heading', { name: /eiffel tower/i })).toBeInTheDocument()
  })

  it('surfaces missing API key errors (negative)', async () => {
    const user = userEvent.setup()
    render(<ReverseGeocodeDemo apiKey="   " />)

    await user.type(screen.getByLabelText(/latitude/i), '0')
    await user.type(screen.getByLabelText(/longitude/i), '0')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(
      await screen.findByText(/The geocoding API key is missing/i),
    ).toBeInTheDocument()
  })

  it('handles empty API responses with guidance (negative)', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    })

    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '0.5')
    await user.type(screen.getByLabelText(/longitude/i), '0.5')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))

    expect(
      await screen.findByText(/No address matches were returned/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/No matches nearby/i)).toBeInTheDocument()
  })

  it('resets the UI and clears previous results (positive)', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            formatted: 'Sample place',
            confidence: 5,
            geometry: { lat: 10, lng: 20 },
            components: { city: 'Sample', country: 'Nowhere' },
            annotations: { timezone: { name: 'UTC' }, geohash: 's000' },
          },
        ],
      }),
    })

    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '10')
    await user.type(screen.getByLabelText(/longitude/i), '20')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))
    expect(await screen.findByRole('heading', { name: /sample place/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.getByLabelText(/latitude/i)).toHaveValue('')
    expect(screen.getByLabelText(/longitude/i)).toHaveValue('')
    expect(screen.getByText(/Enter any coordinate pair/i)).toBeInTheDocument()
  })

  it('shows an error when the browser cannot create a download link (negative)', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            formatted: 'Golden Gate Bridge',
            confidence: 8,
            geometry: { lat: 37.8199, lng: -122.4783 },
            components: { city: 'San Francisco', country: 'United States' },
            annotations: { timezone: { name: 'America/Los_Angeles' }, geohash: '9q8yy' },
          },
        ],
      }),
    })

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const originalCreateObjectURL = window.URL.createObjectURL
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    render(<ReverseGeocodeDemo />)

    await user.type(screen.getByLabelText(/latitude/i), '37.8199')
    await user.type(screen.getByLabelText(/longitude/i), '-122.4783')
    await user.click(screen.getByRole('button', { name: /lookup address/i }))
    expect(await screen.findByRole('heading', { name: /golden gate bridge/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /download reverse results/i }))

    expect(
      await screen.findByText(/Unable to download the latest reverse lookup/i),
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
})
