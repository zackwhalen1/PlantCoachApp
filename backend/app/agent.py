import json
import os
from typing import Any, Dict, List
from urllib.error import URLError
from urllib.request import Request, urlopen

DEFAULT_OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


def _compact_context(plants: List[Dict[str, Any]], environments: List[Dict[str, Any]], tasks: List[Dict[str, Any]]) -> str:
    env_map = {env["id"]: env for env in environments}

    plant_lines = []
    for plant in plants[:15]:
        env = env_map.get(plant.get("environment_id"))
        env_summary = (
            f"{env['name']} ({env['light_level']} light, {env['humidity_level']} humidity)"
            if env
            else "unassigned"
        )
        plant_lines.append(
            f"- {plant['nickname']} ({plant['common_name']}, {plant['species_name']}), "
            f"soil={plant['soil_type']}, drainage={plant['drainage_quality']}, env={env_summary}"
        )

    task_lines = []
    for task in tasks:
        if task.get("completed"):
            continue
        task_lines.append(
            f"- {task['plant_nickname']}: {task['type']} due {task['due_date']}"
        )
        if len(task_lines) >= 20:
            break

    return (
        "Plants:\n"
        + ("\n".join(plant_lines) if plant_lines else "- none")
        + "\n\nUpcoming Tasks:\n"
        + ("\n".join(task_lines) if task_lines else "- none")
    )


def ask_local_agent(
    question: str,
    plants: List[Dict[str, Any]],
    environments: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Try local Ollama first and return structured response metadata."""
    context = _compact_context(plants, environments, tasks)

    system = (
        "You are Plant Coach for GreenrThumb. Give concise, practical houseplant care advice "
        "based on the provided user data. If unsure, say what to monitor next. "
        "Do not invent plants not in the context."
    )

    prompt = (
        f"System: {system}\n\n"
        f"User Question: {question}\n\n"
        f"User Data:\n{context}\n\n"
        "Answer in 4-7 sentences. Include specific next actions."
    )

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.3},
    }

    body = json.dumps(payload).encode("utf-8")
    request = Request(
        url=f"{DEFAULT_OLLAMA_URL}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            parsed = json.loads(response.read().decode("utf-8"))
            reply = parsed.get("response", "").strip()
            if reply:
                return {
                    "reply": reply,
                    "mode": "local-llm",
                    "model": DEFAULT_MODEL,
                }
    except (URLError, TimeoutError, json.JSONDecodeError):
        pass

    return {
        "reply": (
            "Local AI model is unavailable. Start Ollama locally and pull a model, then try again. "
            "Using built-in rules for now."
        ),
        "mode": "fallback-required",
        "model": DEFAULT_MODEL,
    }
