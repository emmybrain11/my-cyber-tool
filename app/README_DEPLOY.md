# Deployment guide

Steps to run the app in production (Docker Compose):

1. Ensure Docker (and Docker Compose) is installed and running.
2. From the `app` folder, create a `.env` with production secrets (example provided in repo).
3. Build and run:

```bash
cd app
docker compose -f docker-compose.prod.yml up --build -d
```

4. Run DB migrations (if required):

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

5. Visit `http://<server-host>:8088`.

CI: A GitHub Actions workflow is included at `.github/workflows/ci.yml` to build the app on push.

Notes:
- The image runs `node dist/boot.js` which serves the Hono backend and static frontend.
- If you also need the Python service running, add a `python-service` container that runs `uvicorn` and set `PYTHON_SERVICE_URL` accordingly.
