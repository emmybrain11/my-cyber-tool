Python service for Sentinel Cyber Lab

This service provides:
- Repository cloning into a local workspace
- Named tool execution for real-world security tools
- Shell command execution inside the workspace
- Ollama model support for chat completions

Setup
```bash
cd app/python-service
python -m pip install -r requirements.txt
# or use poetry if preferred:
# poetry install
```

Run
```bash
cd app/python-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Available endpoints
- `GET /status`
- `GET /tools`
- `POST /clone` with JSON `{ "repo_url": "https://github.com/user/repo.git", "branch": "main" }`
- `POST /run` with JSON `{ "command": "python3 -m http.server 8000" }`
- `POST /ollama` with JSON `{ "model": "llama2", "prompt": "Help me write a payload." }`

Security
- Only run this service in a controlled lab environment.
- Ensure `ollama` is installed and models are available locally.
- Use the `/workspace` directory for cloned repos and tool deployment.
