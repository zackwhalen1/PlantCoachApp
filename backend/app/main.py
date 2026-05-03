from datetime import date
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .logic import (
    compatibility_score,
    diagnose,
    generate_care_schedule,
    generate_tasks_for_plant,
    planter_recommendation_score,
    summarize_dashboard,
    update_preference_counters,
)
from .schemas import (
    AddSavedPlantRequest,
    CompatibilityRequest,
    DiagnosisInput,
    Environment,
    EnvironmentBase,
    PlanterAction,
    Plant,
    PlantBase,
    PlantCoachQuestion,
)
from .storage import (
    initialize_data_files,
    read_collection,
    read_planter_preferences,
    write_collection,
    write_planter_preferences,
)

app = FastAPI(title="GreenrThumb API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    initialize_data_files()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/plants")
def list_plants():
    return read_collection("plants")


@app.post("/plants", response_model=Plant)
def create_plant(payload: PlantBase):
    plants = read_collection("plants")
    new_plant = {"id": f"plant-{uuid4().hex[:8]}", **payload.model_dump()}
    plants.append(new_plant)
    write_collection("plants", plants)
    return new_plant


@app.put("/plants/{plant_id}")
def update_plant(plant_id: str, payload: PlantBase):
    plants = read_collection("plants")
    for index, plant in enumerate(plants):
        if plant["id"] == plant_id:
            plants[index] = {"id": plant_id, **payload.model_dump()}
            write_collection("plants", plants)
            return plants[index]
    raise HTTPException(status_code=404, detail="Plant not found")


@app.delete("/plants/{plant_id}")
def delete_plant(plant_id: str):
    plants = read_collection("plants")
    tasks = read_collection("tasks")
    next_plants = [p for p in plants if p["id"] != plant_id]
    if len(next_plants) == len(plants):
        raise HTTPException(status_code=404, detail="Plant not found")

    write_collection("plants", next_plants)
    write_collection("tasks", [t for t in tasks if t["plant_id"] != plant_id])
    return {"deleted": True}


@app.get("/environments")
def list_environments():
    return read_collection("environments")


@app.post("/environments", response_model=Environment)
def create_environment(payload: EnvironmentBase):
    envs = read_collection("environments")
    env = {"id": f"env-{uuid4().hex[:8]}", **payload.model_dump()}
    envs.append(env)
    write_collection("environments", envs)
    return env


@app.put("/environments/{environment_id}")
def update_environment(environment_id: str, payload: EnvironmentBase):
    envs = read_collection("environments")
    for index, env in enumerate(envs):
        if env["id"] == environment_id:
            envs[index] = {"id": environment_id, **payload.model_dump()}
            write_collection("environments", envs)
            return envs[index]
    raise HTTPException(status_code=404, detail="Environment not found")


@app.delete("/environments/{environment_id}")
def delete_environment(environment_id: str):
    envs = read_collection("environments")
    plants = read_collection("plants")

    next_envs = [e for e in envs if e["id"] != environment_id]
    if len(next_envs) == len(envs):
        raise HTTPException(status_code=404, detail="Environment not found")

    for plant in plants:
        if plant.get("environment_id") == environment_id:
            plant["environment_id"] = None

    write_collection("environments", next_envs)
    write_collection("plants", plants)
    return {"deleted": True}


@app.get("/schedules")
def get_all_schedules():
    plants = read_collection("plants")
    environments = read_collection("environments")
    env_map = {e["id"]: e for e in environments}

    return [
        {
            "plant_id": plant["id"],
            "plant_nickname": plant["nickname"],
            "schedule": generate_care_schedule(plant, env_map.get(plant.get("environment_id"))),
        }
        for plant in plants
    ]


@app.get("/schedules/{plant_id}")
def get_schedule_for_plant(plant_id: str):
    plants = read_collection("plants")
    environments = read_collection("environments")
    env_map = {e["id"]: e for e in environments}

    plant = next((p for p in plants if p["id"] == plant_id), None)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    return {
        "plant_id": plant["id"],
        "schedule": generate_care_schedule(plant, env_map.get(plant.get("environment_id"))),
    }


@app.post("/compatibility")
def get_compatibility(payload: CompatibilityRequest):
    plants = read_collection("plants")
    environments = read_collection("environments")
    species = read_collection("species")

    plant = next((p for p in plants if p["id"] == payload.plant_id), None)
    env = next((e for e in environments if e["id"] == payload.environment_id), None)

    if not plant or not env:
        raise HTTPException(status_code=404, detail="Plant or environment not found")

    return compatibility_score(plant, env, species)


@app.post("/diagnosis")
def run_diagnosis(payload: DiagnosisInput):
    return diagnose(payload.model_dump())


