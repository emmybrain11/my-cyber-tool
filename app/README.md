# Emmy Cybersecurity Lab

This repository is the cybersecurity training app built by Emmy and his coursemates for real-world learning. It combines offensive and defensive tooling, web vulnerability practice, OSINT reconnaissance, crypto/stego labs, and a Windows packaging workflow in a single workspace.

## Overview

Emmy built this app to give his fellow cybersecurity students one place to learn and experiment safely.

- Frontend: React + TypeScript + Vite.
- Backend: Hono with Node.js for app APIs and routing.
- Python tooling service: FastAPI for command execution, repo automation, OSINT, and AI-assisted cyber tasks.
- Windows packaging: `package_windows.py` creates a distributable `release/` folder with `launcher.exe`.
- One-command startup: `run.py` launches both frontend and backend together.
- Built by 🔏emmy-brain-codes🛰️ as a security-first training system.

This app includes a signup path where new users request access and existing admins approve accounts. The first four approved users are granted admin access automatically.

## What it teaches

This app is designed to support real-world cybersecurity learning:

- website scanning and vulnerability assessment
- exploitation guidance and risk reporting
- defense recommendations and system health monitoring
- OSINT reconnaissance and repo tooling
- cryptography and steganography practice
- malware creation/defense workflows
- packaging a Windows lab application for distribution

## Run the complete app

From the `app/` folder:

```powershell
python run.py --frontend-port 8088
```

Or with npm:

```powershell
npm run dev -- --port 8088
```

This starts:

- Python backend service on `http://127.0.0.1:8000`
- Vite frontend on `http://localhost:8088`

If a port is blocked, stop the process using that port or update the frontend/backend host and port options in `run.py`.

## Build a Windows executable

From the `app/` folder:

```powershell
python package_windows.py
```

After packaging, the `release/` folder will include:

- `launcher.exe`
- `python-service.exe`
- `node.exe`
- `dist/` frontend assets

Share the `release/` folder and run `launcher.exe` on Windows machines.

## Project structure

- `app/`: main web app, launcher, packaging, install scripts
- `app/python-service/`: FastAPI tooling service and API
- `app/src/`: frontend React pages and components
- `app/api/`: backend route definitions for auth, scanning, reporting, and security logic
- `app/package_windows.py`: Windows release builder
- `app/run.py`: full app startup launcher
- `app/setup_windows.py`: environment install/bootstrap helper

## How Emmy built it

Emmy started from a Vite React template and added real cybersecurity capabilities step by step. He integrated a Node backend for app logic, built a Python service for security tooling, and added a Windows packaging workflow so coursemates can run the app easily.

This repo is a student-facing lab: it is intended for training, not unauthorized scanning. Use it in a controlled environment, follow ethics, and learn from the tools and workflows included.

## Notes

- Keep dependencies updated before packaging.
- Use the `run.py` launcher for local development.
- Review `python-service/requirements.txt` when adding new backend tools.
- The app is built to teach practical cybersecurity in one place.
