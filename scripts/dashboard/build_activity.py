#!/usr/bin/env python3
"""Build activity.json for the team dashboard from git history on main.

Usage: python3 scripts/dashboard/build_activity.py [--since 2026-10-01] [--out activity.json]

Each commit becomes one entry, grouped by day (Europe/Madrid), with the area
of the site it touched. Project-doc changes are read from doc-changes.json if
present (agents append there).
"""
import argparse
import json
import subprocess
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

MADRID = ZoneInfo("Europe/Madrid")
SEP = "\x1e"


def area_of(path: str) -> str:
    if path.startswith("src/content/guides/") or path.startswith("src/content/hubs/"):
        return "guides"
    if path.startswith("src/content/news/"):
        return "news"
    if path.startswith("src/content/rankings/") or path.startswith("src/content/brands/"):
        return "rankings"
    if path.startswith("src/data/") or path.startswith("scripts/seed/"):
        return "data"
    if path.startswith("src/assets/"):
        return "images"
    if path.startswith("docs/"):
        return "docs"
    if path.startswith("scripts/"):
        return "scripts"
    if path.startswith("src/"):
        return "code"
    return "other"


def git_log(since: str):
    out = subprocess.run(
        ["git", "log", "main", f"--since={since}", "--numstat",
         f"--format={SEP}%H%x1f%aI%x1f%an%x1f%s"],
        capture_output=True, text=True, check=True,
    ).stdout
    for block in out.split(SEP)[1:]:
        lines = block.strip("\n").split("\n")
        sha, iso, author, subject = lines[0].split("\x1f")
        files = []
        for line in lines[1:]:
            parts = line.split("\t")
            if len(parts) != 3:
                continue
            add, dele, path = parts
            files.append({
                "path": path,
                "area": area_of(path),
                "added": 0 if add == "-" else int(add),
                "deleted": 0 if dele == "-" else int(dele),
            })
        yield {"sha": sha[:7], "time": iso, "author": author,
               "subject": subject, "files": files}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default="2026-10-01")
    ap.add_argument("--out", default="activity.json")
    args = ap.parse_args()

    days = defaultdict(lambda: {"commits": [], "doc_changes": []})
    for c in git_log(args.since):
        when = datetime.fromisoformat(c["time"]).astimezone(MADRID)
        day = when.date().isoformat()
        areas = sorted({f["area"] for f in c["files"]})
        days[day]["commits"].append({
            "sha": c["sha"],
            "time": when.strftime("%H:%M"),
            "author": c["author"],
            "subject": c["subject"],
            "areas": areas,
            "files_changed": len(c["files"]),
            "added": sum(f["added"] for f in c["files"]),
            "deleted": sum(f["deleted"] for f in c["files"]),
        })

    doc_file = Path("doc-changes.json")
    if doc_file.exists():
        for entry in json.loads(doc_file.read_text()):
            days[entry["date"]]["doc_changes"].append(entry)

    result = {
        "generated": datetime.now(MADRID).isoformat(timespec="minutes"),
        "since": args.since,
        "days": [
            {"date": d, **days[d]} for d in sorted(days, reverse=True)
        ],
    }
    Path(args.out).write_text(json.dumps(result, ensure_ascii=False, indent=2))
    total = sum(len(d["commits"]) for d in result["days"])
    print(f"wrote {args.out}: {len(result['days'])} days, {total} commits")


if __name__ == "__main__":
    main()
