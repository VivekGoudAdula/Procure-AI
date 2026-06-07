#!/usr/bin/env python3
"""
Post-process htmlcov/ after pytest-cov: add Tests tab with full test case inventory.
Run automatically via conftest pytest_sessionfinish, or manually:

    python scripts/enhance_coverage_html.py
"""
from __future__ import annotations

import ast
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS_DIR = ROOT / "tests"
HTMLCOV = ROOT / "htmlcov"
STYLE_LINK = "style_cb_0853b3de.css"

# Human-readable module labels for fallback descriptions
MODULE_LABELS = {
    "test_auth.py": "authentication",
    "test_supplier_selection.py": "supplier selection",
    "test_escrow.py": "escrow lifecycle",
    "test_escrow_edge.py": "escrow edge cases",
    "test_x402_payment.py": "x402 payments",
    "test_health.py": "health checks",
    "test_security_hardening.py": "security hardening",
    "test_end_to_end_procurement_flow.py": "end-to-end procurement",
    "test_services_coverage.py": "service layer",
    "test_coverage_boost.py": "API coverage boost",
    "test_high_coverage.py": "extended coverage",
}

# Acronyms to preserve when title-casing test names
ACRONYMS = {
    "jwt", "api", "x402", "smtp", "db", "e2e", "moq", "cors", "pdf", "png", "jpeg",
    "rfq", "http", "algo", "avm", "atg",
}


def _title_words(slug: str) -> str:
    parts = []
    for word in slug.split():
        low = word.lower()
        if low in ACRONYMS:
            parts.append(low.upper() if len(low) <= 4 else low.capitalize())
        else:
            parts.append(word.capitalize())
    return " ".join(parts)


def fallback_description(test_name: str, file_name: str) -> str:
    """Build a readable description when a test has no docstring."""
    core = test_name.removeprefix("test_").replace("_", " ")
    area = MODULE_LABELS.get(file_name, file_name.replace("test_", "").replace(".py", "").replace("_", " "))
    phrase = _title_words(core)

    if core.startswith("test_"):
        core = core[5:]
    # Verb-led phrasing based on common test name patterns
    lower = core.lower()
    negative = ("invalid", "missing", "unknown", "empty", "duplicate", "double", "error", "failure", "attack", "prevention")
    if any(w in lower for w in negative):
        return f"Ensures {phrase.lower()} is handled correctly in {area}."
    if any(w in lower for w in ("success", "valid", "generation", "endpoint", "schema", "helpers")):
        return f"Verifies {phrase.lower()} behavior ({area})."
    return f"Covers {phrase.lower()} in the {area} test suite."


def resolve_summary(test_name: str, file_name: str, docstring: str) -> str:
    text = docstring.strip().split("\n")[0].strip() if docstring.strip() else ""
    if text:
        return text
    return fallback_description(test_name, file_name)


def collect_tests_from_ast() -> list[dict]:
    """Parse test files for function names and docstrings."""
    rows: list[dict] = []
    for path in sorted(TESTS_DIR.glob("test_*.py")):
        if path.name in ("test_comp.py", "test_deploy.py"):
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_"):
                doc = ast.get_docstring(node) or ""
                rows.append({
                    "file": path.name,
                    "name": node.name,
                    "summary": resolve_summary(node.name, path.name, doc),
                })
    return rows


def collect_tests_from_pytest() -> list[str] | None:
    """Fallback: pytest --collect-only -q."""
    try:
        out = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/", "--collect-only", "-q", "--ignore=tests/test_comp.py", "--ignore=tests/test_deploy.py"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if out.returncode != 0:
            return None
        return [line.strip() for line in out.stdout.splitlines() if line.startswith("tests/")]
    except Exception:
        return None


def parse_coverage_percent(index_html: str) -> str:
    m = re.search(r'class="pc_cov">(\d+%)</span>', index_html)
    return m.group(1) if m else "—"


