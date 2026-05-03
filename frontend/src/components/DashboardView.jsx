import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { EmptyState, StatTile, Surface } from './UI'

export function DashboardView({ data, onQuickAction }) {
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
        <StatTile label="Plants" value={data.plant_count} accent="emerald" />
        <StatTile label="Need Attention" value={data.plants_needing_attention} accent="amber" />
        <StatTile label="Upcoming Tasks" value={data.upcoming_tasks.length} accent="sky" />
        <StatTile label="Risk Plants" value={data.highest_risk_plants.length} accent="amber" />
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
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.highest_risk_plants}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="plant_nickname" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="risk_score" fill="#059669" radius={8} />
                </BarChart>
              </ResponsiveContainer>
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
