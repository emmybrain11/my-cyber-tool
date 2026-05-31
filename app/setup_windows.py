#!/usr/bin/env python3
import argparse
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PYTHON_SERVICE_DIR = ROOT / "python-service"
VENV_DIR = ROOT / ".venv"
ENV_FILE = ROOT / ".env"
MAX_RETRIES = 6
RETRY_DELAY = 8


def log(message: str) -> None:
    print(f"[setup] {message}")


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


def get_venv_python() -> Path:
    if is_windows():
        candidate = VENV_DIR / "Scripts" / "python.exe"
    else:
        candidate = VENV_DIR / "bin" / "python"
    if candidate.exists():
        return candidate
    raise RuntimeError("Python executable not found in the virtual environment.")


def is_windows() -> bool:
    return platform.system().lower() == "windows"


def run_command(cmd, cwd=None, env=None, retry=True, description: str = "command"):
    if isinstance(cmd, str):
        cmd = cmd if is_windows() else cmd
    attempts = 0
    while True:
        attempts += 1
        try:
            log(f"Running ({attempts}/{MAX_RETRIES}): {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                cwd=cwd,
                env=env,
                check=True,
                capture_output=True,
                text=True,
                shell=False,
            )
            if result.stdout:
                print(result.stdout.strip())
            if result.stderr:
                print(result.stderr.strip())
            return result
        except subprocess.CalledProcessError as exc:
            stderr_output = exc.stderr.strip() if exc.stderr else ""
            print(stderr_output)
            if not retry or attempts >= MAX_RETRIES:
                raise RuntimeError(
                    f"{description} failed after {attempts} attempts.\nExit code: {exc.returncode}\n{stderr_output}"
                )
            log(f"{description} failed. Retrying in {RETRY_DELAY} seconds...")
            time.sleep(RETRY_DELAY)
        except OSError as exc:
            if not retry or attempts >= MAX_RETRIES:
                raise
            log(f"Executable error: {exc}. Retrying in {RETRY_DELAY} seconds...")
            time.sleep(RETRY_DELAY)


def check_executable(name: str) -> Path | None:
    path = shutil.which(name)
    if path:
        return Path(path)
    return None


def ensure_node_npm():
    if not check_executable("node"):
        raise RuntimeError("Node.js is required. Install Node.js for Windows and rerun this script.")
    if not check_executable("npm"):
        raise RuntimeError("npm is required. Install Node.js/npm for Windows and rerun this script.")
    log("Node.js and npm are available.")


def ensure_python():
    if not check_executable(sys.executable):
        raise RuntimeError("Python interpreter was not found.")
    log(f"Python interpreter: {sys.executable}")


def create_virtualenv():
    if not VENV_DIR.exists():
        log(f"Creating virtual environment in {VENV_DIR}")
        run_command([sys.executable, "-m", "venv", str(VENV_DIR)], description="Create virtual environment")
    else:
        log(f"Using existing virtual environment at {VENV_DIR}")

    pip_path = get_venv_pip()
    run_command([str(pip_path), "install", "-U", "pip", "setuptools", "wheel"], description="Upgrade pip/setuptools/wheel")
    requirements_file = PYTHON_SERVICE_DIR / "requirements.txt"
    if not requirements_file.exists():
        raise RuntimeError(f"Missing requirements file: {requirements_file}")
    log("Installing Python service dependencies.")
    run_command([str(pip_path), "install", "-r", str(requirements_file)], description="Install Python service requirements")


def get_venv_executable(name: str) -> Path:
    if is_windows():
        candidate = VENV_DIR / "Scripts" / f"{name}.exe"
        if candidate.exists():
            return candidate
    else:
        candidate = VENV_DIR / "bin" / name
        if candidate.exists():
            return candidate
    raise RuntimeError(f"Virtual environment executable not found: {name}")


def get_venv_pip() -> Path:
    return get_venv_executable("pip")


def install_npm_packages():
    log("Installing npm dependencies for the app.")
    run_command(["npm", "install"], cwd=ROOT, description="npm install")


def update_repository():
    git_dir = ROOT / ".git"
    if git_dir.exists():
        log("Updating repository via git pull.")
        run_command(["git", "pull", "--rebase"], cwd=ROOT, description="git pull")
    else:
        log("No git repository detected; skipping update step.")


def show_database_status():
    db_url = get_env_value("DATABASE_URL")
    if not db_url:
        log("DATABASE_URL is not configured. Skipping database inspection.")
        return

    log("Inspecting configured database.")
    try:
        run_command([str(get_venv_python()), str(ROOT / "db_status.py")], description="Inspect database", retry=False)
    except Exception as exc:
        log(f"Database inspection failed: {exc}")
        log("If you want database connectivity, ensure DATABASE_URL is valid and the database server is reachable.")


def run_python_service():
    uvicorn = get_venv_executable("uvicorn")
    app_path = "main:app"
    log("Starting Python service with reload.")
    return subprocess.Popen(
        [str(uvicorn), app_path, "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=str(PYTHON_SERVICE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def run_frontend():
    log("Starting Vite development server.")
    if is_windows():
        return subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
    return subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def tail_process(proc: subprocess.Popen, name: str):
    assert proc.stdout
    for line in proc.stdout:
        print(f"[{name}] {line.rstrip()}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bootstrap and run the Sentinel Windows app.")
    parser.add_argument("--install-only", action="store_true", help="Only install dependencies and do not start the app.")
    parser.add_argument("--update", action="store_true", help="Pull latest changes from git before installing.")
    parser.add_argument("--skip-python-service", action="store_true", help="Do not launch the Python backend service.")
    parser.add_argument("--skip-frontend", action="store_true", help="Do not launch the frontend dev server.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ensure_python()
    ensure_node_npm()

    if args.update:
        update_repository()

    create_virtualenv()
    install_npm_packages()
    show_database_status()

    if args.install_only:
        log("Install complete. Use --install-only to stop after install.")
        return 0

    processes = []
    try:
        if not args.skip_python_service:
            processes.append((run_python_service(), "python-service"))
        if not args.skip_frontend:
            processes.append((run_frontend(), "frontend"))

        if not processes:
            log("Nothing to run; exiting.")
            return 0

        log("App is starting. Press Ctrl+C to stop.")
        while True:
            for proc, name in list(processes):
                if proc.poll() is not None:
                    raise RuntimeError(f"{name} exited unexpectedly with code {proc.returncode}.")
            time.sleep(1)
    except KeyboardInterrupt:
        log("Shutting down processes...")
    finally:
        for proc, name in processes:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
    return 0


if __name__ == "__main__":
    sys.exit(main())
