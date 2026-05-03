import { ActionButton, EmptyState, Surface } from './UI'

const taskLabels = {
  check_soil: 'Check Soil',
  water_if_needed: 'Water If Needed',
  fertilize: 'Fertilize',
  inspect_pests: 'Inspect Pests',
  rotate: 'Rotate Plant',
  growth_photo: 'Take Growth Photo',
  consider_repotting: 'Consider Repotting',
}

export function CareCalendarView({ tasks, onToggleTask, onRefresh }) {
  return (
    <Surface>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-emerald-950">Care Calendar</h3>
          <p className="text-sm text-emerald-900/70">Chronological task list for your next plant-care actions.</p>
        </div>
        <ActionButton variant="secondary" onClick={onRefresh}>
          Regenerate Tasks
        </ActionButton>
      </div>

      {!tasks.length && (
        <div className="mt-4">
          <EmptyState title="No tasks yet" description="Generate tasks from care schedules to start tracking plant care." />
        </div>
      )}

      {tasks.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                task.completed
                  ? 'border-emerald-900/10 bg-emerald-50/40 text-emerald-900/60'
                  : 'border-emerald-900/20 bg-white text-emerald-950'
              }`}
            >
              <div>
                <p className="font-medium">{taskLabels[task.type] || task.type}</p>
                <p className="text-xs">
                  {task.plant_nickname} · Due {task.due_date}
                </p>
              </div>
              <ActionButton variant={task.completed ? 'secondary' : 'primary'} onClick={() => onToggleTask(task.id)}>
                {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