def build_tests_index_html(rows: list[dict], total_cov: str) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M %Z")
    by_file: dict[str, list[dict]] = {}
    for r in rows:
        by_file.setdefault(r["file"], []).append(r)

    file_sections = []
    for fname in sorted(by_file.keys()):
        tests = by_file[fname]
        trs = []
        for i, t in enumerate(tests, 1):
            summary = t["summary"].replace("<", "&lt;").replace(">", "&gt;")
            trs.append(
                f'<tr><td class="num">{i}</td>'
                f'<td class="name"><code>{t["name"]}</code></td>'
                f'<td class="summary">{summary}</td></tr>'
            )
        file_sections.append(f"""
        <section class="test-file-block" data-file="{fname}">
            <h3>{fname} <span class="count">({len(tests)} tests)</span></h3>
            <table class="index tests-table" data-sortable>
                <thead>
                    <tr><th>#</th><th>Test case</th><th>Description</th></tr>
                </thead>
                <tbody>{"".join(trs)}</tbody>
            </table>
        </section>
        """)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>ProcureAI — Test cases</title>
    <link rel="stylesheet" href="{STYLE_LINK}" type="text/css">
    <style>
        .summary-box {{ margin: 1rem 0; padding: 1rem 1.25rem; background: #e8f4fc; border-left: 4px solid #007acc; border-radius: 4px; }}
        @media (prefers-color-scheme: dark) {{ .summary-box {{ background: #1a2a3a; }} }}
        .summary-box p {{ margin: 0.35em 0; font-size: 0.95em; }}
        .test-file-block {{ margin-bottom: 2rem; }}
        .test-file-block h3 {{ margin: 1rem 0 0.5rem; font-size: 1.1em; }}
        .test-file-block .count {{ font-weight: normal; color: #666; font-size: 0.9em; }}
        @media (prefers-color-scheme: dark) {{ .test-file-block .count {{ color: #aaa; }} }}
        table.tests-table td.num {{ width: 3em; text-align: right; color: #666; }}
        table.tests-table code {{ font-size: 0.85em; }}
        #test_filter {{ width: 100%; max-width: 24rem; padding: 0.4em 0.6em; margin-bottom: 1rem; }}
        .hidden-block {{ display: none !important; }}
    </style>
</head>
<body class="indexfile">
<header>
    <div class="content">
        <h1>ProcureAI test suite:
            <span class="pc_cov">{len(rows)} tests</span>
        </h1>
        <div class="summary-box">
            <p><strong>Total test cases:</strong> {len(rows)}</p>
            <p><strong>Backend coverage (testable):</strong> {total_cov} — see <a href="index.html">Files</a> tab</p>
            <p><strong>Report:</strong> <a href="../TECHNICAL_PANEL_READINESS_REPORT.md">TECHNICAL_PANEL_READINESS_REPORT.md</a></p>
        </div>
        <h2>
            <a class="button" href="index.html">Files</a>
            <a class="button" href="function_index.html">Functions</a>
            <a class="button" href="class_index.html">Classes</a>
            <a class="button current" href="tests_index.html">Tests ({len(rows)})</a>
        </h2>
        <form id="filter_container">
            <input id="test_filter" type="text" placeholder="Filter tests by name or file…">
        </form>
        <p class="text">ProcureAI test inventory, generated at {now}</p>
    </div>
</header>
<main id="index">
{"".join(file_sections)}
</main>
<footer>
    <div class="content">
        <p><a class="nav" href="index.html">← Back to coverage report</a></p>
    </div>
</footer>
<script>
(function() {{
    const input = document.getElementById('test_filter');
    const blocks = document.querySelectorAll('.test-file-block');
    input.addEventListener('input', function() {{
        const q = this.value.toLowerCase();
        blocks.forEach(function(block) {{
            const file = block.dataset.file.toLowerCase();
            const text = block.textContent.toLowerCase();
            block.classList.toggle('hidden-block', q && !file.includes(q) && !text.includes(q));
        }});
    }});
}})();
</script>
</body>
</html>
"""


def inject_nav_into_html(path: Path, test_count: int) -> None:
    """Add or refresh Tests button on coverage.py generated pages."""
    if not path.exists():
        return
    html = path.read_text(encoding="utf-8")
    tests_btn = f'<a class="button" href="tests_index.html">Tests ({test_count})</a>'
    if re.search(r'href="tests_index\.html">Tests \(\d+\)</a>', html):
        html = re.sub(
            r'<a class="button" href="tests_index\.html">Tests \(\d+\)</a>',
            tests_btn,
            html,
            count=1,
        )
    else:
        marker = '<a class="button" href="class_index.html">Classes</a>'
        if marker not in html:
            return
        html = html.replace(marker, f"{marker}\n                {tests_btn}", 1)
    path.write_text(encoding="utf-8", data=html)


def remove_coverage_banner(path: Path) -> None:
    """Strip ProcureAI promo banner from coverage pages (Tests tab is sufficient)."""
    if not path.exists():
        return
    html = path.read_text(encoding="utf-8")
    marker = '<div class="summary-box" style="margin:0.5rem'
    while marker in html and "View full test case inventory" in html:
        start = html.find(marker)
        end = html.find("</div>", start)
        if end == -1:
            break
        html = html[:start] + html[end + len("</div>") :]
    path.write_text(encoding="utf-8", data=html)


def main() -> int:
    if not HTMLCOV.is_dir():
        print("[enhance_coverage_html] htmlcov/ not found — run pytest with --cov-report=html first.")
        return 1

    rows = collect_tests_from_ast()
    if not rows:
        print("[enhance_coverage_html] No tests found in tests/")
        return 1

    index_path = HTMLCOV / "index.html"
    total_cov = parse_coverage_percent(index_path.read_text(encoding="utf-8")) if index_path.exists() else "—"

    tests_html = build_tests_index_html(rows, total_cov)
    (HTMLCOV / "tests_index.html").write_text(encoding="utf-8", data=tests_html)

    test_count = len(rows)

    for name in ("index.html", "function_index.html", "class_index.html"):
        p = HTMLCOV / name
        inject_nav_into_html(p, test_count)
        remove_coverage_banner(p)

    print(f"[enhance_coverage_html] Wrote htmlcov/tests_index.html ({test_count} tests)")
    print(f"[enhance_coverage_html] Updated navigation in htmlcov/*.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
