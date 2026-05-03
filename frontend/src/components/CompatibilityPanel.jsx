import { useState } from 'react'

import { api } from '../api'
import { ActionButton, EmptyState, Surface } from './UI'

export function CompatibilityPanel({ plants, environments }) {
  const [plantId, setPlantId] = useState(plants[0]?.id || '')
  const [environmentId, setEnvironmentId] = useState(environments[0]?.id || '')
  const [result, setResult] = useState(null)

  async function calculate() {
    if (!plantId || !environmentId) return
    const response = await api.runCompatibility({ plant_id: plantId, environment_id: environmentId })
    setResult(response)
  }

  if (!plants.length || !environments.length) {
    return (
      <Surface>
        <EmptyState
          title="Compatibility needs both data sets"
          description="Add at least one plant and one environment to compute fit scores."
        />
      </Surface>
    )
  }

  return (
    <Surface>
      <div className="grid gap-3 md:grid-cols-3">
        <Select
          label="Plant"
          value={plantId}
          options={plants.map((plant) => ({ value: plant.id, label: `${plant.nickname} (${plant.common_name})` }))}
          onChange={setPlantId}
        />
        <Select
          label="Environment"
          value={environmentId}
          options={environments.map((env) => ({ value: env.id, label: env.name }))}
          onChange={setEnvironmentId}
        />
        <div className="flex items-end">
          <ActionButton className="w-full" onClick={calculate}>
            Calculate Compatibility
          </ActionButton>
        </div>
      </div>

      {result && (
        <div className="mt-5 grid gap-4 rounded-xl border border-emerald-900/10 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-xl text-emerald-950">Compatibility Score</h4>
            <p className="font-display text-3xl text-emerald-700">{result.total_score}/100</p>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {Object.entries(result.breakdown).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-white p-3 text-sm">
                <p className="text-emerald-900/70">{key.replaceAll('_', ' ')}</p>
                <p className="font-semibold text-emerald-900">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-emerald-900/80">{result.explanation}</p>
        </div>
      )}
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
