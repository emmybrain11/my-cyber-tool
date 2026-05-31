#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PYTHON_SERVICE_DIR = ROOT / "python-service"
RELEASE_DIR = ROOT / "release"
DIST_DIR = ROOT / "dist"
LAUNCHER_SCRIPT = ROOT / "launcher.py"
RELEASE_NODE_EXE = RELEASE_DIR / "node.exe"
RELEASE_PYTHON_SERVICE_EXE = RELEASE_DIR / "python-service.exe"
RELEASE_LAUNCHER_EXE = RELEASE_DIR / "launcher.exe"


def log(message: str) -> None:
    print(f"[package] {message}")


def run_command(command: list[str], cwd: Path | None = None, retry: bool = True, description: str = "command") -> subprocess.CompletedProcess[str]:
    attempts = 0
    while True:
        attempts += 1
        try:
            if command and not Path(command[0]).is_absolute():
                resolved = shutil.which(command[0])
                if resolved:
                    command[0] = resolved
            log(f"Running ({attempts}): {' '.join(command)}")
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
        except FileNotFoundError as exc:
            raise RuntimeError(
                f"Executable not found: {command[0]}. Ensure it is installed and available on PATH."
            ) from exc
        except subprocess.CalledProcessError as exc:
            print(exc.stderr.strip())
            if not retry or attempts >= 5:
                raise RuntimeError(f"{description} failed after {attempts} attempts") from exc
            log(f"{description} failed; retrying in 5 seconds...")
            time.sleep(5)


def check_executable(name: str) -> Path:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"Required executable not found: {name}")
    return Path(path)


def ensure_npm_packages():
    log("Installing npm packages.")
    npm_exe = check_executable("npm")
    run_command([str(npm_exe), "install"], cwd=ROOT, description="npm install")


def build_app():
    log("Building frontend and backend assets.")
    npm_exe = check_executable("npm")
    run_command([str(npm_exe), "run", "build"], cwd=ROOT, description="npm run build")


def prepare_release():
    log("Preparing release folder.")
    if RELEASE_DIR.exists():
        shutil.rmtree(RELEASE_DIR)
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)

    if not DIST_DIR.exists():
        raise RuntimeError("dist directory not found. Run the build first.")

    shutil.copytree(DIST_DIR, RELEASE_DIR / "dist")
    log("Copied dist assets.")

    env_source = ROOT / ".env"
    if env_source.exists():
        shutil.copy(env_source, RELEASE_DIR / ".env")
        log("Copied .env to release folder.")
    else:
        sample_env = ROOT / ".env.example"
        if sample_env.exists():
            shutil.copy(sample_env, RELEASE_DIR / ".env")
            log("Copied .env.example to release folder as .env.")


def copy_node_runtime():
    node_path = check_executable("node")
    node_dir = node_path.parent
    log(f"Copying Node runtime from {node_dir}")
    shutil.copy(node_path, RELEASE_NODE_EXE)
    node_dll = node_dir / "node.dll"
    if node_dll.exists():
        shutil.copy(node_dll, RELEASE_DIR / "node.dll")


def install_pyinstaller():
    log("Installing PyInstaller.")
    run_command([sys.executable, "-m", "pip", "install", "--upgrade", "pip", "pyinstaller"], description="Install PyInstaller")


def build_python_service_exe():
    log("Building Python service executable.")
    run_command(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--onefile",
            "--name",
            RELEASE_PYTHON_SERVICE_EXE.stem,
            "main.py",
            "--distpath",
            str(RELEASE_DIR),
            "--workpath",
            str(RELEASE_DIR / "build"),
            "--specpath",
            str(RELEASE_DIR / "build"),
        ],
        cwd=PYTHON_SERVICE_DIR,
        description="Build Python service executable",
    )


def build_launcher_exe():
    log("Building launcher executable.")
    run_command(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--onefile",
            "--name",
            RELEASE_LAUNCHER_EXE.stem,
            "launcher.py",
            "--distpath",
            str(RELEASE_DIR),
            "--workpath",
            str(RELEASE_DIR / "build"),
            "--specpath",
            str(RELEASE_DIR / "build"),
        ],
        cwd=ROOT,
        description="Build launcher executable",
    )


def main() -> int:
    check_executable("node")
    check_executable("npm")
    check_executable(sys.executable)

    ensure_npm_packages()
    build_app()
    prepare_release()
    copy_node_runtime()
    install_pyinstaller()
    build_python_service_exe()
    build_launcher_exe()

    log("Release package created in the release/ folder.")
    log("Distribute the release folder to Windows laptops and run launcher.exe.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
