from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pandas as pd

FEATURE_COLUMNS = [
    "overall_accuracy",
    "mcq_accuracy",
    "subjective_score",
    "consistency",
    "attempted_ratio",
]


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def as_docs(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if "documents" in payload and isinstance(payload["documents"], list):
            return payload["documents"]
        return list(payload.values())
    return []


def parse_results(results_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    user_attempts: Dict[str, int] = {}

    sorted_results = sorted(results_docs, key=lambda x: x.get("createdAt", 0))

    for result in sorted_results:
        user_id = result.get("userId", "unknown")
        user_attempts[user_id] = user_attempts.get(user_id, 0) + 1

        answers = result.get("answers", []) or []
        attempted_count = result.get("attemptedCount", len(answers))
        total_questions = len(answers) if len(answers) > 0 else max(1, attempted_count)

        mcq_scores = []
        subjective_scores = []
        normalized_scores = []

        for answer in answers:
            score = float(answer.get("score", 0) or 0)
            marks = float(answer.get("marksObtained", 0) or 0)
            if score <= 1:
                mcq_scores.append(score)
                normalized_scores.append(max(0.0, min(1.0, score)))
            else:
                subjective_scores.append(max(0.0, min(1.0, score / 10.0)))
                normalized_scores.append(max(0.0, min(1.0, marks / 5.0)))

        overall_accuracy = 0.0
        max_score = float(result.get("maxScore", 0) or 0)
        total_score = float(result.get("totalScore", 0) or 0)
        if max_score > 0:
            overall_accuracy = max(0.0, min(1.0, total_score / max_score))

        mcq_accuracy = sum(mcq_scores) / len(mcq_scores) if mcq_scores else overall_accuracy
        subjective_score = sum(subjective_scores) / len(subjective_scores) if subjective_scores else overall_accuracy

        if normalized_scores:
            mean = sum(normalized_scores) / len(normalized_scores)
            variance = sum((x - mean) ** 2 for x in normalized_scores) / len(normalized_scores)
            consistency = max(0.0, min(1.0, 1 - variance ** 0.5))
        else:
            consistency = 0.5

        attempted_ratio = max(0.0, min(1.0, attempted_count / max(1, total_questions)))

        row = {
            "user_id": user_id,
            "quiz_id": result.get("quizId", result.get("id", "unknown_quiz")),
            "overall_accuracy": overall_accuracy,
            "mcq_accuracy": mcq_accuracy,
            "subjective_score": subjective_score,
            "consistency": consistency,
            "attempted_ratio": attempted_ratio,
            "label_level": "",
            "label_advice": "",
        }
        rows.append(row)

    return rows


def main():
    parser = argparse.ArgumentParser(description="Build AI summary model training CSV from Firestore results export JSON.")
    parser.add_argument("--results-json", type=Path, required=True, help="Path to exported results JSON.")
    parser.add_argument(
        "--output-csv",
        type=Path,
        default=Path("ml/data/ai_quiz_training_from_firestore.csv"),
        help="Output training CSV path.",
    )
    args = parser.parse_args()

    results_payload = load_json(args.results_json)
    results_docs = as_docs(results_payload)
    rows = parse_results(results_docs)

    if not rows:
        raise ValueError("No result documents found in the input JSON.")

    df = pd.DataFrame(rows)
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output_csv, index=False)
    print(f"Wrote {len(df)} rows to {args.output_csv}")
    print("Note: label columns are blank. Add teacher-reviewed labels or use rule-generated labels in training script.")


if __name__ == "__main__":
    main()
