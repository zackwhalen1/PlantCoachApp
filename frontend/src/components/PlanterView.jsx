import { useMemo, useState } from 'react'

import { api } from '../api'
import { ActionButton, EmptyState, Surface } from './UI'

export function PlanterView({ discover, saved, environments, onUpdated }) {
  const [cursor, setCursor] = useState(0)
  const [detailsId, setDetailsId] = useState(null)

  const visible = useMemo(() => discover.filter((item) => !saved.some((s) => s.id === item.id)), [discover, saved])
  const current = visible[cursor] || null
  const details = saved.find((item) => item.id === detailsId)

  async function performAction(speciesId, action) {
    await api.planterAction({ species_id: speciesId, action })
    const nextIndex = cursor + 1 >= visible.length ? 0 : cursor + 1
    setCursor(nextIndex)
    await onUpdated()
  }

  async function addToCollection(speciesId) {
    await api.addSavedToCollection({ species_id: speciesId, environment_id: environments[0]?.id || null })
    await onUpdated()
  }

  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <Surface>
        <h3 className="font-display text-xl text-emerald-950">Planter Discovery</h3>
        <p className="text-sm text-emerald-900/70">
          Swipe right by using Interested, or left by using Not Interested.
        </p>

        {!current && (
          <div className="mt-4">
            <EmptyState
              title="No discovery cards remaining"
              description="Save or dismiss actions shaped your queue. Refreshing data may provide new options."
            />
          </div>
        )}

        {current && (
          <article className="mt-4 overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-sm">
            <img src={current.image_url} alt={current.common_name} className="h-52 w-full object-cover" />
            <div className="grid gap-3 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-2xl text-emerald-950">{current.common_name}</h4>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">
                  Match {Math.round(current.recommendation_score)}
                </span>
              </div>
              <p className="text-sm italic text-emerald-900/70">{current.scientific_name}</p>
              <p className="text-sm text-emerald-900/80">{current.description}</p>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <Info label="Difficulty" value={current.difficulty} />
                <Info label="Light" value={current.light} />
                <Info label="Water" value={current.water} />
                <Info label="Humidity" value={current.humidity} />
                <Info label="Pet Safety" value={current.pet_safe ? 'Likely safe' : 'Use caution'} />
              </div>
              <div className="flex flex-wrap gap-2">
                {current.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-lime-100 px-2 py-1 text-xs text-lime-900">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <ActionButton onClick={() => performAction(current.id, 'interested')}>Save / Interested</ActionButton>
                <ActionButton variant="secondary" onClick={() => performAction(current.id, 'dismissed')}>
                  Not Interested
                </ActionButton>
              </div>
            </div>
          </article>
        )}
      </Surface>

      <Surface>
        <h3 className="font-display text-xl text-emerald-950">Saved Species</h3>
        {!saved.length && (
          <p className="mt-3 text-sm text-emerald-900/70">Save a species from discovery to build your shortlist.</p>
        )}

        <ul className="mt-3 grid gap-2 text-sm">
          {saved.map((item) => (
            <li key={item.id} className="rounded-lg border border-emerald-900/15 bg-emerald-50/50 p-2">
              <p className="font-medium text-emerald-950">{item.common_name}</p>
              <p className="text-xs italic text-emerald-900/70">{item.scientific_name}</p>
              <div className="mt-2 flex gap-2">
                <ActionButton variant="secondary" className="px-2 py-1 text-xs" onClick={() => setDetailsId(item.id)}>
                  Learn More
                </ActionButton>
                <ActionButton className="px-2 py-1 text-xs" onClick={() => addToCollection(item.id)}>
                  Add to Collection
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>

        {details && (
          <div className="mt-4 rounded-lg border border-emerald-900/15 bg-white p-3 text-sm text-emerald-900">
            <h4 className="font-display text-lg text-emerald-950">{details.common_name}</h4>
            <p className="mt-1">{details.description}</p>
            <p className="mt-1 text-xs">Best-use tags: {details.tags.join(', ')}</p>
          </div>
        )}
      </Surface>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <p className="rounded-lg bg-emerald-50 p-2 text-emerald-900">
      <strong>{label}:</strong> {value}
    </p>
  )
}
