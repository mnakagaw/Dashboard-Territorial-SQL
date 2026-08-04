#!/usr/bin/env python3
"""Create a self-contained, checksummed SQLite handoff package for ONE."""

from __future__ import annotations

import hashlib
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HANDOFF_ROOT = ROOT / "handoff"
REQUIRED = (
    ROOT / "dist" / "index.html",
    ROOT / "sqlite" / "dashboard_territorial.sqlite3",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    missing = [str(path) for path in REQUIRED if not path.is_file()]
    if missing:
        print("Handoff prerequisites are missing:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        print(
            "Run npm run sqlite:init and npm run build:sqlite first.",
            file=sys.stderr,
        )
        return 1

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%SZ")
    package_name = f"DashboardTerritorial_ONE_SQLite_{stamp}"
    package_dir = HANDOFF_ROOT / package_name
    package_dir.mkdir(parents=True, exist_ok=False)

    shutil.copytree(
        ROOT / "dist",
        package_dir / "dist",
        ignore=shutil.ignore_patterns("api"),
    )
    shutil.copytree(ROOT / "sqlite", package_dir / "sqlite")
    (package_dir / "scripts").mkdir()
    for name in ("sqlite_server.py", "sqlite_tool.py", "sqlite_schema.sql"):
        shutil.copy2(ROOT / "scripts" / name, package_dir / "scripts" / name)
    shutil.copy2(ROOT / "START_SQLITE.bat", package_dir / "START_SQLITE.bat")
    shutil.copy2(
        ROOT / "docs" / "ONE_SQLITE_HANDOFF.md",
        package_dir / "LEEME_PRIMERO.md",
    )
    shutil.copy2(ROOT / "LICENSE", package_dir / "LICENSE")

    manifest_lines = [
        "# SHA-256 manifest",
        f"# Created (UTC): {stamp}",
        "",
    ]
    for path in sorted(p for p in package_dir.rglob("*") if p.is_file()):
        relative = path.relative_to(package_dir).as_posix()
        manifest_lines.append(f"{sha256(path)}  {relative}")
    (package_dir / "MANIFEST_SHA256.txt").write_text(
        "\n".join(manifest_lines) + "\n",
        encoding="utf-8",
    )

    archive = shutil.make_archive(
        str(HANDOFF_ROOT / package_name),
        "zip",
        root_dir=HANDOFF_ROOT,
        base_dir=package_name,
    )
    print(f"ONE handoff folder: {package_dir}")
    print(f"ONE handoff archive: {archive}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
