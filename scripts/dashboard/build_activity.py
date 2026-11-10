#!/usr/bin/env python3
"""Build activity.json for the team dashboard from git history on main.

Usage: python3 scripts/dashboard/build_activity.py [--since 2026-10-01] [--ref origin/main]
                                                 [--out activity.json] [--template ...] [--html ...]

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


DEFAULT_TEMPLATE = Path("dashboard/template.html")
DEFAULT_HTML = Path("dashboard/index.html")
DATA_PLACEHOLDER = "__DATA__"


def git_log(ref: str, since: str):
    out = subprocess.run(
        ["git", "log", ref, f"--since={since}", "--numstat",
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
    # Use origin/main: the local main branch can be behind the remote.
    ap.add_argument("--ref", default="origin/main")
    ap.add_argument("--out", default="activity.json")
    ap.add_argument("--template", default=str(DEFAULT_TEMPLATE))
    ap.add_argument("--html", default=str(DEFAULT_HTML))
    args = ap.parse_args()

    days = defaultdict(lambda: {"commits": [], "doc_changes": []})
    for c in git_log(args.ref, args.since):
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

    template = Path(args.template)
    if not template.exists():
        raise SystemExit(f"template not found: {template}")
    template_text = template.read_text()
    if template_text.count(DATA_PLACEHOLDER) != 1:
        raise SystemExit(f"{template} must contain {DATA_PLACEHOLDER} exactly once")
    # Escape "</" so a commit subject cannot close the <script> tag early.
    data_js = json.dumps(result, ensure_ascii=False).replace("</", "<\\/")
    Path(args.html).parent.mkdir(parents=True, exist_ok=True)
    Path(args.html).write_text(template_text.replace(DATA_PLACEHOLDER, data_js))

    total = sum(len(d["commits"]) for d in result["days"])
    print(f"wrote {args.out} and {args.html}: {len(result['days'])} days, {total} commits")


if __name__ == "__main__":
    main()
