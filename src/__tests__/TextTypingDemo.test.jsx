import { act, render, renderHook, screen } from '@testing-library/react'
import TextTypingDemo, { sampleText, useCharacterTyping } from '../TextTypingDemo'

jest.mock('antd')

describe('TextTypingDemo', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders typing progress and updates metadata as characters appear (positive)', async () => {
    render(<TextTypingDemo typingDelay={10} holdDelay={100} />)

    expect(screen.getByText('Character-by-character Typewriter Animation')).toBeInTheDocument()
    expect(screen.getByText(`0/${sampleText.length}`)).toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText(`1/${sampleText.length}`)).toBeInTheDocument()
  })

  it('keeps hook idle when no text is provided (negative)', () => {
    const { result } = renderHook(() => useCharacterTyping('', 5, 5))

    expect(result.current.typedText).toBe('')
    expect(result.current.typedCharCount).toBe(0)
    expect(result.current.totalChars).toBe(0)
    expect(result.current.isHolding).toBe(false)

    act(() => {
      jest.advanceTimersByTime(50)
    })

    expect(result.current.typedText).toBe('')
    expect(result.current.isHolding).toBe(false)
  })

  it('enters hold state after finishing text then resets to start (negative)', async () => {
    render(<TextTypingDemo text="Hi" typingDelay={1} holdDelay={5} />)

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    await act(async () => {
      jest.advanceTimersByTime(1)
    })

    const holdingSpan = screen.getByText(
      (content, element) => element.classList.contains('typing-text') && content === 'Hi',
    )
    expect(holdingSpan.className).toContain('typing-text--hold')
    expect(screen.getByText('2/2')).toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(5)
    })

    expect(screen.getByText('0/2')).toBeInTheDocument()
    expect(
      screen.getByText((content, element) => element.classList.contains('typing-text') && element.textContent === ''),
    ).toBeInTheDocument()
  })
})
