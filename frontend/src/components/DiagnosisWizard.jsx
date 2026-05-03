import { useState } from 'react'

import { api } from '../api'
import { ActionButton, Surface } from './UI'

const symptomOptions = [
  { value: 'yellow_leaves', label: 'Yellow leaves' },
  { value: 'crispy_brown_tips', label: 'Crispy brown tips' },
  { value: 'drooping', label: 'Drooping' },
  { value: 'black_spots', label: 'Black spots' },
  { value: 'moldy_soil', label: 'Moldy soil' },
  { value: 'pests_visible', label: 'Pests visible' },
  { value: 'leaf_drop', label: 'Leaf drop' },
  { value: 'slow_growth', label: 'Slow growth' },
]

export function DiagnosisWizard() {
  const [symptoms, setSymptoms] = useState([])
  const [soil, setSoil] = useState('normal')
  const [light, setLight] = useState('medium')
  const [pestsVisible, setPestsVisible] = useState(false)
  const [recentlyMoved, setRecentlyMoved] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function toggleSymptom(value) {
    setSymptoms((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  async function submitDiagnosis(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = {
        symptoms,
        soil_moisture: soil,
        current_light_level: light,
        pests_visible: pestsVisible,
        recently_moved_or_repotted: recentlyMoved,
      }
      const response = await api.runDiagnosis(payload)
      setResult(response)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Surface>
      <form className="grid gap-4" onSubmit={submitDiagnosis}>
        <div>
          <h3 className="font-display text-xl text-emerald-950">Symptom Diagnosis Wizard</h3>
          <p className="text-sm text-emerald-900/70">
            Select symptoms and context clues to estimate likely causes.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {symptomOptions.map((item) => (
            <label key={item.value} className="flex items-center gap-2 rounded-lg border border-emerald-900/15 bg-white p-2 text-sm">
              <input
                type="checkbox"
                checked={symptoms.includes(item.value)}
                onChange={() => toggleSymptom(item.value)}
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Select label="Soil moisture" value={soil} options={['wet', 'dry', 'normal']} onChange={setSoil} />
          <Select
            label="Current light"
            value={light}
            options={['low', 'medium', 'bright_indirect', 'direct']}
            onChange={setLight}
          />
          <Toggle label="Pests visible?" checked={pestsVisible} onChange={setPestsVisible} />
          <Toggle label="Recently moved / repotted?" checked={recentlyMoved} onChange={setRecentlyMoved} />
        </div>

        <ActionButton type="submit" className="w-fit" disabled={loading}>
          {loading ? 'Diagnosing...' : 'Run Diagnosis'}
        </ActionButton>

        {result && (
          <div className="grid gap-3 rounded-xl border border-emerald-900/10 bg-emerald-50/45 p-4">
            <h4 className="font-display text-lg text-emerald-950">Likely Causes</h4>
            <ul className="grid gap-2 text-sm text-emerald-900/80">
              {result.likely_causes.map((entry) => (
                <li key={entry.cause} className="rounded-lg bg-white/80 p-2">
                  <strong>{entry.cause}</strong> ({Math.round(entry.confidence * 100)}% confidence)
                </li>
              ))}
            </ul>
            <h5 className="font-medium text-emerald-900">Recommended Next Actions</h5>
            <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-900/80">
              {result.recommended_actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p className="text-xs text-amber-700">{result.warning}</p>
          </div>
        )}
      </form>
    </Surface>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="text-sm font-medium text-emerald-950">
      {label}
      <select
        className="mt-1 w-full rounded-lg border border-emerald-900/20 p-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-emerald-900/20 bg-white p-3 text-sm font-medium text-emerald-950">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
