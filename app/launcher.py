#!/usr/bin/env python3
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
import urllib.request
import urllib.error
import json
import tempfile
import shutil


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


def _read_local_release_version(root: Path) -> str | None:
    p = root / "release_version.txt"
    if p.exists():
        try:
            return p.read_text(encoding="utf-8").strip()
        except Exception:
            return None
    return None


def _write_local_release_version(root: Path, version: str) -> None:
    try:
        (root / "release_version.txt").write_text(str(version), encoding="utf-8")
    except Exception:
        pass


def _check_and_stage_update(root: Path, repo: str = "emmybrain11/my-cyber-tool", token: str | None = None) -> bool:
    """Check GitHub releases for a new release and stage the update into `update_pending/`.
    This downloads the release ZIP (or falls back to the main branch ZIP) and extracts it to
    `<root>/update_pending` so the update can be applied on next restart.
    Returns True if an update was downloaded, False otherwise.
    """
    try:
        api_url = f"https://api.github.com/repos/{repo}/releases/latest"
        req = urllib.request.Request(api_url, headers={"Accept": "application/vnd.github.v3+json"})
        if token:
            req.add_header("Authorization", f"token {token}")
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.load(resp)

        remote_tag = data.get("tag_name") or str(data.get("id") or "")
        if not remote_tag:
            remote_tag = ""

        local_tag = _read_local_release_version(root)
        if local_tag and remote_tag and local_tag == remote_tag:
            print(f"[updater] already up-to-date: {local_tag}")
            return False

        # prefer a release asset zip
        asset_url = None
        for a in data.get("assets", []) or []:
            name = a.get("name") or ""
            if name.endswith(".zip"):
                asset_url = a.get("browser_download_url")
                break

        if not asset_url:
            # fallback: download the repository main branch zip (this is code, not packaged release)
            asset_url = f"https://github.com/{repo}/archive/refs/heads/main.zip"

        print(f"[updater] downloading update from: {asset_url}")
        tmpdir = Path(tempfile.mkdtemp(prefix="sentinel_update_"))
        zip_path = tmpdir / "update.zip"
        dl_req = urllib.request.Request(asset_url, headers={"Accept": "application/octet-stream"})
        if token:
            dl_req.add_header("Authorization", f"token {token}")
        with urllib.request.urlopen(dl_req, timeout=120) as r:
            zip_bytes = r.read()
            zip_path.write_bytes(zip_bytes)

        extract_dir = tmpdir / "extract"
        extract_dir.mkdir(parents=True, exist_ok=True)
        shutil.unpack_archive(str(zip_path), str(extract_dir))

        pending = root / "update_pending"
        if pending.exists():
            shutil.rmtree(pending)

        # If the archive unpacks into a single top-level folder, move its contents, otherwise move all
        children = list(extract_dir.iterdir())
        if len(children) == 1 and children[0].is_dir():
            shutil.move(str(children[0]), str(pending))
        else:
            pending.mkdir(parents=True, exist_ok=True)
            for item in children:
                shutil.move(str(item), str(pending / item.name))

        # record the remote tag for next-run comparisons
        try:
            (root / "release_update_info.json").write_text(json.dumps({"tag": remote_tag}))
            if remote_tag:
                _write_local_release_version(root, remote_tag)
        except Exception:
            pass

        print(f"[updater] update staged at: {pending}. Restart the app to apply the update.")
        return True
    except Exception as exc:
        print(f"[updater] update check failed: {exc}")
        return False


def main() -> int:
    if getattr(sys, "frozen", False):
        root = Path(sys.executable).resolve().parent
    else:
        root = Path(__file__).resolve().parent

    # If there's a staged update pending and the user requested apply, apply it before starting
    try:
        apply_env = os.environ.get("APPLY_STAGED_UPDATE")
        if apply_env and apply_env.lower() in ("1", "true", "yes"):
            def _apply_staged_update(root: Path) -> bool:
                pending = root / "update_pending"
                if not pending.exists():
                    return False
                running_names = {Path(sys.executable).name, Path(__file__).name}
                for item in list(pending.iterdir()):
                    dest = root / item.name
                    if dest.exists():
                        if dest.name in running_names:
                            print(f"[updater] skipping replace of running file: {dest.name}")
                            continue
                        try:
                            if dest.is_dir():
                                shutil.rmtree(dest)
                            else:
                                dest.unlink()
                        except Exception:
                            pass
                    try:
                        shutil.move(str(item), str(dest))
                    except Exception as exc:
                        print(f"[updater] move failed for {item}: {exc}")
                # cleanup pending
                try:
                    if pending.exists():
                        shutil.rmtree(pending)
                except Exception:
                    pass
                print("[updater] staged update applied.")
                return True

            applied = _apply_staged_update(root)
            if applied:
                print("[launcher] Update applied, restarting launcher.")
                os.execv(sys.executable, [sys.executable] + sys.argv)
    except Exception as exc:
        print(f"[launcher] apply update check failed: {exc}")

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

    # Optionally check for updates and stage them
    try:
        check_env = os.environ.get("CHECK_FOR_UPDATES")
        if check_env and check_env.lower() in ("1", "true", "yes") or "--check-updates" in sys.argv:
            repo = os.environ.get("UPDATE_REPO", "emmybrain11/my-cyber-tool")
            token = os.environ.get("GITHUB_TOKEN")
            _check_and_stage_update(root, repo=repo, token=token)
    except Exception as exc:
        print(f"[launcher] check updates failed: {exc}")

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
