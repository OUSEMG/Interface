import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
XLSX_PATH = ROOT / "data" / "OUSEMG Alumni List - 2.17.2026 (2).xlsx"
OUTPUT_PATH = ROOT / "frontend" / "src" / "data" / "alumni.json"


def clean_str(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text or None


def parse_grad_class(value):
    if pd.isna(value):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def collect_emails(row):
    emails = []
    for col in ("Email #1", "Email #2", "Email #3"):
        email = clean_str(row.get(col))
        if email and email not in emails:
            emails.append(email)
    return emails


def convert():
    df = pd.read_excel(XLSX_PATH, header=2)
    df = df.dropna(subset=["Name"])

    alumni = []
    for index, row in df.iterrows():
        name = clean_str(row["Name"])
        if not name or name == "Name":
            continue

        alumni.append(
            {
                "id": len(alumni) + 1,
                "name": name,
                "gradClass": parse_grad_class(row["Grad Class"]),
                "location": clean_str(row["Location"]),
                "industry": clean_str(row["Industry"]),
                "firm": clean_str(row["Firm"]),
                "title": clean_str(row["Title"]),
                "emails": collect_emails(row),
                "linkedin": clean_str(row["LinkedIn"]),
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(alumni, indent=2), encoding="utf-8")
    print(f"Wrote {len(alumni)} alumni to {OUTPUT_PATH}")


if __name__ == "__main__":
    convert()
