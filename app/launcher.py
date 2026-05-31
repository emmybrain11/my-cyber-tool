#!/usr/bin/env python3
import os
import signal
import subprocess
import sys
import time
from pathlib import Path


def log(message: str) -> None:
    print(f"[launcher] {message}")


def run_process(command: list[str], cwd: Path, env: dict[str, str]) -> subprocess.Popen:
    return subprocess.Popen(
        command,
        cwd=str(cwd),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def stream_output(proc: subprocess.Popen, name: str) -> None:
    assert proc.stdout
    for line in proc.stdout:
        print(f"[{name}] {line.rstrip()}")


def main() -> int:
    if getattr(sys, "frozen", False):
        root = Path(sys.executable).resolve().parent
    else:
        root = Path(__file__).resolve().parent

    node_exe = root / "node.exe"
    python_service_exe = root / "python-service.exe"
    node_script = root / "dist" / "boot.js"

    if not node_exe.exists():
        log("Missing node.exe in the release folder.")
        return 1
    if not python_service_exe.exists():
        log("Missing python-service.exe in the release folder.")
        return 2
    if not node_script.exists():
        log("Missing dist/boot.js in the release folder.")
        return 3

    env = os.environ.copy()
    env["PYTHON_SERVICE_URL"] = "http://127.0.0.1:8000"
    env["NODE_ENV"] = "production"

    log("Starting Python service...")
    python_proc = run_process([str(python_service_exe)], root, env)
    time.sleep(2)

    log("Starting Node backend...")
    node_proc = run_process([str(node_exe), str(node_script)], root, env)

    try:
        while True:
            if python_proc.poll() is not None:
                log(f"Python service exited with code {python_proc.returncode}")
                return python_proc.returncode or 0
            if node_proc.poll() is not None:
                log(f"Node backend exited with code {node_proc.returncode}")
                return node_proc.returncode or 0
            time.sleep(1)
    except KeyboardInterrupt:
        log("Shutting down services...")
    finally:
        for proc in [node_proc, python_proc]:
            if proc and proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
    return 0


if __name__ == "__main__":
    sys.exit(main())
