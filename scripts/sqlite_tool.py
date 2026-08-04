#!/usr/bin/env python3
"""Build and verify the local SQLite database from public/data JSON assets."""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "sqlite" / "dashboard_territorial.sqlite3"
DEFAULT_DATA = ROOT / "public" / "data"
SCHEMA = Path(__file__).with_name("sqlite_schema.sql")
STATIC_ONLY = {"adm2.json"}


def connect(db_path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA synchronous = NORMAL")
    return connection


def json_assets(data_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in data_dir.glob("*.json")
        if path.name not in STATIC_ONLY
    )


def initialize(db_path: Path, data_dir: Path) -> int:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    schema_sql = SCHEMA.read_text(encoding="utf-8")
    assets = json_assets(data_dir)

    with connect(db_path) as connection:
        connection.executescript(schema_sql)
        changed = 0
        unchanged = 0

        for path in assets:
            raw_bytes = path.read_bytes()
            raw = raw_bytes.decode("utf-8")
            json.loads(raw)
            content_hash = hashlib.sha256(raw_bytes).hexdigest()
            asset_key = path.stem
            current = connection.execute(
                """
                SELECT id, version_no, content_hash
                FROM dataset_assets
                WHERE asset_key = ? AND is_active = 1
                """,
                (asset_key,),
            ).fetchone()

            if current and current["content_hash"] == content_hash:
                unchanged += 1
                continue

            if current:
                next_version = current["version_no"] + 1
                connection.execute(
                    "UPDATE dataset_assets SET is_active = 0 WHERE id = ?",
                    (current["id"],),
                )
            else:
                next_version = 1

            connection.execute(
                """
                INSERT INTO dataset_assets (
                    asset_key,
                    version_no,
                    json_content,
                    content_hash,
                    source_name,
                    is_active,
                    notes
                ) VALUES (?, ?, ?, ?, ?, 1, ?)
                """,
                (
                    asset_key,
                    next_version,
                    raw,
                    content_hash,
                    path.name,
                    "Imported from the version-controlled delivery JSON.",
                ),
            )
            changed += 1

    print(
        f"SQLite ready: {db_path}\n"
        f"Assets: {len(assets)} ({changed} changed, {unchanged} unchanged)\n"
        f"Static map files kept outside DB: adm2.json, adm2.geojson"
    )
    return 0


def verify(db_path: Path, data_dir: Path) -> int:
    if not db_path.is_file():
        print(f"ERROR: database not found: {db_path}", file=sys.stderr)
        return 1

    expected = {path.stem: path for path in json_assets(data_dir)}
    errors: list[str] = []

    with connect(db_path) as connection:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            errors.append(f"PRAGMA integrity_check: {integrity}")

        foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
        if foreign_keys:
            errors.append(f"foreign_key_check returned {len(foreign_keys)} row(s)")

        rows = connection.execute(
            """
            SELECT asset_key, json_content, content_hash
            FROM active_dataset_assets
            ORDER BY asset_key
            """
        ).fetchall()

        actual_keys = {row["asset_key"] for row in rows}
        missing = sorted(set(expected) - actual_keys)
        extra = sorted(actual_keys - set(expected))
        if missing:
            errors.append(f"missing assets: {', '.join(missing)}")
        if extra:
            errors.append(f"unexpected assets: {', '.join(extra)}")

        for row in rows:
            try:
                json.loads(row["json_content"])
            except json.JSONDecodeError as exc:
                errors.append(f"{row['asset_key']}: invalid JSON ({exc})")
                continue

            calculated = hashlib.sha256(
                row["json_content"].encode("utf-8")
            ).hexdigest()
            if calculated != row["content_hash"]:
                errors.append(f"{row['asset_key']}: stored hash mismatch")

            source = expected.get(row["asset_key"])
            if source:
                source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
                if source_hash != row["content_hash"]:
                    errors.append(f"{row['asset_key']}: differs from {source.name}")

    if errors:
        print("SQLite verification FAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        f"SQLite verification OK: {db_path}\n"
        f"Active JSON assets: {len(expected)}\n"
        f"Integrity, foreign keys, JSON and SHA-256 hashes: OK"
    )
    return 0


def list_assets(db_path: Path) -> int:
    with connect(db_path) as connection:
        rows = connection.execute(
            """
            SELECT asset_key, version_no, length(json_content) AS bytes,
                   content_hash, updated_at
            FROM active_dataset_assets
            ORDER BY asset_key
            """
        ).fetchall()
    print(json.dumps([dict(row) for row in rows], ensure_ascii=False, indent=2))
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        choices=("init", "verify", "list"),
        help="Operation to perform.",
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db_path = args.db.resolve()
    data_dir = args.data_dir.resolve()
    if args.command == "init":
        return initialize(db_path, data_dir)
    if args.command == "verify":
        return verify(db_path, data_dir)
    return list_assets(db_path)


if __name__ == "__main__":
    raise SystemExit(main())
