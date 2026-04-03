from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BENCH = ROOT.parent / "virtue-bench"
SOURCE = BENCH / "public" / "data"
DEST = ROOT / "public" / "data"

FRAME_ORDER = ["preserve", "actual", "bare", "character", "duty", "resist"]
SHOWCASE_ITEM_IDS = {
    "courage": 2,
}
SHOWCASE_DECKS = (
    {
        "kind": "benchmark",
        "label": "Actual",
        "description": "One direct item under the default framing.",
    },
    {
        "kind": "sharedFlip",
        "label": "Shared flip",
        "description": "Same item, different outcome under resist.",
    },
    {
        "kind": "stableFailure",
        "label": "Stable failure",
        "description": "Resist still fails.",
    },
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=True))


def build_summary(raw_summary: dict[str, Any]) -> dict[str, Any]:
    return {
        "generatedAt": raw_summary["generatedAt"],
        "files": raw_summary["files"],
        "featuredModels": raw_summary["featuredModels"],
        "frames": raw_summary["frames"],
        "virtues": {
            virtue: {
                "scores": payload["scores"],
                "itemCount": payload["itemCount"],
            }
            for virtue, payload in raw_summary["virtues"].items()
        },
        "models": raw_summary["models"],
    }


def trim_item(raw_item: dict[str, Any]) -> dict[str, Any]:
    item = {
        "id": raw_item["id"],
        "source": raw_item["source"],
        "target": raw_item["target"],
        "optionA": raw_item["optionA"],
        "optionB": raw_item["optionB"],
        "flags": raw_item["flags"],
        "responses": {
            display: {"frames": response["frames"]}
            for display, response in raw_item["responses"].items()
        },
    }

    if raw_item.get("prompt"):
        item["prompt"] = raw_item["prompt"]

    return item


def build_virtue_payload(raw_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "virtue": raw_payload["virtue"],
        "items": [trim_item(item) for item in raw_payload["items"]],
    }


def get_benchmark_response(frames: dict[str, Any]) -> list[dict[str, Any]] | None:
    order = list(dict.fromkeys(["actual", "resist", *FRAME_ORDER]))

    for frame in order:
        response = frames.get(frame)
        if response and response.get("answer") and response.get("rationale"):
            return [
                {
                    "frame": frame,
                    "label": "Sample answer",
                    "response": response,
                }
            ]

    return None


def get_showcase_model_options(
    item: dict[str, Any],
    kind: str,
    model_order: list[str],
) -> list[dict[str, Any]]:
    options: list[dict[str, Any]] = []

    for model in model_order:
        frames = item["responses"].get(model, {}).get("frames", {})

        if kind == "benchmark":
            responses = get_benchmark_response(frames)
            if responses:
                options.append({"model": model, "responses": responses})
            continue

        actual = frames.get("actual")
        resist = frames.get("resist")
        if not actual or not resist:
            continue

        if kind == "sharedFlip" and (actual["correct"] or not resist["correct"]):
            continue
        if kind == "stableFailure" and resist["correct"]:
            continue

        options.append(
            {
                "model": model,
                "responses": [
                    {"frame": "actual", "label": "Actual", "response": actual},
                    {"frame": "resist", "label": "Resist", "response": resist},
                ],
            }
        )

    return options


def build_showcase_entry(
    item: dict[str, Any],
    kind: str,
    description: str,
    model_order: list[str],
) -> dict[str, Any] | None:
    model_options = get_showcase_model_options(item, kind, model_order)
    if not model_options:
        return None

    slim_item = {
        "id": item["id"],
        "source": item["source"],
        "target": item["target"],
        "optionA": item["optionA"],
        "optionB": item["optionB"],
    }
    if item.get("prompt"):
        slim_item["prompt"] = item["prompt"]

    return {
        "kind": kind,
        "item": slim_item,
        "model": model_options[0]["model"],
        "description": description,
        "modelOptions": model_options,
    }


def build_overview_virtue(
    virtue: str,
    items: list[dict[str, Any]],
    featured_models: list[str],
    available_models: list[str],
) -> dict[str, Any]:
    model_order = [
        *featured_models,
        *[model for model in available_models if model not in featured_models],
    ]
    preferred_ids = []
    showcase_id = SHOWCASE_ITEM_IDS.get(virtue)
    if showcase_id is not None:
        preferred_ids.append(showcase_id)
    preferred_ids.extend(item["id"] for item in items if item["id"] not in preferred_ids)
    items_by_id = {item["id"]: item for item in items}

    benchmark_entries = [
        build_showcase_entry(
            items_by_id[item_id],
            "benchmark",
            "Representative benchmark item with one model answer.",
            model_order,
        )
        for item_id in preferred_ids
        if item_id in items_by_id
    ]

    shared_flip_entries = [
        build_showcase_entry(
            item,
            "sharedFlip",
            "A featured model misses under actual, then recovers under resist.",
            model_order,
        )
        for item in items
        if item["flags"]["featuredSharedFlip"]
    ]

    stable_failure_entries = [
        build_showcase_entry(
            item,
            "stableFailure",
            "Even under resist framing, the tempting choice still wins.",
            model_order,
        )
        for item in items
        if item["flags"]["featuredStableFailure"]
    ]

    decks = [
        {
            **deck,
            "entries": [
                entry
                for entry in entries
                if entry is not None
            ],
        }
        for deck, entries in zip(
            SHOWCASE_DECKS,
            [benchmark_entries, shared_flip_entries, stable_failure_entries],
            strict=True,
        )
    ]

    return {
        "virtue": virtue,
        "decks": [deck for deck in decks if deck["entries"]],
    }


def build_overview(
    summary: dict[str, Any],
    virtue_payloads: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    virtues = {}

    for virtue, payload in virtue_payloads.items():
        available_models = [
            model["display"]
            for model in summary["models"]
            if virtue in model["virtues"]
        ]
        featured_models = [
            model["display"]
            for model in summary["models"]
            if model["featured"] and virtue in model["virtues"]
        ]
        virtues[virtue] = build_overview_virtue(
            virtue,
            payload["items"],
            featured_models,
            available_models,
        )

    return {"virtues": virtues}


def main() -> None:
    subprocess.run(["python3", "-m", "src.export_site_data"], cwd=BENCH, check=True)

    raw_summary = read_json(SOURCE / "summary.json")
    raw_virtues = {
        path.stem: read_json(path)
        for path in sorted((SOURCE / "virtues").glob("*.json"))
    }

    if DEST.exists():
        shutil.rmtree(DEST)

    trimmed_virtues = {
        virtue: build_virtue_payload(payload)
        for virtue, payload in raw_virtues.items()
    }

    write_json(DEST / "summary.json", build_summary(raw_summary))
    write_json(DEST / "overview.json", build_overview(raw_summary, trimmed_virtues))

    for virtue, payload in trimmed_virtues.items():
        write_json(DEST / "virtues" / f"{virtue}.json", payload)

    print(f"Synced {SOURCE} -> {DEST}")


if __name__ == "__main__":
    main()
