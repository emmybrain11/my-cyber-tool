Containerized development and lab usage

Quick start (build app and database only):

```powershell
# from the app directory
docker compose up --build -d app db
```

Open the app at http://localhost:3000/

To use the scanner interactively (SAFETY: only in an authorized lab):

```powershell
# Run a short ping-scan on a private range - requires explicit enable
docker compose run --rm -e ALLOW_SCANS=1 scanner nmap -sn 192.168.1.0/24

# Or start a shell in the scanner container and run tools manually
docker compose run --rm -e ALLOW_SCANS=1 scanner /bin/bash
```

Notes:
- The `scanner` service is not exposed to the host network by default.
- Scans must be intentionally enabled using `ALLOW_SCANS=1` or by copying an `/authorized` file into the container.
- For production deployments, build the app (`npm run build`) and run `node dist/boot.js` behind a reverse proxy with HTTPS.
