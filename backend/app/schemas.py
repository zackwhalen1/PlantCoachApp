from typing import List, Literal, Optional

from pydantic import BaseModel, Field


LightLevel = Literal["low", "medium", "bright_indirect", "direct"]
HumidityLevel = Literal["low", "medium", "high"]


class EnvironmentBase(BaseModel):
    name: str
    location_type: Literal["indoor", "outdoor"]
    light_level: LightLevel
    humidity_level: HumidityLevel
    temperature_range: str
    airflow_level: str
    distance_from_window: str
    notes: str = ""


class Environment(EnvironmentBase):
    id: str


class PlantBase(BaseModel):
    nickname: str
    common_name: str
    species_name: str
    category: str
    date_acquired: str
    pot_size: str
    soil_type: str
    drainage_quality: Literal["poor", "fair", "good", "excellent"]
    environment_id: Optional[str] = None
    notes: str = ""


class Plant(PlantBase):
    id: str


class DiagnosisInput(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    soil_moisture: Literal["wet", "dry", "normal"]
    current_light_level: LightLevel
    pests_visible: bool
    recently_moved_or_repotted: bool


class CompatibilityRequest(BaseModel):
    plant_id: str
    environment_id: str


class PlanterAction(BaseModel):
    species_id: str
    action: Literal["interested", "dismissed"]


class PlantCoachQuestion(BaseModel):
    question: str


class AddSavedPlantRequest(BaseModel):
    species_id: str
    nickname: Optional[str] = None
    environment_id: Optional[str] = None
