import json
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List

from .sample_data import SAMPLE_ENVIRONMENTS, SAMPLE_PLANTS, SAMPLE_SPECIES

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
FILES = {
    "plants": DATA_DIR / "plants.json",
    "environments": DATA_DIR / "environments.json",
    "tasks": DATA_DIR / "tasks.json",
    "planter_preferences": DATA_DIR / "planter_preferences.json",
    "species": DATA_DIR / "species.json",
}

_lock = Lock()


def _write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def initialize_data_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not FILES["plants"].exists():
        _write_json(FILES["plants"], SAMPLE_PLANTS)

    if not FILES["environments"].exists():
        _write_json(FILES["environments"], SAMPLE_ENVIRONMENTS)

    if not FILES["tasks"].exists():
        _write_json(FILES["tasks"], [])

    if not FILES["planter_preferences"].exists():
        _write_json(
            FILES["planter_preferences"],
            {"interested": [], "dismissed": [], "tag_likes": {}, "tag_dislikes": {}},
        )

    if not FILES["species"].exists():
        _write_json(FILES["species"], SAMPLE_SPECIES)


def read_collection(name: str) -> List[Dict[str, Any]]:
    with _lock:
        return json.loads(FILES[name].read_text(encoding="utf-8"))


def write_collection(name: str, data: List[Dict[str, Any]]) -> None:
    with _lock:
        _write_json(FILES[name], data)


def read_planter_preferences() -> Dict[str, Any]:
    with _lock:
        return json.loads(FILES["planter_preferences"].read_text(encoding="utf-8"))


def write_planter_preferences(preferences: Dict[str, Any]) -> None:
    with _lock:
        _write_json(FILES["planter_preferences"], preferences)
