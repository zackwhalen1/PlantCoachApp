import { useMemo, useRef, useState } from 'react'

import { api } from '../api'
import { ActionButton, EmptyState, Surface } from './UI'

const SWIPE_THRESHOLD = 90   // px to commit a swipe
const ROTATION_FACTOR = 0.07 // degrees per px of horizontal drag
const FLY_DURATION_MS = 320

export function PlanterView({ discover, saved, environments, onUpdated }) {
  const [dismissed, setDismissed] = useState(new Set())
  const [detailsId, setDetailsId] = useState(null)
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })
  const [flying, setFlying] = useState(null) // 'right' | 'left' | null
  const dragOrigin = useRef(null)

  const visible = useMemo(
    () => discover.filter((item) => !saved.some((s) => s.id === item.id) && !dismissed.has(item.id)),
    [discover, saved, dismissed],
  )
  const current = visible[0] || null
  const next = visible[1] || null
  const details = saved.find((item) => item.id === detailsId)

  function fallbackImage(item) {
    return `https://loremflickr.com/1200/900/${encodeURIComponent(
      `${item.common_name} ${item.scientific_name} houseplant`,
    )}`
  }

  function handleImageError(event, item) {
    const target = event.currentTarget
    if (target.dataset.fallbackApplied === '1') return
    target.dataset.fallbackApplied = '1'
    target.src = fallbackImage(item)
  }

  async function commit(action) {
    if (!current || flying) return
    const dir = action === 'interested' ? 'right' : 'left'
    setFlying(dir)
    setTimeout(async () => {
      if (action === 'dismissed') {
        setDismissed((prev) => new Set([...prev, current.id]))
      }
      setFlying(null)
      setDrag({ x: 0, y: 0, active: false })
      dragOrigin.current = null
      await api.planterAction({ species_id: current.id, action })
      await onUpdated()
    }, FLY_DURATION_MS)
  }

  async function addToCollection(speciesId) {
    await api.addSavedToCollection({ species_id: speciesId, environment_id: environments[0]?.id || null })
    await onUpdated()
  }

  function onPointerDown(event) {
    if (flying) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOrigin.current = { x: event.clientX, y: event.clientY }
    setDrag({ x: 0, y: 0, active: true })
  }

  function onPointerMove(event) {
    if (!dragOrigin.current || flying) return
    setDrag({
      x: event.clientX - dragOrigin.current.x,
      y: event.clientY - dragOrigin.current.y,
      active: true,
    })
  }

  function onPointerUp() {
    if (!dragOrigin.current) return
    const dx = drag.x
    dragOrigin.current = null
    if (dx > SWIPE_THRESHOLD) {
      commit('interested')
    } else if (dx < -SWIPE_THRESHOLD) {
      commit('dismissed')
    } else {
      setDrag({ x: 0, y: 0, active: false })
    }
  }

  // ── Derived card transform ────────────────────────────────────────────────
  const rotation = drag.x * ROTATION_FACTOR
  const likeOpacity  = Math.min(1, Math.max(0,  drag.x / SWIPE_THRESHOLD))
  const nopeOpacity  = Math.min(1, Math.max(0, -drag.x / SWIPE_THRESHOLD))

  let cardStyle = {}
  if (flying === 'right') {
    cardStyle = { transform: 'translateX(150%) rotate(25deg)', opacity: 0, transition: `transform ${FLY_DURATION_MS}ms ease-in, opacity ${FLY_DURATION_MS}ms ease-in` }
  } else if (flying === 'left') {
    cardStyle = { transform: 'translateX(-150%) rotate(-25deg)', opacity: 0, transition: `transform ${FLY_DURATION_MS}ms ease-in, opacity ${FLY_DURATION_MS}ms ease-in` }
  } else if (drag.active) {
    cardStyle = { transform: `translateX(${drag.x}px) translateY(${drag.y * 0.4}px) rotate(${rotation}deg)`, transition: 'none' }
  } else {
    cardStyle = { transform: 'translateX(0) rotate(0deg)', transition: 'transform 0.3s cubic-bezier(.175,.885,.32,1.275)' }
  }

  const nextScale = 0.95 + Math.min(0.05, Math.abs(drag.x) / (SWIPE_THRESHOLD * 10))

  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <Surface>
        <h3 className="font-display text-xl text-emerald-950">PlantR</h3>
        <p className="text-sm text-emerald-900/70">
          Drag right to save a plant, drag left to skip — or use the buttons below.
        </p>

        {!current && (
          <div className="mt-6">
            <EmptyState
              title="You've seen all available plants"
              description="All discovery cards have been reviewed. Check your saved list to add plants to your collection."
            />
          </div>
        )}

        {current && (
          <>
            {/* Card stack */}
            <div className="relative mt-4" style={{ height: '640px' }}>
              {/* Next card (underneath, slightly scaled down) */}
              {next && (
                <article
                  className="absolute inset-0 overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-md"
                  style={{
                    transform: `scale(${nextScale}) translateY(10px)`,
                    transition: 'transform 0.2s ease',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <img
                    src={next.image_url}
                    alt={next.common_name}
                    className="h-80 w-full object-cover"
                    loading="lazy"
                    onError={(event) => handleImageError(event, next)}
                  />
                  <div className="p-4">
                    <h4 className="font-display text-xl text-emerald-950">{next.common_name}</h4>
                    <p className="text-sm italic text-emerald-900/60">{next.scientific_name}</p>
                  </div>
                </article>
              )}

              {/* Current draggable card */}
              <article
                className="absolute inset-0 cursor-grab overflow-hidden rounded-3xl border border-emerald-900/15 bg-white shadow-xl select-none active:cursor-grabbing"
                style={{ ...cardStyle, zIndex: 1, touchAction: 'none' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {/* LIKE stamp */}
                <div
                  className="pointer-events-none absolute left-5 top-7 z-10 -rotate-[20deg] rounded-xl border-4 border-emerald-500 px-3 py-1 font-display text-3xl font-black uppercase text-emerald-500"
                  style={{ opacity: likeOpacity, transition: 'opacity 0.05s' }}
                >
                  LIKE
                </div>
                {/* NOPE stamp */}
                <div
                  className="pointer-events-none absolute right-5 top-7 z-10 rotate-[20deg] rounded-xl border-4 border-rose-500 px-3 py-1 font-display text-3xl font-black uppercase text-rose-500"
                  style={{ opacity: nopeOpacity, transition: 'opacity 0.05s' }}
                >
                  NOPE
                </div>

                <img
                  src={current.image_url}
                  alt={current.common_name}
                  className="h-80 w-full object-cover"
                  draggable={false}
                  loading="lazy"
                  onError={(event) => handleImageError(event, current)}
                />

                <div className="grid gap-2 overflow-y-auto p-4" style={{ maxHeight: '240px' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-2xl text-emerald-950">{current.common_name}</h4>
                      <p className="text-sm italic text-emerald-900/70">{current.scientific_name}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                      {Math.round(current.recommendation_score)}% match
                    </span>
                  </div>
                  <p className="text-sm text-emerald-900/80">{current.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Info label="Difficulty" value={current.difficulty} />
                    <Info label="Light" value={current.light} />
                    <Info label="Water" value={current.water} />
                    <Info label="Humidity" value={current.humidity} />
                    <Info label="Pet Safety" value={current.pet_safe ? '✓ Safe' : '⚠ Caution'} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {current.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-lime-100 px-2 py-0.5 text-xs text-lime-900">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </div>

            {/* Action buttons below the stack */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-300 bg-white py-3 font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 active:scale-95"
                onClick={() => commit('dismissed')}
              >
                <span className="text-xl">✕</span> Skip
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-400 bg-white py-3 font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-95"
                onClick={() => commit('interested')}
              >
                <span className="text-xl">♥</span> Save
              </button>
            </div>

            <p className="mt-2 text-center text-xs text-emerald-900/40">
              {visible.length} plant{visible.length !== 1 ? 's' : ''} remaining
            </p>
          </>
        )}
      </Surface>

      {/* Saved species sidebar */}
      <Surface>
        <h3 className="font-display text-xl text-emerald-950">Saved Species</h3>
        {!saved.length && (
          <p className="mt-3 text-sm text-emerald-900/70">
            Swipe right or tap Save on a plant to build your shortlist.
          </p>
        )}

        <ul className="mt-3 grid gap-2 text-sm">
          {saved.map((item) => (
            <li key={item.id} className="rounded-xl border border-emerald-900/15 bg-emerald-50/50 p-2">
              <p className="font-medium text-emerald-950">{item.common_name}</p>
              <p className="text-xs italic text-emerald-900/60">{item.scientific_name}</p>
              <div className="mt-2 flex gap-2">
                <ActionButton
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  onClick={() => setDetailsId(item.id)}
                >
                  Details
                </ActionButton>
                <ActionButton className="px-2 py-1 text-xs" onClick={() => addToCollection(item.id)}>
                  + Collection
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </Surface>

      {details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/55 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-900/15 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900/10 px-5 py-4">
              <div>
                <h4 className="font-display text-2xl text-emerald-950">{details.common_name}</h4>
                <p className="text-sm italic text-emerald-900/70">{details.scientific_name}</p>
              </div>
              <button
                className="rounded-xl border border-emerald-900/20 px-3 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
                onClick={() => setDetailsId(null)}
              >
                Close
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-72px)] gap-0 overflow-y-auto md:grid-cols-[1.25fr_1fr]">
              <div className="bg-emerald-50/40 p-4">
                <img
                  src={details.image_url}
                  alt={details.common_name}
                  className="h-[26rem] w-full rounded-2xl border border-emerald-900/10 object-cover"
                  onError={(event) => handleImageError(event, details)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {details.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-lime-100 px-2 py-1 text-xs text-lime-900">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 p-5 text-sm text-emerald-900">
                <p className="text-base text-emerald-900/90">{details.description}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Info label="Difficulty" value={details.difficulty} />
                  <Info label="Light" value={details.light} />
                  <Info label="Water" value={details.water} />
                  <Info label="Humidity" value={details.humidity} />
                  <Info label="Category" value={details.category} />
                  <Info
                    label="Pet Safety"
                    value={details.pet_safe ? 'Likely safe for pets' : 'Use caution around pets'}
                  />
                  <Info
                    label="Beginner Friendliness"
                    value={`${details.beginner_friendliness ?? '-'} / 5`}
                  />
                  <Info
                    label="Watering Difficulty"
                    value={`${details.watering_difficulty ?? '-'} / 5`}
                  />
                </div>
                <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/55 p-3">
                  <p className="font-semibold text-emerald-950">Growing Range</p>
                  <p className="mt-1 text-emerald-900/85">
                    Preferred light: {(details.preferred_light || []).join(', ') || 'n/a'}
                  </p>
                  <p className="mt-1 text-emerald-900/85">
                    Preferred humidity: {(details.preferred_humidity || []).join(', ') || 'n/a'}
                  </p>
                  <p className="mt-1 text-emerald-900/85">
                    Preferred temp: {details.preferred_temp?.[0]}-{details.preferred_temp?.[1]} F
                  </p>
                </div>
                <div className="pt-1">
                  <ActionButton onClick={() => addToCollection(details.id)}>Add This Plant to My Collection</ActionButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
