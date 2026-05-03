# GreenrThumb

GreenrThumb is a design-centered plant care web app for managing houseplants with environment-aware schedules, compatibility scoring, diagnosis guidance, a care calendar, and a swipe-style discovery experience called Planter.

## Features

- Plant Profile Manager (create, view, edit, delete)
- Room/Environment Profile Manager (create, view, edit, delete)
- Personalized care schedule generation based on plant category, soil, drainage, humidity, light, pot size, and season
- Plant compatibility scoring (0-100) with category-level breakdown and plain-language explanation
- Symptom diagnosis wizard with ranked causes, confidence, actions, and caution note
- Care calendar with chronological tasks and completion toggles
- Dashboard with collection and risk summary
- Plant Coach rule-based assistant stub (AI-ready module)
- Planter discovery with Interested/Not Interested decisions, saved species list, recommendation logic, and add-to-collection flow

## Technology Stack

- Frontend: React + Vite
- Styling: Tailwind CSS (v4)
- Backend: FastAPI
- Storage: Local JSON files (generated in `backend/data`)
- Charts: Recharts
- Testing: Pytest (backend logic tests)

## Project Structure

- `frontend`: React application
- `backend`: FastAPI API and care logic
- `backend/app/sample_data.py`: seeded plant species, sample plants, and sample environments
- `backend/tests/test_logic.py`: example tests for diagnosis and schedule behavior

## Setup Instructions

### Prerequisites

- Node.js 20+
- Python 3.10+

### 1) Backend setup

```powershell
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 8000
```

Backend URL: `http://localhost:8000`

### 2) Frontend setup

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## How to Run Tests

```powershell
cd backend
py -m pytest -q
```

## API Notes

Main endpoints:

- `GET /plants`, `POST /plants`, `PUT /plants/{id}`, `DELETE /plants/{id}`
- `GET /environments`, `POST /environments`, `PUT /environments/{id}`, `DELETE /environments/{id}`
- `GET /schedules`
- `POST /compatibility`
- `POST /diagnosis`
- `POST /tasks/refresh`, `GET /tasks`, `PATCH /tasks/{id}/complete`
- `GET /dashboard`
- `GET /planter/discover`, `POST /planter/action`, `GET /planter/saved`, `POST /planter/add-to-collection`
- `POST /plant-coach`

## Known Limitations

- Diagnosis is heuristic/rule-based and not a medical-grade model for plant pathology.
- Task generation is interval-based and does not yet track true last-completed timestamps per care type.
- Plant image URLs are seeded placeholders.
- No user authentication or multi-user support in this first version.

## Future Improvements

- Add true swipe gestures and animations for Planter cards.
- Add per-task history and adaptive schedule feedback loops.
- Integrate weather API for outdoor environment adjustments.
- Add export/import and optional SQLite migration.
- Upgrade Plant Coach from rule-based responses to an LLM with retrieval from profile/task data.
