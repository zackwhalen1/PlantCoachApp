from __future__ import annotations

import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Tuple

LIGHT_ORDER = ["low", "medium", "bright_indirect", "direct"]
HUMIDITY_ORDER = ["low", "medium", "high"]

BASE_WATERING_BY_CATEGORY = {
    "succulent_like": 14,
    "cactus": 16,
    "trailing": 7,
    "fern": 4,
    "tropical": 6,
    "foliage": 8,
}

SOIL_FACTOR = {
    "cactus_mix": 1.35,
    "well_draining_mix": 1.15,
    "standard_potting_mix": 1.0,
    "moisture_retentive_mix": 0.82,
}

DRAINAGE_FACTOR = {
    "poor": 0.72,
    "fair": 0.86,
    "good": 1.0,
    "excellent": 1.15,
}

LIGHT_FACTOR = {
    "low": 1.2,
    "medium": 1.0,
    "bright_indirect": 0.9,
    "direct": 0.78,
}

HUMIDITY_FACTOR = {
    "low": 0.86,
    "medium": 1.0,
    "high": 1.12,
}

SEASON_FACTOR = {
    "winter": 1.25,
    "spring": 0.95,
    "summer": 0.82,
    "fall": 1.05,
}


def parse_temperature_range(range_text: str) -> Tuple[int, int]:
    parts = range_text.replace("F", "").replace("f", "").strip().split("-")
    if len(parts) == 2 and parts[0].strip().isdigit() and parts[1].strip().isdigit():
        return int(parts[0].strip()), int(parts[1].strip())
    return 65, 75


def parse_pot_size(pot_size: str) -> float:
    digits = "".join(ch for ch in pot_size if ch.isdigit() or ch == ".")
    if not digits:
        return 6.0
    return max(2.0, min(20.0, float(digits)))


def get_season(today: date | None = None) -> str:
    today = today or date.today()
    month = today.month
    if month in (12, 1, 2):
        return "winter"
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    return "fall"


def generate_care_schedule(plant: Dict[str, Any], environment: Dict[str, Any] | None) -> Dict[str, Any]:
    """Generate dynamic intervals based on environment and container/soil conditions.

    This intentionally avoids fixed watering rules and adjusts intervals from multiple factors.
    """
    category = plant.get("category", "foliage")
    soil = plant.get("soil_type", "standard_potting_mix")
    drainage = plant.get("drainage_quality", "good")

    pot_size = parse_pot_size(plant.get("pot_size", "6 in"))
    base_days = BASE_WATERING_BY_CATEGORY.get(category, 7)

    light_level = (environment or {}).get("light_level", "medium")
    humidity_level = (environment or {}).get("humidity_level", "medium")
    location_type = (environment or {}).get("location_type", "indoor")

    season = get_season()

    multiplier = (
        SOIL_FACTOR.get(soil, 1.0)
        * DRAINAGE_FACTOR.get(drainage, 1.0)
        * LIGHT_FACTOR.get(light_level, 1.0)
        * HUMIDITY_FACTOR.get(humidity_level, 1.0)
        * SEASON_FACTOR.get(season, 1.0)
    )

    # Larger pots dry more slowly. We cap the effect to keep recommendations practical.
    pot_factor = 1 + ((pot_size - 6) * 0.04)
    multiplier *= max(0.8, min(1.4, pot_factor))

    if location_type == "outdoor":
        multiplier *= 0.9

    watering_interval = max(2, min(21, round(base_days * multiplier)))
    soil_check_interval = max(2, round(watering_interval * 0.65))
    fertilize_interval = 28 if season in ("spring", "summer") else 45
    pest_interval = 7 if humidity_level == "high" else 10
    rotate_interval = 7 if light_level in ("bright_indirect", "direct") else 14
    repotting_days = 180 if category in ("trailing", "tropical") else 270

    reason = (
        f"Schedule tuned for {category} behavior with {light_level.replace('_', ' ')} light, "
        f"{humidity_level} humidity, {soil.replace('_', ' ')} soil, and {drainage} drainage in {season}."
    )

    return {
        "soil_check_interval_days": soil_check_interval,
        "watering_interval_days": watering_interval,
        "fertilizing_interval_days": fertilize_interval,
        "pest_inspection_interval_days": pest_interval,
        "repotting_reminder_days": repotting_days,
        "rotation_reminder_days": rotate_interval,
        "explanation": reason,
    }


def _distance_score(actual: str, preferred: List[str], order: List[str]) -> int:
    if actual in preferred:
        return 100
    if actual not in order:
        return 60

    actual_i = order.index(actual)
    best = min(abs(actual_i - order.index(v)) for v in preferred if v in order)
    return max(25, 100 - (best * 35))


