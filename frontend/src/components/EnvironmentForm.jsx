import { useEffect, useState } from 'react'

import { ActionButton } from './UI'

const initialEnvironment = {
  name: '',
  location_type: 'indoor',
  light_level: 'medium',
  humidity_level: 'medium',
  temperature_range: '68-75',
  airflow_level: 'gentle',
  distance_from_window: '3 ft',
  notes: '',
}

export function EnvironmentForm({ initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialEnvironment)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(initialValue || initialEnvironment)
  }, [initialValue])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name || !form.temperature_range) {
      setError('Environment name and temperature range are required.')
      return
    }

    setError('')
    onSubmit(form)
  }

  return (
    <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Room / Environment Name" value={form.name} onChange={(v) => updateField('name', v)} />
        <Select
          label="Indoor or Outdoor"
          value={form.location_type}
          options={['indoor', 'outdoor']}
          onChange={(v) => updateField('location_type', v)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Select
          label="Light Level"
          value={form.light_level}
          options={['low', 'medium', 'bright_indirect', 'direct']}
          onChange={(v) => updateField('light_level', v)}
        />
        <Select
          label="Humidity Level"
          value={form.humidity_level}
          options={['low', 'medium', 'high']}
          onChange={(v) => updateField('humidity_level', v)}
        />
        <Input label="Temperature Range" value={form.temperature_range} onChange={(v) => updateField('temperature_range', v)} />
        <Input label="Airflow" value={form.airflow_level} onChange={(v) => updateField('airflow_level', v)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Distance from Window" value={form.distance_from_window} onChange={(v) => updateField('distance_from_window', v)} />
      </div>

      <label className="text-sm font-medium text-emerald-950">
        Notes
        <textarea
          className="mt-1 w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
          rows={3}
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </label>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <ActionButton type="submit">{initialValue ? 'Update Environment' : 'Create Environment'}</ActionButton>
        {onCancel && (
          <ActionButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </ActionButton>
        )}
      </div>
    </form>
  )
}

function Input({ label, value, onChange }) {
  return (
    <label className="text-sm font-medium text-emerald-950">
      {label}
      <input
        type="text"
        className="mt-1 w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="text-sm font-medium text-emerald-950">
      {label}
      <select
        className="mt-1 w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
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
