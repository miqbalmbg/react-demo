import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
jest.mock('antd')

var mockTextTypingDemo = jest.fn(() => <div data-testid="typing-demo">Typing demo</div>)
var mockMultiSelectDemo = jest.fn(() => <div data-testid="multi-demo">Multi demo</div>)
var mockGeocodeDemo = jest.fn(() => <div data-testid="geocode-demo">Geocode demo</div>)
var mockReverseDemo = jest.fn(() => <div data-testid="reverse-demo">Reverse demo</div>)

jest.mock('../TextTypingDemo', () => ({
  __esModule: true,
  default: mockTextTypingDemo,
}))

jest.mock('../MultiSelectFilterDemo', () => ({
  __esModule: true,
  default: mockMultiSelectDemo,
}))

jest.mock('../GeocodeSearchDemo', () => ({
  __esModule: true,
  default: mockGeocodeDemo,
}))

jest.mock('../ReverseGeocodeDemo', () => ({
  __esModule: true,
  default: mockReverseDemo,
}))
// eslint-disable-next-line global-require
const App = require('../App.jsx').default

describe('App layout shell', () => {
  beforeEach(() => {
    mockTextTypingDemo.mockClear()
    mockMultiSelectDemo.mockClear()
    mockGeocodeDemo.mockClear()
    mockReverseDemo.mockClear()
    mockTextTypingDemo.mockImplementation(() => <div data-testid="typing-demo">Typing demo</div>)
    mockMultiSelectDemo.mockImplementation(() => <div data-testid="multi-demo">Multi demo</div>)
    mockGeocodeDemo.mockImplementation(() => <div data-testid="geocode-demo">Geocode demo</div>)
    mockReverseDemo.mockImplementation(() => <div data-testid="reverse-demo">Reverse demo</div>)
  })

  it('renders typing demo content by default (positive)', () => {
    render(<App />)

    expect(screen.getByText('React Demo Lab')).toBeInTheDocument()
    expect(screen.getByTestId('typing-demo')).toBeInTheDocument()
    expect(mockMultiSelectDemo).not.toHaveBeenCalled()
    expect(mockGeocodeDemo).not.toHaveBeenCalled()
    expect(mockReverseDemo).not.toHaveBeenCalled()
  })

  it('switches to the geocode demo when that menu item is clicked (positive)', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Geocode lookup' }))

    expect(screen.getByTestId('geocode-demo')).toBeInTheDocument()
    expect(screen.queryByTestId('typing-demo')).not.toBeInTheDocument()
  })

  it('switches to the reverse geocode demo when selected (positive)', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Reverse geocode' }))

    expect(screen.getByTestId('reverse-demo')).toBeInTheDocument()
    expect(screen.queryByTestId('typing-demo')).not.toBeInTheDocument()
  })

  it('switches to multi-select demo when filter menu item is clicked (positive)', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Multi-select filter' }))

    expect(screen.getByTestId('multi-demo')).toBeInTheDocument()
    expect(screen.queryByTestId('typing-demo')).not.toBeInTheDocument()
  })

  it('renders nothing when a demo component returns null (negative)', async () => {
    const user = userEvent.setup()
    mockMultiSelectDemo.mockImplementationOnce(() => null)

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Multi-select filter' }))

    expect(screen.queryByTestId('multi-demo')).not.toBeInTheDocument()
    expect(screen.getByTestId('app-menu')).toBeInTheDocument()
    expect(screen.getByText('React Demo Lab')).toBeInTheDocument()
  })
})
