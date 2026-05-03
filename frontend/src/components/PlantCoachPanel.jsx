import { useState } from 'react'

import { api } from '../api'
import { ActionButton, Surface } from './UI'

export function PlantCoachPanel() {
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('Ask about watering, beginner plants, or care risk.')
  const [mode, setMode] = useState('stub')

  async function ask(event) {
    event.preventDefault()
    if (!question.trim()) return
    const response = await api.askPlantCoach({ question })
    setReply(response.reply)
    setMode(response.mode)
  }

  return (
    <Surface>
      <h3 className="font-display text-xl text-emerald-950">Plant Coach (AI-ready Stub)</h3>
      <p className="text-sm text-emerald-900/70">
        This module is intentionally rule-based now and designed for future LLM integration.
      </p>

      <form className="mt-4 grid gap-2" onSubmit={ask}>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Example: Which plants should I water this week?"
        />
        <ActionButton type="submit" className="w-fit">
          Ask Plant Coach
        </ActionButton>
      </form>

      <div className="mt-4 rounded-lg border border-emerald-900/15 bg-emerald-50/60 p-3 text-sm text-emerald-900">
        <p className="text-xs uppercase tracking-[0.12em] text-emerald-900/60">Response ({mode})</p>
        <p className="mt-1">{reply}</p>
      </div>
    </Surface>
  )
}
