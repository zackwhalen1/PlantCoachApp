import { useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState, StatTile, Surface } from './UI'

export function DashboardView({ data, onQuickAction, onNavigate }) {
  const [selectedRiskPlantId, setSelectedRiskPlantId] = useState(null)
  const riskSectionRef = useRef(null)

  const selectedRiskPlant = useMemo(
    () => data?.highest_risk_plants?.find((plant) => plant.plant_id === selectedRiskPlantId) || null,
    [data, selectedRiskPlantId],
  )

  useEffect(() => {
    if (!data?.highest_risk_plants?.length) {
      setSelectedRiskPlantId(null)
      return
    }

    const selectedStillExists = data.highest_risk_plants.some((plant) => plant.plant_id === selectedRiskPlantId)
    if (!selectedStillExists) {
      setSelectedRiskPlantId(data.highest_risk_plants[0].plant_id)
    }
  }, [data, selectedRiskPlantId])

  if (!data) {
    return (
      <Surface>
        <EmptyState title="Dashboard loading" description="Fetching the latest plant and task insights." />
      </Surface>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <button type="button" className="text-left" onClick={() => onNavigate?.('plants')}>
          <StatTile label="Plants" value={data.plant_count} accent="emerald" />
        </button>
        <button type="button" className="text-left" onClick={() => onNavigate?.('calendar')}>
          <StatTile label="Needs Attention" value={data.plants_needing_attention} accent="amber" />
        </button>
        <button type="button" className="text-left" onClick={() => onNavigate?.('calendar')}>
          <StatTile label="Upcoming Tasks" value={data.upcoming_tasks.length} accent="sky" />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => {
            riskSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            if (!selectedRiskPlantId && data.highest_risk_plants.length) {
              setSelectedRiskPlantId(data.highest_risk_plants[0].plant_id)
            }
          }}
        >
          <StatTile label="Risk Plants" value={data.highest_risk_plants.length} accent="amber" />
        </button>
      </div>

      <Surface>
        <h3 className="font-display text-xl text-emerald-950">Quick Actions</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {[
            ['Add Plant', 'plants'],
            ['Add Environment', 'environments'],
            ['Run Diagnosis', 'diagnosis'],
            ['Check Compatibility', 'compatibility'],
          ].map(([label, key]) => (
            <button
              key={key}
              className="rounded-xl border border-emerald-900/20 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
              onClick={() => onQuickAction(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface>
          <h3 className="font-display text-xl text-emerald-950">Highest-Risk Plants</h3>
          {data.highest_risk_plants.length ? (
            <div ref={riskSectionRef} className="mt-3 grid gap-3">
              <ul className="grid gap-2 text-sm">
                {data.highest_risk_plants.map((plant) => {
                  const isSelected = plant.plant_id === selectedRiskPlantId
                  const displayName =
                    plant.plant_display_name || plant.plant_nickname || plant.plant_species_name || 'Unknown Plant'
                  return (
                    <li key={plant.plant_id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-100 text-emerald-950'
                            : 'border-emerald-900/15 bg-white text-emerald-900 hover:bg-emerald-50'
                        }`}
                        onClick={() => setSelectedRiskPlantId(plant.plant_id)}
                      >
                        <span className="font-medium">{displayName}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          Risk {plant.risk_score}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {selectedRiskPlant && (
                <div className="rounded-lg border border-emerald-900/15 bg-emerald-50/50 p-3">
                  <p className="font-semibold text-emerald-950">
                    How to remedy for{' '}
                    {selectedRiskPlant.plant_display_name ||
                      selectedRiskPlant.plant_nickname ||
                      selectedRiskPlant.plant_species_name ||
                      'Unknown Plant'}
                  </p>
                  <ul className="mt-2 grid gap-1 text-sm text-emerald-900/85">
                    {(
                      selectedRiskPlant.recommended_actions || [
                        'Complete the nearest due task first, then review soil moisture and light conditions.',
                      ]
                    ).map((action) => (
                      <li key={action} className="rounded-md bg-white/80 px-2 py-1">
                        {action}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-emerald-900/50">
                    {selectedRiskPlant.risk_explanation ||
                      `Urgency scoring: each incomplete task due today/tomorrow adds 2 points, and each incomplete task due within 4 days adds 1 point.`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-900/70">No risk flags yet. Keep completing tasks regularly.</p>
          )}
        </Surface>

        <Surface>
          <h3 className="font-display text-xl text-emerald-950">Recently Added Plants</h3>
          {data.recently_added.length ? (
            <ul className="mt-3 space-y-2 text-sm text-emerald-900/85">
              {data.recently_added.map((plant) => (
                <li key={plant.id} className="rounded-lg bg-emerald-50/60 p-2">
                  <strong>{plant.nickname}</strong> ({plant.common_name})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-emerald-900/70">Add a plant to populate this section.</p>
          )}
        </Surface>
      </div>
    </div>
  )
}
