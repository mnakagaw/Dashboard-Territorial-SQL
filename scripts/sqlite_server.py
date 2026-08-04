#!/usr/bin/env python3
"""Serve the SQLite API and the built dashboard using only Python stdlib."""

from __future__ import annotations

import argparse
import json
import mimetypes
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "sqlite" / "dashboard_territorial.sqlite3"
DEFAULT_WEB = ROOT / "dist"


class DashboardHandler(SimpleHTTPRequestHandler):
    db_path: Path
    web_root: Path

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/api/health", "/api/health/"):
            self.send_json({"status": "ok", "database": self.db_path.name})
            return

        if parsed.path in ("/api/data", "/api/data/"):
            self.list_datasets()
            return

        if parsed.path in ("/api/data.php", "/dbt/api/data.php"):
            key = parse_qs(parsed.query).get("key", [""])[0]
            self.get_dataset(key)
            return

        if parsed.path.startswith("/api/data/"):
            self.get_dataset(unquote(parsed.path.removeprefix("/api/data/")))
            return

        self.serve_dashboard(parsed.path)

    def db_connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            f"file:{self.db_path.as_posix()}?mode=ro",
            uri=True,
        )
        connection.row_factory = sqlite3.Row
        return connection

    def list_datasets(self) -> None:
        with self.db_connect() as connection:
            rows = connection.execute(
                """
                SELECT asset_key, version_no, content_hash, source_name,
                       updated_at, notes
                FROM active_dataset_assets
                ORDER BY asset_key
                """
            ).fetchall()
        self.send_json([dict(row) for row in rows])

    def get_dataset(self, key: str) -> None:
        if not key:
            self.send_json({"error": "Missing dataset key."}, status=400)
            return
        with self.db_connect() as connection:
            row = connection.execute(
                """
                SELECT json_content, content_hash
                FROM active_dataset_assets
                WHERE asset_key = ?
                """,
                (key,),
            ).fetchone()
        if row is None:
            self.send_json(
                {"error": f"Dataset '{key}' not found or inactive."},
                status=404,
            )
            return
        payload = row["json_content"].encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("ETag", f'"{row["content_hash"]}"')
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(payload)

    def serve_dashboard(self, request_path: str) -> None:
        if request_path in ("/", "/dbt"):
            self.send_response(302)
            self.send_header("Location", "/dbt/")
            self.end_headers()
            return

        relative = request_path.removeprefix("/dbt/").lstrip("/")
        candidate = (self.web_root / relative).resolve()
        web_root = self.web_root.resolve()
        if web_root not in candidate.parents and candidate != web_root:
            self.send_error(403)
            return

        if candidate.is_dir():
            candidate = candidate / "index.html"
        if not candidate.is_file():
            candidate = web_root / "index.html"
        if not candidate.is_file():
            self.send_json(
                {
                    "error": "Dashboard build not found.",
                    "hint": "Run npm run build:sqlite first.",
                },
                status=503,
            )
            return

        payload = candidate.read_bytes()
        content_type = mimetypes.guess_type(candidate.name)[0]
        self.send_response(200)
        self.send_header(
            "Content-Type",
            f"{content_type or 'application/octet-stream'}"
            + ("; charset=utf-8" if content_type and content_type.startswith("text/") else ""),
        )
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, value: object, status: int = 200) -> None:
        payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    parser.add_argument("--db", default=DEFAULT_DB, type=Path)
    parser.add_argument("--web-root", default=DEFAULT_WEB, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db_path = args.db.resolve()
    web_root = args.web_root.resolve()
    if not db_path.is_file():
        raise SystemExit(
            f"Database not found: {db_path}\nRun: python scripts/sqlite_tool.py init"
        )

    DashboardHandler.db_path = db_path
    DashboardHandler.web_root = web_root
    server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    print(f"Dashboard: http://{args.host}:{args.port}/dbt/")
    print(f"API:       http://{args.host}:{args.port}/api/data")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
