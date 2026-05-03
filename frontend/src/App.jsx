import { useEffect, useMemo, useState } from 'react'

import { api } from './api'
import { CareCalendarView } from './components/CareCalendarView'
import { CompatibilityPanel } from './components/CompatibilityPanel'
import { DashboardView } from './components/DashboardView'
import { DiagnosisWizard } from './components/DiagnosisWizard'
import { EnvironmentForm } from './components/EnvironmentForm'
import { FloatingCoachWidget } from './components/FloatingCoachWidget'
import { PlanterView } from './components/PlanterView'
import { PlantForm } from './components/PlantForm'
import { ActionButton, EmptyState, SectionTitle, Surface } from './components/UI'

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'plants', label: 'Plants' },
  { key: 'environments', label: 'Environments' },
  { key: 'schedule', label: 'Care Plans' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'compatibility', label: 'Compatibility' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'planter', label: 'PlantR' },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const [plants, setPlants] = useState([])
  const [environments, setEnvironments] = useState([])
  const [schedules, setSchedules] = useState([])
  const [tasks, setTasks] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [discover, setDiscover] = useState([])
  const [saved, setSaved] = useState([])

  const [editingPlant, setEditingPlant] = useState(null)
  const [editingEnvironment, setEditingEnvironment] = useState(null)

  const [statusMessage, setStatusMessage] = useState('Loading GreenrThumb...')

  const envMap = useMemo(
    () => Object.fromEntries(environments.map((env) => [env.id, env.name])),
    [environments],
  )

  async function refreshCoreData() {
    const [
      plantsResponse,
      environmentsResponse,
      schedulesResponse,
      tasksResponse,
      dashboardResponse,
      discoverResponse,
      savedResponse,
    ] = await Promise.all([
      api.listPlants(),
      api.listEnvironments(),
      api.schedules(),
      api.tasks(),
      api.dashboard(),
      api.planterDiscover(),
      api.planterSaved(),
    ])

    setPlants(plantsResponse)
    setEnvironments(environmentsResponse)
    setSchedules(schedulesResponse)
    setTasks(tasksResponse)
    setDashboard(dashboardResponse)
    setDiscover(discoverResponse)
    setSaved(savedResponse)
  }

  async function refreshEverything() {
    setStatusMessage('Refreshing tasks and insights...')
    await api.refreshTasks()
    await refreshCoreData()
    setStatusMessage('GreenrThumb is up to date.')
  }

  useEffect(() => {
    refreshEverything().catch(() => {
      setStatusMessage('Unable to connect. Start backend at http://localhost:8000')
    })
  }, [])

  async function handleCreatePlant(payload) {
    if (editingPlant) {
      await api.updatePlant(editingPlant.id, payload)
      setStatusMessage('Plant updated.')
    } else {
      await api.createPlant(payload)
      setStatusMessage('Plant created.')
    }
    setEditingPlant(null)
    await refreshEverything()
  }

  async function handleDeletePlant(plantId) {
    await api.deletePlant(plantId)
    setStatusMessage('Plant deleted.')
    await refreshEverything()
  }

  async function handleCreateEnvironment(payload) {
    if (editingEnvironment) {
      await api.updateEnvironment(editingEnvironment.id, payload)
      setStatusMessage('Environment updated.')
    } else {
      await api.createEnvironment(payload)
      setStatusMessage('Environment created.')
    }
    setEditingEnvironment(null)
    await refreshEverything()
  }

  async function handleDeleteEnvironment(environmentId) {
    await api.deleteEnvironment(environmentId)
    setStatusMessage('Environment deleted. Assigned plants are now unassigned.')
    await refreshEverything()
  }

  async function handleToggleTask(taskId) {
    await api.toggleTask(taskId)
    await refreshCoreData()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7,_#fefce8_45%,_#ecfccb_100%)] pb-12">
      <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-white/75 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-800">GreenrThumb</p>
              <h1 className="font-display text-3xl text-emerald-950 md:text-4xl">Plant Care Made Easy</h1>
            </div>
            <p className="max-w-md text-sm text-emerald-900/70">{statusMessage}</p>
          </div>
          <nav className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeTab === tab.key
                    ? 'bg-emerald-700 text-white'
                    : 'border border-emerald-900/20 bg-white text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto mt-6 grid max-w-7xl gap-5 px-4 md:px-8">
        {activeTab === 'dashboard' && (
          <DashboardView data={dashboard} onQuickAction={setActiveTab} onNavigate={setActiveTab} />
        )}

        {activeTab === 'plants' && (
          <Surface>
            <SectionTitle
              title="Plant Manager"
              subtitle="Create, edit, assign, and track individual plant records."
            />
            <PlantForm
              environments={environments}
              speciesCatalog={discover}
              initialValue={editingPlant}
              onSubmit={handleCreatePlant}
              onCancel={editingPlant ? () => setEditingPlant(null) : null}
            />

            {!plants.length && (
              <div className="mt-4">
                <EmptyState title="No plants yet" description="Add your first houseplant to begin personalized scheduling." />
              </div>
            )}

            {plants.length > 0 && (
              <ul className="mt-5 grid gap-2 text-sm">
                {plants.map((plant) => (
                  <li key={plant.id} className="rounded-lg border border-emerald-900/15 bg-white p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-emerald-950">{plant.nickname} ({plant.common_name})</p>
                        <p className="text-emerald-900/70">
                          {plant.species_name} · {plant.soil_type} · {plant.drainage_quality} drainage ·{' '}
                          {envMap[plant.environment_id] || 'Unassigned'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton variant="secondary" className="px-2 py-1 text-xs" onClick={() => setEditingPlant(plant)}>
                          Edit
                        </ActionButton>
                        <ActionButton variant="danger" className="px-2 py-1 text-xs" onClick={() => handleDeletePlant(plant.id)}>
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        )}

        {activeTab === 'environments' && (
          <Surface>
            <SectionTitle
              title="Room / Environment Manager"
              subtitle="Model room conditions to power compatibility and care logic."
            />
            <EnvironmentForm
              initialValue={editingEnvironment}
              onSubmit={handleCreateEnvironment}
              onCancel={editingEnvironment ? () => setEditingEnvironment(null) : null}
            />

            {!environments.length && (
              <div className="mt-4">
                <EmptyState title="No environments yet" description="Create at least one room profile to assign plants." />
              </div>
            )}

            {environments.length > 0 && (
              <ul className="mt-5 grid gap-2 text-sm">
                {environments.map((environment) => (
                  <li key={environment.id} className="rounded-lg border border-emerald-900/15 bg-white p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-emerald-950">{environment.name}</p>
                        <p className="text-emerald-900/70">
                          {environment.location_type} · {environment.light_level} light · {environment.humidity_level} humidity ·{' '}
                          {environment.temperature_range} F
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton variant="secondary" className="px-2 py-1 text-xs" onClick={() => setEditingEnvironment(environment)}>
                          Edit
                        </ActionButton>
                        <ActionButton
                          variant="danger"
                          className="px-2 py-1 text-xs"
                          onClick={() => handleDeleteEnvironment(environment.id)}
                        >
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        )}

        {activeTab === 'schedule' && (
          <Surface>
            <SectionTitle title="Personalized Care Schedules" subtitle="Rule-based plans adapt to species, room conditions, and container setup." />
            {!schedules.length && (
              <div className="mt-4">
                <EmptyState title="No schedules yet" description="Add plants and refresh tasks to generate schedules." />
              </div>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {schedules.map((entry) => (
                <article key={entry.plant_id} className="rounded-lg border border-emerald-900/15 bg-emerald-50/45 p-3 text-sm text-emerald-900">
                  <h3 className="font-display text-lg text-emerald-950">{entry.plant_nickname}</h3>
                  <ul className="mt-2 grid gap-1">
                    <li>Soil check every {entry.schedule.soil_check_interval_days} days</li>
                    <li>Watering estimate every {entry.schedule.watering_interval_days} days</li>
                    <li>Fertilize every {entry.schedule.fertilizing_interval_days} days</li>
                    <li>Pest inspection every {entry.schedule.pest_inspection_interval_days} days</li>
                    <li>Rotation every {entry.schedule.rotation_reminder_days} days</li>
                    <li>Repotting reminder every {entry.schedule.repotting_reminder_days} days</li>
                  </ul>
                  <p className="mt-2 text-xs text-emerald-900/75">{entry.schedule.explanation}</p>
                </article>
              ))}
            </div>
          </Surface>
        )}

        {activeTab === 'calendar' && (
          <CareCalendarView tasks={tasks} plants={plants} onToggleTask={handleToggleTask} onRefresh={refreshEverything} />
        )}

        {activeTab === 'compatibility' && <CompatibilityPanel plants={plants} environments={environments} />}

        {activeTab === 'diagnosis' && <DiagnosisWizard />}

        {activeTab === 'planter' && (
          <PlanterView
            discover={discover}
            saved={saved}
            environments={environments}
            onUpdated={refreshEverything}
          />
        )}
      </main>

      <FloatingCoachWidget />
    </div>
  )
}

export default App
