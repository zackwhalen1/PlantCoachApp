const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new Error(errorPayload.detail || 'Request failed')
  }

  return response.json()
}

export const api = {
  listPlants: () => request('/plants'),
  createPlant: (payload) => request('/plants', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlant: (id, payload) => request(`/plants/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePlant: (id) => request(`/plants/${id}`, { method: 'DELETE' }),

  listEnvironments: () => request('/environments'),
  createEnvironment: (payload) => request('/environments', { method: 'POST', body: JSON.stringify(payload) }),
  updateEnvironment: (id, payload) => request(`/environments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEnvironment: (id) => request(`/environments/${id}`, { method: 'DELETE' }),

  schedules: () => request('/schedules'),
  runCompatibility: (payload) => request('/compatibility', { method: 'POST', body: JSON.stringify(payload) }),
  runDiagnosis: (payload) => request('/diagnosis', { method: 'POST', body: JSON.stringify(payload) }),

  refreshTasks: () => request('/tasks/refresh', { method: 'POST' }),
  tasks: () => request('/tasks'),
  toggleTask: (id) => request(`/tasks/${id}/complete`, { method: 'PATCH' }),

  dashboard: () => request('/dashboard'),

  planterDiscover: () => request('/planter/discover'),
  planterAction: (payload) => request('/planter/action', { method: 'POST', body: JSON.stringify(payload) }),
  planterSaved: () => request('/planter/saved'),
  removeSavedSpecies: (speciesId) => request(`/planter/saved/${speciesId}`, { method: 'DELETE' }),
  addSavedToCollection: (payload) => request('/planter/add-to-collection', { method: 'POST', body: JSON.stringify(payload) }),

  askPlantCoach: (payload) => request('/plant-coach', { method: 'POST', body: JSON.stringify(payload) }),
}