def compatibility_score(
    plant: Dict[str, Any], environment: Dict[str, Any], species_db: List[Dict[str, Any]]
) -> Dict[str, Any]:
    species = next(
        (sp for sp in species_db if sp["scientific_name"].lower() == plant["species_name"].lower()), None
    )

    if not species:
        species = {
            "preferred_light": ["medium", "bright_indirect"],
            "preferred_humidity": ["medium"],
            "preferred_temp": [65, 80],
            "watering_difficulty": 3,
            "beginner_friendliness": 3,
        }

    light = _distance_score(environment["light_level"], species["preferred_light"], LIGHT_ORDER)
    humidity = _distance_score(
        environment["humidity_level"], species["preferred_humidity"], HUMIDITY_ORDER
    )

    env_lo, env_hi = parse_temperature_range(environment["temperature_range"])
    pref_lo, pref_hi = species["preferred_temp"]
    overlap = max(0, min(env_hi, pref_hi) - max(env_lo, pref_lo))
    spread = max(env_hi, pref_hi) - min(env_lo, pref_lo)
    temp = round((overlap / spread) * 100) if spread > 0 else 70

    watering_difficulty = species.get("watering_difficulty", 3)
    watering_score = max(35, 100 - ((watering_difficulty - 1) * 15))

    drainage_quality = plant.get("drainage_quality", "good")
    soil_type = plant.get("soil_type", "standard_potting_mix")
    drainage_score = {
        "poor": 35,
        "fair": 60,
        "good": 82,
        "excellent": 95,
    }.get(drainage_quality, 75)

    if "cactus" in soil_type or "well_draining" in soil_type:
        drainage_score = min(100, drainage_score + 5)

    beginner = species.get("beginner_friendliness", 3)
    beginner_score = beginner * 20

    weights = {
        "light_match": 0.24,
        "humidity_match": 0.18,
        "temperature_match": 0.2,
        "watering_difficulty": 0.14,
        "drainage_soil_match": 0.14,
        "beginner_friendliness": 0.1,
    }

    weighted_total = (
        light * weights["light_match"]
        + humidity * weights["humidity_match"]
        + temp * weights["temperature_match"]
        + watering_score * weights["watering_difficulty"]
        + drainage_score * weights["drainage_soil_match"]
        + beginner_score * weights["beginner_friendliness"]
    )

    total_score = int(round(weighted_total))

    strengths = []
    weaknesses = []

    for label, score in [
        ("Light", light),
        ("Humidity", humidity),
        ("Temperature", temp),
        ("Drainage and Soil", drainage_score),
    ]:
        if score >= 80:
            strengths.append(label)
        elif score <= 55:
            weaknesses.append(label)

    explanation = (
        f"Best fits: {', '.join(strengths) if strengths else 'none strong yet'}. "
        f"Watch-outs: {', '.join(weaknesses) if weaknesses else 'no major mismatches detected'}."
    )

    return {
        "total_score": total_score,
        "breakdown": {
            "light_match": light,
            "humidity_match": humidity,
            "temperature_match": temp,
            "watering_difficulty": watering_score,
            "drainage_soil_match": drainage_score,
            "beginner_friendliness": beginner_score,
        },
        "explanation": explanation,
    }


def diagnose(input_data: Dict[str, Any]) -> Dict[str, Any]:
    symptoms = set(input_data.get("symptoms", []))
    soil = input_data.get("soil_moisture")
    light = input_data.get("current_light_level")
    pests_visible = input_data.get("pests_visible", False)
    moved = input_data.get("recently_moved_or_repotted", False)

    causes: Dict[str, float] = {
        "Overwatering / root stress": 0.0,
        "Underwatering": 0.0,
        "Light stress": 0.0,
        "Pest pressure": 0.0,
        "Transplant shock": 0.0,
        "Nutrient imbalance": 0.0,
        "Fungal risk from saturation": 0.0,
    }

    if "yellow_leaves" in symptoms and soil == "wet":
        causes["Overwatering / root stress"] += 0.55
    if "yellow_leaves" in symptoms and soil == "dry":
        causes["Underwatering"] += 0.3
    if "drooping" in symptoms and soil == "wet":
        causes["Overwatering / root stress"] += 0.25
    if "drooping" in symptoms and soil == "dry":
        causes["Underwatering"] += 0.35
    if "crispy_brown_tips" in symptoms:
        causes["Underwatering"] += 0.2
        if light in ("bright_indirect", "direct"):
            causes["Light stress"] += 0.2
    if "black_spots" in symptoms:
        causes["Fungal risk from saturation"] += 0.4
    if "moldy_soil" in symptoms:
        causes["Fungal risk from saturation"] += 0.45
        causes["Overwatering / root stress"] += 0.2
    if "pests_visible" in symptoms or pests_visible:
        causes["Pest pressure"] += 0.6
    if "leaf_drop" in symptoms and moved:
        causes["Transplant shock"] += 0.5
    if "slow_growth" in symptoms:
        causes["Nutrient imbalance"] += 0.35
        if light == "low":
            causes["Light stress"] += 0.2

    ranked = [
        {
            "cause": cause,
            "confidence": min(0.95, max(0.1, round(score, 2))),
        }
        for cause, score in sorted(causes.items(), key=lambda x: x[1], reverse=True)
        if score > 0
    ]

    if not ranked:
        ranked = [{"cause": "General environmental stress", "confidence": 0.35}]

    actions = [
        "Inspect root zone moisture before watering again.",
        "Adjust light gradually instead of sudden moves.",
        "Remove heavily damaged leaves and monitor 7-10 days.",
    ]

    top = ranked[0]["cause"]
    if "Overwatering" in top:
        actions.insert(0, "Pause watering, improve drainage, and let top soil layer dry.")
    if "Underwatering" in top:
        actions.insert(0, "Deep-water evenly, then resume moisture checks every 2-3 days.")
    if "Pest" in top:
        actions.insert(0, "Isolate plant and begin leaf-by-leaf pest treatment.")

    return {
        "likely_causes": ranked,
        "recommended_actions": actions,
        "warning": "Diagnosis is not guaranteed. Observe changes and adjust care gradually.",
    }