@app.post("/tasks/refresh")
def refresh_tasks():
    plants = read_collection("plants")
    environments = read_collection("environments")
    existing = read_collection("tasks")
    env_map = {e["id"]: e for e in environments}

    completed_ids = {task["id"] for task in existing if task.get("completed")}
    generated = []
    for plant in plants:
        schedule = generate_care_schedule(plant, env_map.get(plant.get("environment_id")))
        generated.extend(generate_tasks_for_plant(plant, schedule))

    unique_by_id = {}
    for task in generated:
        task["completed"] = task["id"] in completed_ids
        unique_by_id[task["id"]] = task

    merged = sorted(unique_by_id.values(), key=lambda t: t["due_date"])
    write_collection("tasks", merged)
    return merged


@app.get("/tasks")
def get_tasks():
    tasks = read_collection("tasks")
    return sorted(tasks, key=lambda t: t["due_date"])


@app.patch("/tasks/{task_id}/complete")
def toggle_task_complete(task_id: str):
    tasks = read_collection("tasks")
    for task in tasks:
        if task["id"] == task_id:
            task["completed"] = not task.get("completed", False)
            write_collection("tasks", tasks)
            return task
    raise HTTPException(status_code=404, detail="Task not found")


@app.get("/dashboard")
def dashboard():
    plants = read_collection("plants")
    tasks = read_collection("tasks")
    return summarize_dashboard(plants, tasks)


@app.get("/planter/discover")
def planter_discover():
    species = read_collection("species")
    envs = read_collection("environments")
    prefs = read_planter_preferences()

    scored = []
    for item in species:
        scored.append(
            {
                **item,
                "recommendation_score": planter_recommendation_score(item, prefs, envs),
            }
        )

    ranked = sorted(scored, key=lambda s: s["recommendation_score"], reverse=True)
    return ranked


@app.post("/planter/action")
def planter_action(payload: PlanterAction):
    species = read_collection("species")
    prefs = read_planter_preferences()

    selected = next((s for s in species if s["id"] == payload.species_id), None)
    if not selected:
        raise HTTPException(status_code=404, detail="Species not found")

    if payload.action == "interested":
        if payload.species_id not in prefs["interested"]:
            prefs["interested"].append(payload.species_id)
        prefs["dismissed"] = [sid for sid in prefs["dismissed"] if sid != payload.species_id]
    else:
        if payload.species_id not in prefs["dismissed"]:
            prefs["dismissed"].append(payload.species_id)
        prefs["interested"] = [sid for sid in prefs["interested"] if sid != payload.species_id]

    update_preference_counters(prefs, selected, payload.action)
    write_planter_preferences(prefs)
    return {"saved": True, "preferences": prefs}


@app.get("/planter/saved")
def planter_saved():
    species = read_collection("species")
    prefs = read_planter_preferences()
    interested = set(prefs.get("interested", []))
    return [item for item in species if item["id"] in interested]


@app.post("/planter/add-to-collection")
def add_saved_to_collection(payload: AddSavedPlantRequest):
    species = read_collection("species")
    plants = read_collection("plants")

    selected = next((s for s in species if s["id"] == payload.species_id), None)
    if not selected:
        raise HTTPException(status_code=404, detail="Species not found")

    nickname = payload.nickname or selected["common_name"]
    new_plant = {
        "id": f"plant-{uuid4().hex[:8]}",
        "nickname": nickname,
        "common_name": selected["common_name"],
        "species_name": selected["scientific_name"],
        "category": selected.get("category", "foliage"),
        "date_acquired": str(date.today()),
        "pot_size": "6 in",
        "soil_type": "standard_potting_mix",
        "drainage_quality": "good",
        "environment_id": payload.environment_id,
        "notes": "Added from Planter discovery.",
    }

    plants.append(new_plant)
    write_collection("plants", plants)
    return new_plant


@app.post("/plant-coach")
def plant_coach(payload: PlantCoachQuestion):
    question = payload.question.lower()
    plants = read_collection("plants")
    tasks = read_collection("tasks")

    if "water" in question:
        due = [t for t in tasks if t["type"] == "water_if_needed" and not t["completed"]][:3]
        if due:
            names = ", ".join(t["plant_nickname"] for t in due)
            return {
                "reply": f"Focus on soil checks for {names}. Water only if the top layer is dry.",
                "mode": "rule-based",
            }
        return {"reply": "No immediate watering tasks. Keep checking soil before watering.", "mode": "rule-based"}

    if "beginner" in question or "easy" in question:
        easy = [p["nickname"] for p in plants if p.get("category") in ("succulent_like", "foliage")]
        reply = ", ".join(easy[:4]) if easy else "Snake Plant or Pothos"
        return {"reply": f"Beginner-friendly picks in your collection: {reply}.", "mode": "rule-based"}

    return {
        "reply": "Plant Coach stub: I can summarize watering, risk, and environment fit from your saved data.",
        "mode": "rule-based",
    }
