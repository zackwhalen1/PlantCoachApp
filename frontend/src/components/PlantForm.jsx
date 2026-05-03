import { useEffect, useMemo, useState } from 'react'

import { ActionButton } from './UI'

const initialPlant = {
  nickname: '',
  common_name: '',
  species_name: '',
  category: 'foliage',
  date_acquired: new Date().toISOString().slice(0, 10),
  pot_size: '6 in',
  soil_type: 'standard_potting_mix',
  drainage_quality: 'good',
  environment_id: '',
  notes: '',
}

export function PlantForm({ environments, initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialPlant)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(initialValue || initialPlant)
  }, [initialValue])

  const envOptions = useMemo(() => [{ id: '', name: 'Unassigned' }, ...environments], [environments])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.nickname || !form.common_name || !form.species_name) {
      setError('Nickname, common name, and species are required.')
      return
    }
    setError('')
    onSubmit({ ...form, environment_id: form.environment_id || null })
  }

  return (
    <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Input label="Nickname" value={form.nickname} onChange={(v) => updateField('nickname', v)} />
        <Input label="Common Name" value={form.common_name} onChange={(v) => updateField('common_name', v)} />
        <Input label="Species" value={form.species_name} onChange={(v) => updateField('species_name', v)} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input label="Category" value={form.category} onChange={(v) => updateField('category', v)} />
        <Input label="Date Acquired" type="date" value={form.date_acquired} onChange={(v) => updateField('date_acquired', v)} />
        <Select
          label="Pot Size"
          value={form.pot_size}
          options={['2 in', '4 in', '6 in', '8 in', '10 in', '12 in', '14 in', '16+ in']}
          onChange={(v) => updateField('pot_size', v)}
        />
        <Select
          label="Drainage"
          value={form.drainage_quality}
          options={['poor', 'fair', 'good', 'excellent']}
          onChange={(v) => updateField('drainage_quality', v)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input label="Soil Type" value={form.soil_type} onChange={(v) => updateField('soil_type', v)} />
        <Select
          label="Assigned Room"
          value={form.environment_id || ''}
          options={envOptions.map((env) => ({ label: env.name, value: env.id }))}
          onChange={(v) => updateField('environment_id', v)}
        />
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
        <ActionButton type="submit">{initialValue ? 'Update Plant' : 'Create Plant'}</ActionButton>
        {onCancel && (
          <ActionButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </ActionButton>
        )}
      </div>
    </form>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm font-medium text-emerald-950">
      {label}
      <input
        type={type}
        className="mt-1 w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function Select({ label, value, options, onChange }) {
  const normalized = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option,
  )

  return (
    <label className="text-sm font-medium text-emerald-950">
      {label}
      <select
        className="mt-1 w-full rounded-lg border border-emerald-900/20 p-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {normalized.map((option) => (
          <option key={option.value || 'none'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
