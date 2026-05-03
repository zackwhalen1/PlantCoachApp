from app.logic import diagnose, generate_care_schedule


def test_diagnosis_flags_overwatering_for_yellow_and_wet_soil():
    result = diagnose(
        {
            "symptoms": ["yellow_leaves"],
            "soil_moisture": "wet",
            "current_light_level": "medium",
            "pests_visible": False,
            "recently_moved_or_repotted": False,
        }
    )
    assert result["likely_causes"][0]["cause"] == "Overwatering / root stress"


def test_schedule_changes_by_environment_conditions():
    plant = {
        "category": "trailing",
        "soil_type": "well_draining_mix",
        "drainage_quality": "good",
        "pot_size": "6 in",
    }

    low_light_env = {
        "light_level": "low",
        "humidity_level": "low",
        "location_type": "indoor",
    }

    bright_env = {
        "light_level": "direct",
        "humidity_level": "high",
        "location_type": "outdoor",
    }

    one = generate_care_schedule(plant, low_light_env)
    two = generate_care_schedule(plant, bright_env)

    assert one["watering_interval_days"] != two["watering_interval_days"]
