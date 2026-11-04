#!/usr/bin/env python3
"""Post-build check for the news routine (run after `npx astro build`).

- every internal link in dist/**/*.html points to a built page
- every news page's hreflang alternates exist and link back
- every news item has at least one external source link

Usage: python3 scripts/news/check_dist.py   (exit code 1 on problems)
"""
import glob, os, re, sys

ROOT = "dist"
NEWS = re.compile(r"^/(en/news|es/noticias|de/aktuelles)/[^/]+/$")

pages = set()
for p in glob.glob(f"{ROOT}/**/index.html", recursive=True):
    d = os.path.dirname(p)
    pages.add("/" if d == ROOT else "/" + os.path.relpath(d, ROOT).replace("\\", "/") + "/")

problems = []
for f in glob.glob(f"{ROOT}/**/*.html", recursive=True):
    s = open(f, encoding="utf-8").read()
    for h in re.findall(r'href="(/[^"#?]*)', s):
        if h.startswith(("/_astro", "/go/", "/keystatic", "/api/")):
            continue
        last = h.rstrip("/").split("/")[-1]
        if "." in last:
            if not os.path.exists(ROOT + h):
                problems.append(f"missing file {h} (in {f})")
            continue
        if (h if h.endswith("/") else h + "/") not in pages:
            problems.append(f"broken link {h} (in {f})")

def alternates(p):
    s = open(f"{ROOT}{p}index.html", encoding="utf-8").read()
    return dict(re.findall(r'<link rel="alternate" hreflang="([a-z-]+)" href="https://nutrimetrics\.eu([^"]+)"', s))

news = sorted(p for p in pages if NEWS.match(p))
for p in news:
    lang = p.split("/")[1]
    for l, u in alternates(p).items():
        if l == "x-default":
            continue
        if u not in pages:
            problems.append(f"hreflang {l} of {p} points to missing {u}")
        elif alternates(u).get(lang) != p:
            problems.append(f"hreflang not reciprocal: {p} -> {u}")
    s = open(f"{ROOT}{p}index.html", encoding="utf-8").read()
    src = s.split('id="sources"', 1)[-1]
    if not re.search(r'href="https?://(?!nutrimetrics\.eu)', src):
        problems.append(f"no external source link on {p}")

print(f"pages: {len(pages)}, news pages: {len(news)}, problems: {len(problems)}")
for x in problems[:50]:
    print(" -", x)
sys.exit(1 if problems else 0)
