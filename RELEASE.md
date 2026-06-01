# Release Package

This repository includes a Windows packaging workflow and release package builder.

## Build the distributable app

From the repo root:

```powershell
cd app
npm install
npm run build:package
```

This will create a `release/` folder and a `release.zip` package containing:

- `launcher.exe` — starts the app
- `python-service.exe` — Python backend service
- `node.exe` and `node.dll` — Node runtime
- `dist/` — bundled frontend/backend code
- `.env` or `.env.example` for runtime configuration

## Distribute to classmates

Share the `release/` folder as a ZIP archive so classmates can download the executable package without the full source tree.

## Enable live tool execution

The built app uses `ALLOW_SCRIPT_EXECUTION=1` in the environment to allow live tool and command execution.

## Update from source code

The GitHub Actions workflow `/.github/workflows/package.yml` builds a new release artifact automatically on push to `main`.

Classmates can download the latest executable package from the workflow artifacts or from a future GitHub release.

If you want a self-updating installer, add a small updater script that pulls the latest release ZIP from GitHub and extracts it over the existing package.
