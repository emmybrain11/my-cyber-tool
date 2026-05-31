#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, raw_value = line.split("=", 1)
        key = key.strip()
        value = raw_value.strip().strip('"').strip("'")
        values[key] = value
    return values


def get_env_value(name: str) -> str | None:
    if name in os.environ and os.environ[name].strip():
        return os.environ[name].strip()
    env_values = parse_env_file(ENV_FILE)
    return env_values.get(name)


def safe_print(message: str) -> None:
    print(message)


def connect_mysql(database_url: str):
    try:
        import mysql.connector
    except ImportError as exc:
        safe_print("mysql-connector-python is required for database inspection.")
        safe_print("Install it with pip in the venv: pip install mysql-connector-python")
        raise SystemExit(1) from exc

    parsed = urlparse(database_url)
    if not parsed.scheme.startswith("mysql"):
        raise ValueError("Unsupported database scheme. Only MySQL is supported for database inspection.")

    user = unquote(parsed.username or "root")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 3306
    database = parsed.path.lstrip("/")

    if not database:
        raise ValueError("DATABASE_URL must include a database name.")

    return mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connection_timeout=10,
    )


def main() -> int:
    db_url = get_env_value("DATABASE_URL")
    if not db_url:
        safe_print("DATABASE_URL is not configured. Set it in .env or the environment.")
        return 0

    safe_print(f"Using DATABASE_URL: {db_url}")

    try:
        conn = connect_mysql(db_url)
    except Exception as exc:
        safe_print(f"Failed to connect to database: {exc}")
        return 1

    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    safe_print("\nDetected tables:")
    if not tables:
        safe_print("  (no tables found)")
    else:
        for table in tables:
            safe_print(f"  - {table}")

    if "users" in tables:
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        safe_print(f"\nUser table row count: {user_count}")
        cursor.execute("SELECT id, email, name, role, approved FROM users ORDER BY created_at DESC LIMIT 5")
        safe_print("\nLatest users:")
        for row in cursor.fetchall():
            safe_print(f"  {row}")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