def generate_tasks_for_plant(plant: Dict[str, Any], schedule: Dict[str, Any], days_ahead: int = 30):
    today = date.today()
    task_templates = [
        ("check_soil", schedule["soil_check_interval_days"]),
        ("water_if_needed", schedule["watering_interval_days"]),
        ("fertilize", schedule["fertilizing_interval_days"]),
        ("inspect_pests", schedule["pest_inspection_interval_days"]),
        ("rotate", schedule["rotation_reminder_days"]),
        ("growth_photo", 14),
        ("consider_repotting", schedule["repotting_reminder_days"]),
    ]

    generated = []
    for task_type, interval in task_templates:
        next_date = today + timedelta(days=interval)
        while next_date <= today + timedelta(days=days_ahead):
            generated.append(
                {
                    "id": f"{plant['id']}-{task_type}-{next_date.isoformat()}",
                    "plant_id": plant["id"],
                    "plant_nickname": plant["nickname"],
                    "type": task_type,
                    "due_date": next_date.isoformat(),
                    "completed": False,
                }
            )
            next_date += timedelta(days=interval)
    return generated


def summarize_dashboard(plants: List[Dict[str, Any]], tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    today = date.today()
    upcoming = sorted(tasks, key=lambda t: t["due_date"])
    needing_attention = [
        t
        for t in upcoming
        if not t["completed"] and datetime.fromisoformat(t["due_date"]).date() <= today + timedelta(days=2)
    ]

    recent = sorted(plants, key=lambda p: p.get("date_acquired", ""), reverse=True)[:4]

    risk_map: Dict[str, int] = {}
    for task in upcoming:
        if task["completed"]:
            continue
        due = datetime.fromisoformat(task["due_date"]).date()
        if due <= today + timedelta(days=1):
            risk_map[task["plant_id"]] = risk_map.get(task["plant_id"], 0) + 2
        elif due <= today + timedelta(days=4):
            risk_map[task["plant_id"]] = risk_map.get(task["plant_id"], 0) + 1

    highest_risk = sorted(
        [
            {
                "plant_id": pid,
                "risk_score": score,
                "plant_nickname": next(
                    (p["nickname"] for p in plants if p["id"] == pid),
                    "Unknown",
                ),
            }
            for pid, score in risk_map.items()
        ],
        key=lambda x: x["risk_score"],
        reverse=True,
    )[:4]

    return {
        "plant_count": len(plants),
        "plants_needing_attention": len(needing_attention),
        "upcoming_tasks": upcoming[:8],
        "highest_risk_plants": highest_risk,
        "recently_added": recent,
    }


def planter_recommendation_score(
    species: Dict[str, Any], preferences: Dict[str, Any], environments: List[Dict[str, Any]]
) -> float:
    score = 50.0

    tag_likes = preferences.get("tag_likes", {})
    tag_dislikes = preferences.get("tag_dislikes", {})
    for tag in species.get("tags", []):
        score += tag_likes.get(tag, 0) * 7
        score -= tag_dislikes.get(tag, 0) * 6

    # Environment-fit boost: prioritize species that match at least one saved environment.
    for env in environments:
        if env["light_level"] in species.get("preferred_light", []):
            score += 6
        if env["humidity_level"] in species.get("preferred_humidity", []):
            score += 4

    if species["id"] in preferences.get("dismissed", []):
        score -= 50

    if species["id"] in preferences.get("interested", []):
        score += 25

    return max(0, min(100, score))


def update_preference_counters(preferences: Dict[str, Any], species: Dict[str, Any], action: str):
    tag_key = "tag_likes" if action == "interested" else "tag_dislikes"
    prefs = preferences.setdefault(tag_key, {})
    for tag in species.get("tags", []):
        prefs[tag] = prefs.get(tag, 0) + 1
