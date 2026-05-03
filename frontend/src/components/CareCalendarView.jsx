import { useMemo, useState } from 'react'

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

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map((value) => Number(value))
  return new Date(year, month - 1, day)
}

function getMonthGrid(viewDate) {
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const startWeekday = startOfMonth.getDay()
  const startCell = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - startWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(startCell)
    cellDate.setDate(startCell.getDate() + index)
    return cellDate
  })
}

export function CareCalendarView({ tasks, onToggleTask, onRefresh }) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()))

  const todayKey = formatDateKey(new Date())

  const tasksByDate = useMemo(() => {
    const grouped = new Map()
    for (const task of tasks) {
      if (!grouped.has(task.due_date)) {
        grouped.set(task.due_date, [])
      }
      grouped.get(task.due_date).push(task)
    }
    return grouped
  }, [tasks])

  const monthGrid = useMemo(() => getMonthGrid(viewDate), [viewDate])

  const selectedTasks = tasksByDate.get(selectedDateKey) || []
  const selectedDate = parseDateKey(selectedDateKey)

  function goToPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <Surface>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-emerald-950">Care Calendar</h3>
          <p className="text-sm text-emerald-900/70">Monthly plant-care calendar with tasks placed on actual due dates.</p>
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
        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-emerald-900/15 bg-emerald-50/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <ActionButton variant="secondary" className="px-3 py-1.5" onClick={goToPreviousMonth}>
                Previous
              </ActionButton>
              <h4 className="font-display text-2xl text-emerald-950">
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <ActionButton variant="secondary" className="px-3 py-1.5" onClick={goToNextMonth}>
                Next
              </ActionButton>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-emerald-900/70">
              {weekdayLabels.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-2">
              {monthGrid.map((cellDate) => {
                const cellKey = formatDateKey(cellDate)
                const cellTasks = tasksByDate.get(cellKey) || []
                const inCurrentMonth = cellDate.getMonth() === viewDate.getMonth()
                const isSelected = cellKey === selectedDateKey
                const isToday = cellKey === todayKey
                const completedCount = cellTasks.filter((task) => task.completed).length

                return (
                  <button
                    key={cellKey}
                    className={`min-h-24 rounded-lg border p-2 text-left transition ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-100/70 shadow-sm'
                        : 'border-emerald-900/10 bg-white hover:bg-emerald-50'
                    } ${inCurrentMonth ? 'text-emerald-950' : 'text-emerald-900/45'}`}
                    onClick={() => setSelectedDateKey(cellKey)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          isToday ? 'rounded-full bg-emerald-700 px-2 py-0.5 text-white' : ''
                        }`}
                      >
                        {cellDate.getDate()}
                      </span>
                      {cellTasks.length > 0 && (
                        <span className="rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white">
                          {cellTasks.length}
                        </span>
                      )}
                    </div>

                    {cellTasks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {cellTasks.slice(0, 2).map((task) => (
                          <p
                            key={task.id}
                            className={`truncate rounded px-1 py-0.5 text-[11px] ${
                              task.completed
                                ? 'bg-emerald-100 text-emerald-900/65 line-through'
                                : 'bg-lime-100 text-emerald-950'
                            }`}
                          >
                            {task.plant_nickname}
                          </p>
                        ))}
                        {cellTasks.length > 2 && (
                          <p className="text-[11px] text-emerald-900/70">+{cellTasks.length - 2} more</p>
                        )}
                      </div>
                    )}

                    {cellTasks.length > 0 && (
                      <p className="mt-2 text-[10px] text-emerald-900/60">
                        {completedCount}/{cellTasks.length} done
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-emerald-900/15 bg-white p-3">
            <h4 className="font-display text-xl text-emerald-950">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h4>

            {!selectedTasks.length && (
              <p className="mt-3 text-sm text-emerald-900/70">No care tasks due on this day.</p>
            )}

            {selectedTasks.length > 0 && (
              <ul className="mt-3 grid gap-2 text-sm">
                {selectedTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`rounded-lg border p-2 ${
                      task.completed
                        ? 'border-emerald-900/10 bg-emerald-50/40 text-emerald-900/65'
                        : 'border-emerald-900/20 bg-white text-emerald-950'
                    }`}
                  >
                    <p className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                      {taskLabels[task.type] || task.type}
                    </p>
                    <p className="mt-0.5 text-xs">{task.plant_nickname}</p>
                    <ActionButton
                      className="mt-2 px-2 py-1 text-xs"
                      variant={task.completed ? 'secondary' : 'primary'}
                      onClick={() => onToggleTask(task.id)}
                    >
                      {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </Surface>
  )
}
