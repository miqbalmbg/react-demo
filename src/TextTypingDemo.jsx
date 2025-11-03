import { useEffect, useMemo, useState } from 'react'
import './TextTypingDemo.css'

export const sampleText =
  'This is the sample text that will be typed character by character to simulate the effect of people typing.'

export function useCharacterTyping(text, typingDelay = 80, holdDelay = 1800) {
  const characters = useMemo(() => [...text], [text])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (characters.length === 0) {
      return
    }

    const delay = index >= characters.length ? holdDelay : typingDelay
    const timer = setTimeout(() => {
      setIndex((prev) => (prev >= characters.length ? 0 : prev + 1))
    }, delay)

    return () => clearTimeout(timer)
  }, [index, characters.length, typingDelay, holdDelay])

  const typedCharCount = index > characters.length ? characters.length : index
  const typedText = characters.slice(0, typedCharCount).join('')

  return {
    typedText,
    typedCharCount,
    totalChars: characters.length,
    isHolding: index >= characters.length && characters.length > 0,
  }
}

function TextTypingDemo({
  text = sampleText,
  typingDelay,
  holdDelay,
} = {}) {
  const { typedText, typedCharCount, totalChars, isHolding } = useCharacterTyping(
    text,
    typingDelay,
    holdDelay,
  )

  return (
    <div className="demo-shell">
      <main className="typing-card">
        <p className="typing-eyebrow">React typing effect</p>
        <h1 className="typing-title">
          Character-by-character Typewriter Animation
        </h1>
        <p className="typing-explainer">
          The text below reveals one character at a time, loops automatically,
          and pauses briefly after the sentence completes.
        </p>

        <p className="typing-line" aria-live="polite">
          <span className={`typing-text ${isHolding ? 'typing-text--hold' : ''}`}>
            {typedText}
          </span>
        </p>

        <dl className="typing-meta">
          <div className="typing-meta__item">
            <dt>Characters typed</dt>
            <dd>
              {typedCharCount}/{totalChars}
            </dd>
          </div>
          <div className="typing-meta__item">
            <dt>Typing speed</dt>
            <dd>~80ms per character</dd>
          </div>
          <div className="typing-meta__item">
            <dt>Pause after finish</dt>
            <dd>1.8s</dd>
          </div>
        </dl>
      </main>
    </div>
  )
}

export default TextTypingDemo
