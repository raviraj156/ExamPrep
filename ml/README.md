# AI Summary Model Training (ExamPrep)

This folder trains a **domain-specific model for summary/advice** (AI domain), while quiz generation and answer checking remain API-driven.

## 1) Install Python dependencies

```bash
pip install -r ml/requirements.txt
```

## 2) Choose your dataset source

You have 2 options:

1. Start quickly with template data:
- `ml/data/ai_quiz_training_template.csv`

2. Build from your Firestore quiz result history:
- Export `results` collection to JSON
- Run:

```bash
python ml/build_training_csv_from_firestore.py --results-json path/to/results.json --output-csv ml/data/ai_quiz_training_from_firestore.csv
```

The produced CSV has feature columns and empty label columns.  
You can fill labels manually (`label_level`, `label_advice`) or let the trainer generate rule-based labels.

## 3) Train model and write frontend artifact

```bash
python ml/train_ai_summary_model.py --input-csv ml/data/ai_quiz_training_template.csv --output-ts src/data/aiSummaryModel.ts
```

After training, the app automatically uses the new artifact for:
- level prediction (`beginner/intermediate/advanced`)
- advice tag prediction (mapped to suggestions)

## Required CSV columns

- `overall_accuracy` (0-1)
- `mcq_accuracy` (0-1)
- `subjective_score` (0-1)
- `consistency` (0-1)
- `attempted_ratio` (0-1)

Optional labels:
- `label_level`: `beginner` | `intermediate` | `advanced`
- `label_advice`: semicolon-separated tags from:
  - `revise_fundamentals`
  - `practice_mcq`
  - `practice_subjective`
  - `improve_consistency`
  - `level_up_challenge`

If labels are missing, rules are used to auto-label training rows.
