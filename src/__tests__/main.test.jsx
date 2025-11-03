jest.mock('antd')

describe('main entry point', () => {
  afterEach(() => {
    jest.resetModules()
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  it('mounts the application into the root element (positive)', () => {
    const renderMock = jest.fn()
    const createRootMock = jest.fn(() => ({ render: renderMock }))

    document.body.innerHTML = '<div id="root"></div>'

    jest.doMock('react-dom/client', () => ({
      createRoot: createRootMock,
    }))

    jest.doMock('../App.jsx', () => ({
      __esModule: true,
      default: () => null,
    }))

    jest.isolateModules(() => {
      require('../main.jsx')
    })

    const rootElement = document.getElementById('root')
    expect(createRootMock).toHaveBeenCalledWith(rootElement)
    expect(renderMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the root element is not found (negative)', () => {
    jest.doMock('react-dom/client', () => ({
      createRoot: (node) => {
        if (!node) {
          throw new Error('Target container is not a DOM element.')
        }
        return { render: jest.fn() }
      },
    }))

    jest.doMock('../App.jsx', () => ({
      __esModule: true,
      default: () => null,
    }))

    expect(() =>
      jest.isolateModules(() => {
        require('../main.jsx')
      }),
    ).toThrow('Target container is not a DOM element.')
  })
})
