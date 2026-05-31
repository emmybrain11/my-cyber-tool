#!/usr/bin/env python3
import argparse
import os
import platform
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV_DIR = ROOT / ".venv"
PYTHON_SERVICE_DIR = ROOT / "python-service"
SETUP_SCRIPT = ROOT / "setup_windows.py"


def log(message: str) -> None:
    print(f"[run] {message}")


def is_windows() -> bool:
    return platform.system().lower() == "windows"


def find_executable(name: str) -> Path | None:
    path = shutil.which(name)
    return Path(path) if path else None


def get_python_executable() -> Path:
    if VENV_DIR.exists():
        candidate = VENV_DIR / "Scripts" / "python.exe" if is_windows() else VENV_DIR / "bin" / "python"
        if candidate.exists():
            return candidate
    return Path(sys.executable)


def run_command(command: list[str], cwd: Path | None = None, description: str = "command") -> subprocess.CompletedProcess[str]:
    log(f"Running: {' '.join(command)}")
    result = subprocess.run(
        command,
        cwd=str(cwd) if cwd else None,
        check=True,
        capture_output=True,
        text=True,
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print(result.stderr.strip())
    return result


def get_venv_pip() -> Path:
    if is_windows():
        return VENV_DIR / "Scripts" / "pip.exe"
    return VENV_DIR / "bin" / "pip"


def ensure_python_service_dependencies() -> None:
    python_exe = get_python_executable()
    check = subprocess.run([str(python_exe), "-c", "import uvicorn"], capture_output=True, text=True)
    if check.returncode == 0:
        log("Python service dependencies are installed.")
        return

    if not VENV_DIR.exists():
        raise RuntimeError("Virtual environment is missing. Run with --install-only or setup_windows.py first.")
    pip_exe = get_venv_pip()
    if not pip_exe.exists():
        raise RuntimeError("pip was not found in the virtual environment.")

    log("Installing missing Python service dependencies.")
    python_exe = get_python_executable()
    run_command([str(python_exe), "-m", "pip", "install", "-U", "pip", "setuptools", "wheel"], description="Upgrade venv pip")
    requirements_file = PYTHON_SERVICE_DIR / "requirements.txt"
    if not requirements_file.exists():
        raise RuntimeError(f"Missing requirements file: {requirements_file}")
    run_command([str(python_exe), "-m", "pip", "install", "-r", str(requirements_file)], description="Install Python service requirements")


def prepare_environment() -> None:
    if not VENV_DIR.exists() or not (ROOT / "node_modules").exists():
        if not SETUP_SCRIPT.exists():
            raise RuntimeError("Missing setup script. Cannot bootstrap the environment.")

        log("Preparing the application environment.")
        run_command([str(get_python_executable()), str(SETUP_SCRIPT), "--install-only"], cwd=ROOT, description="Bootstrap environment")
    else:
        log("Environment already prepared.")

    ensure_python_service_dependencies()


def ensure_node_npm() -> None:
    if not find_executable("node"):
        raise RuntimeError("Node.js is required. Install Node.js and ensure it is on PATH.")
    if not find_executable("npm"):
        raise RuntimeError("npm is required. Install Node.js/npm and ensure it is on PATH.")
    log("Node.js and npm are available.")


def run_python_service(backend_host: str, backend_port: int) -> subprocess.Popen[str]:
    python_exe = get_python_executable()
    env = os.environ.copy()
    env["PYTHON_SERVICE_URL"] = f"http://{backend_host}:{backend_port}"
    log(f"Starting Python backend service on {backend_host}:{backend_port}.")
    return subprocess.Popen(
        [
            str(python_exe),
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            backend_host,
            "--port",
            str(backend_port),
        ],
        cwd=str(PYTHON_SERVICE_DIR),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )


def is_port_free(host: str, port: int) -> bool:
    import socket

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False


def run_frontend(frontend_port: int, frontend_host: str, backend_host: str, backend_port: int) -> subprocess.Popen[str]:
    npm_exe = find_executable("npm")
    if not npm_exe:
        raise RuntimeError("npm is required to start the frontend.")
    env = os.environ.copy()
    env["PYTHON_SERVICE_URL"] = f"http://{backend_host}:{backend_port}"
    log(f"Starting Vite frontend server on {frontend_host}:{frontend_port}.")
    return subprocess.Popen(
        [str(npm_exe), "run", "dev", "--", "--host", frontend_host, "--port", str(frontend_port)],
        cwd=str(ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )


def stream_output(proc: subprocess.Popen[str], name: str) -> None:
    assert proc.stdout
    for line in proc.stdout:
        print(f"[{name}] {line.rstrip()}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start the full Sentinel app with frontend and backend.")
    parser.add_argument("--skip-python-service", action="store_true", help="Do not launch the Python backend service.")
    parser.add_argument("--skip-frontend", action="store_true", help="Do not launch the Vite frontend server.")
    parser.add_argument("--install-only", action="store_true", help="Prepare the environment and exit without starting servers.")
    parser.add_argument("--frontend-host", default="127.0.0.1", help="Frontend host to bind.")
    parser.add_argument("--frontend-port", type=int, default=3000, help="Frontend port to bind.")
    parser.add_argument("--backend-host", default="127.0.0.1", help="Backend host to bind.")
    parser.add_argument("--backend-port", type=int, default=8000, help="Backend port to bind.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ensure_node_npm()

    if args.install_only:
        prepare_environment()
        log("Install-only complete.")
        return 0

    prepare_environment()

    # Ensure backend port is free; if not, pick the next available port to avoid conflicts (e.g., Splunk on 8000)
    desired_port = args.backend_port
    if not is_port_free(args.backend_host, desired_port):
        log(f"Port {desired_port} is in use; searching for available port...")
        found = None
        for p in range(desired_port + 1, desired_port + 101):
            if is_port_free(args.backend_host, p):
                found = p
                break
        if found:
            log(f"Using backend port {found} instead of {desired_port}.")
            args.backend_port = found
        else:
            raise RuntimeError(f"No available backend port found near {desired_port}.")

    processes: list[tuple[subprocess.Popen[str], str]] = []
    if not args.skip_python_service:
        processes.append((run_python_service(args.backend_host, args.backend_port), "python-service"))
    if not args.skip_frontend:
        processes.append((run_frontend(args.frontend_port, args.frontend_host, args.backend_host, args.backend_port), "frontend"))

    if not processes:
        log("No processes to run. Use --skip-python-service or --skip-frontend to exclude one.")
        return 0

    threads = [threading.Thread(target=stream_output, args=(proc, name), daemon=True) for proc, name in processes]
    for thread in threads:
        thread.start()

    log("Application is starting. Press Ctrl+C to stop.")
    try:
        while True:
            for proc, name in processes:
                if proc.poll() is not None:
                    raise RuntimeError(f"{name} exited unexpectedly with code {proc.returncode}.")
            time.sleep(1)
    except KeyboardInterrupt:
        log("Stopping all services...")
    finally:
        for proc, name in processes:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    proc.kill()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"[run] Error: {exc}")
        sys.exit(1)
