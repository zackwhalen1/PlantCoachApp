import { useEffect, useRef, useState } from 'react'

import { api } from '../api'
import { ActionButton } from './UI'

const TYPEWRITER_SPEED_MS = 18

export function FloatingCoachWidget() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      text: 'Hey fellow Plant Enthusiast! My name is Hank. Ask me about watering, stress signs, or room fit for your saved plants.',
      mode: 'startup',
      done: true,
    },
  ])
  const scrollRef = useRef(null)
  const typewriterRef = useRef(null)

  // Auto-scroll whenever history changes or typewriter updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  function runTypewriter(fullText, historyIndex, meta) {
    let charIndex = 0
    clearInterval(typewriterRef.current)
    typewriterRef.current = setInterval(() => {
      charIndex += 1
      setHistory((prev) => {
        const next = [...prev]
        next[historyIndex] = {
          ...next[historyIndex],
          text: fullText.slice(0, charIndex),
          done: charIndex >= fullText.length,
        }
        return next
      })
      if (charIndex >= fullText.length) {
        clearInterval(typewriterRef.current)
      }
    }, TYPEWRITER_SPEED_MS)
  }

  async function ask(event) {
    event.preventDefault()
    const content = question.trim()
    if (!content || loading) return

    setLoading(true)
    setHistory((prev) => [...prev, { role: 'user', text: content, done: true }])
    setQuestion('')

    try {
      const response = await api.askPlantCoach({ question: content })
      const placeholder = { role: 'assistant', text: '', mode: response.mode, model: response.model, done: false }
      setHistory((prev) => {
        const next = [...prev, placeholder]
        // kick off typewriter using the new index
        setTimeout(() => runTypewriter(response.reply, next.length - 1, response), 0)
        return next
      })
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I could not reach the Plant Coach endpoint. Make sure backend is running on port 8000.',
          mode: 'error',
          done: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[min(94vw,26rem)]">
      {!open && (
        <button
          className="rounded-2xl border border-emerald-900/20 bg-white/95 px-4 py-3 text-left shadow-[0_12px_30px_-18px_rgba(20,83,45,0.55)] backdrop-blur transition hover:bg-emerald-50"
          onClick={() => setOpen(true)}
        >
          <p className="text-xs uppercase tracking-[0.14em] text-emerald-900/60">Plant Coach</p>
          <p className="font-display text-lg text-emerald-950">Open AI Helper</p>
        </button>
      )}

      {open && (
        <section className="rounded-2xl border border-emerald-900/20 bg-white/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-900/60">Plant Coach</p>
              <h3 className="font-display text-xl text-emerald-950">Local AI Helper</h3>
            </div>
            <button
              className="rounded-lg border border-emerald-900/20 px-2 py-1 text-xs text-emerald-900 hover:bg-emerald-50"
              onClick={() => setOpen(false)}
            >
              Minimize
            </button>
          </div>

          <div ref={scrollRef} className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-emerald-900/10 bg-emerald-50/45 p-2">
            {history.map((item, index) => (
              <article
                key={`${item.role}-${index}`}
                className={`rounded-lg p-2 text-sm ${
                  item.role === 'user'
                    ? 'ml-6 bg-emerald-700 text-white'
                    : 'mr-6 bg-white text-emerald-950'
                }`}
              >
                <p>
                  {item.text}
                  {item.role === 'assistant' && !item.done && (
                    <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-emerald-700 align-middle" />
                  )}
                </p>
                {item.role === 'assistant' && item.mode && item.done && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-emerald-900/60">
                    mode: {item.mode}
                    {item.model ? ` | model: ${item.model}` : ''}
                  </p>
                )}
              </article>
            ))}
          </div>

          <form className="mt-3 grid gap-2" onSubmit={ask}>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about a specific plant, care timing, or environment fit."
            />
            <ActionButton type="submit" disabled={loading} className="w-fit">
              {loading ? 'Thinking...' : 'Ask Plant Coach'}
            </ActionButton>
          </form>
        </section>
      )}
    </div>
  )
}
