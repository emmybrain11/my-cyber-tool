import json
import os
import shlex
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from passlib.hash import sha256_crypt
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DIST_DIR = PROJECT_DIR / "dist"
WORKSPACE_DIR = BASE_DIR / "workspace"
TOOLS_FILE = BASE_DIR / "tools.json"
USERS_FILE = BASE_DIR / "users.json"
DATA_FILE = BASE_DIR / "data.json"
DOTENV_FILE = PROJECT_DIR / ".env"

WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
load_dotenv(DOTENV_FILE)

APP_SECRET = os.getenv("APP_SECRET", "devsecret")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminpass")
ALLOW_SCRIPT_EXECUTION = os.getenv("ALLOW_SCRIPT_EXECUTION", "0") == "1"
JWT_ALGORITHM = "HS256"
SESSION_COOKIE = "sentinel_sid"

app = FastAPI(title="Sentinel Python Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


def _load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def _save_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2))


def _ensure_file(path: Path, default: Any) -> Any:
    if not path.exists():
        _save_json(path, default)
    return _load_json(path, default)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _create_id(records: List[Dict[str, Any]]) -> int:
    return max((int(item.get("id", 0)) for item in records), default=0) + 1


def _is_localhost(request: Request) -> bool:
    host = request.headers.get("host", "")
    return host.startswith("localhost") or host.startswith("127.0.0.1")


def _session_cookie_options(request: Request) -> Dict[str, Any]:
    localhost = _is_localhost(request)
    return {
        "httponly": True,
        "path": "/",
        "samesite": "lax" if localhost else "none",
        "secure": not localhost,
    }


def _create_token(payload: Dict[str, str]) -> str:
    return jwt.encode(payload, APP_SECRET, algorithm=JWT_ALGORITHM)


def _verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, APP_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


def _load_users() -> List[Dict[str, Any]]:
    users = _ensure_file(USERS_FILE, [])
    if ADMIN_EMAIL and ADMIN_PASSWORD:
        admin_email = _normalize_email(ADMIN_EMAIL)
        if not any(_normalize_email(u.get("email", "")) == admin_email for u in users):
            users.append(
                {
                    "id": _create_id(users),
                    "unionId": admin_email,
                    "email": admin_email,
                    "name": "Admin",
                    "passwordHash": sha256_crypt.hash(ADMIN_PASSWORD),
                    "approved": 1,
                    "role": "admin",
                    "createdAt": datetime.utcnow().isoformat(),
                    "lastSignInAt": None,
                }
            )
            _save_json(USERS_FILE, users)
    return users


def _save_users(users: List[Dict[str, Any]]) -> None:
    _save_json(USERS_FILE, users)


def _load_data() -> Dict[str, Any]:
    default = {
        "scanResults": [],
        "defenseActivity": [],
        "cyberRangeLogs": [],
        "reports": [],
        "systemHealth": [],
    }
    return _ensure_file(DATA_FILE, default)


def _save_data(data: Dict[str, Any]) -> None:
    _save_json(DATA_FILE, data)


def _find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    users = _load_users()
    normalized = _normalize_email(email)
    return next((u for u in users if _normalize_email(u.get("email", "")) == normalized), None)


def _find_user_by_union_id(union_id: str) -> Optional[Dict[str, Any]]:
    users = _load_users()
    normalized = _normalize_email(union_id)
    return next((u for u in users if _normalize_email(u.get("unionId", "")) == normalized), None)


def _current_user(request: Request) -> Optional[Dict[str, Any]]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    payload = _verify_token(token)
    if not payload:
        return None
    return _find_user_by_union_id(str(payload.get("unionId", "")))


def _serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in user.items() if k != "passwordHash"}


def _exec_command(command: str) -> Dict[str, Any]:
    shell = os.name == "nt"
    result = subprocess.run(command, shell=shell, capture_output=True, text=True, cwd=str(WORKSPACE_DIR), timeout=120)
    return {
        "command": command,
        "stdout": result.stdout.strip() if result.stdout else "",
        "stderr": result.stderr.strip() if result.stderr else "",
        "exit_code": result.returncode,
    }


def _get_python_tools() -> List[Dict[str, Any]]:
    if not TOOLS_FILE.exists():
        return []
    try:
        return json.loads(TOOLS_FILE.read_text())
    except Exception:
        return []


class TRPCRequest(BaseModel):
    id: Optional[Union[str, int]] = None
    method: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


def _make_response(result: Any = None, error: Optional[Dict[str, Any]] = None, id: Optional[Union[str, int]] = None) -> Dict[str, Any]:
    response: Dict[str, Any] = {"id": id}
    if error is not None:
        response["error"] = error
    else:
        response["result"] = {"data": result}
    return response


def _require_admin(user: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient role.")
    return user


def _require_authenticated(user: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not user:
        raise HTTPException(status_code=401, detail="Unauthenticated.")
    return user


def _handle_auth_login(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    email = str(input_data.get("email", "")).strip()
    password = str(input_data.get("password", ""))
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    user = _find_user_by_email(email)
    if not user or not user.get("passwordHash"):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if not sha256_crypt.verify(password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if not user.get("approved"):
        raise HTTPException(status_code=401, detail="Your account is pending approval.")
    token = _create_token({"unionId": user["unionId"], "clientId": "local"})
    response.set_cookie(SESSION_COOKIE, token, **_session_cookie_options(request))
    return {"success": True, "user": _serialize_user(user)}


def _handle_auth_register(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    email = str(input_data.get("email", "")).strip()
    password = str(input_data.get("password", ""))
    name = str(input_data.get("name", "New User")).strip() or "New User"
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    if _find_user_by_email(email):
        raise HTTPException(status_code=400, detail="Email is already registered.")
    users = _load_users()
    new_user = {
        "id": _create_id(users),
        "unionId": _normalize_email(email),
        "email": _normalize_email(email),
        "name": name,
        "passwordHash": sha256_crypt.hash(password),
        "approved": 0,
        "role": "user",
        "createdAt": datetime.utcnow().isoformat(),
        "lastSignInAt": None,
    }
    users.append(new_user)
    _save_users(users)
    return {"success": True, "user": _serialize_user(new_user)}


def _handle_auth_me(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    user = _require_authenticated(_current_user(request))
    return user


def _handle_auth_logout(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"success": True}


@app.post("/auth/login")
def auth_login(payload: Dict[str, Any], request: Request, response: Response):
    return _handle_auth_login(payload, request, response)


@app.post("/auth/register")
def auth_register(payload: Dict[str, Any], request: Request, response: Response):
    return _handle_auth_register(payload, request, response)


@app.get("/auth/user")
def auth_user(request: Request, email: Optional[str] = None):
    if email:
        user = _find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return _serialize_user(user)

    user = _require_authenticated(_current_user(request))
    return _serialize_user(user)


def _handle_python_tools(input_data: Dict[str, Any], request: Request, response: Response) -> List[Dict[str, Any]]:
    _require_authenticated(_current_user(request))
    return _get_python_tools()


def _handle_python_clone(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_authenticated(_current_user(request))
    if not input_data.get("repo_url"):
        raise HTTPException(status_code=400, detail="repo_url is required")
    target = input_data.get("target_dir") or input_data["repo_url"].rstrip("/ ").split("/")[-1].replace(".git", "")
    return _exec_command(f"git clone {shlex.quote(str(input_data['repo_url']))} {shlex.quote(str(WORKSPACE_DIR / target))}")


def _handle_python_run(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_authenticated(_current_user(request))
    if not input_data.get("command") and not input_data.get("tool"):
        raise HTTPException(status_code=400, detail="command or tool is required")
    if input_data.get("tool"):
        tools = _get_python_tools()
        tool = next((item for item in tools if item.get("name") == input_data["tool"]), None)
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        command = tool.get("command", "").replace("{args}", str(input_data.get("args", "")))
        if "{repo_url}" in command or "{target_dir}" in command:
            raise HTTPException(status_code=400, detail="Tool command requires repository or target_dir substitution.")
        return _exec_command(command)
    return _exec_command(str(input_data.get("command", "")))


def _handle_tools_exec(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_authenticated(_current_user(request))
    if not ALLOW_SCRIPT_EXECUTION:
        raise HTTPException(status_code=403, detail="Script execution is disabled. Set ALLOW_SCRIPT_EXECUTION=1 to enable it.")
    command = str(input_data.get("script", "")).strip()
    if not command:
        raise HTTPException(status_code=400, detail="script is required")
    return _exec_command(command)


def _handle_ai_chat(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_authenticated(_current_user(request))
    prompt = str(input_data.get("prompt", "")).strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    history = input_data.get("history") or []
    model = input_data.get("model") or os.getenv("OLLA_MODEL", "llama2")
    return {"response": f"AI chat is not available in this backend. Prompt received: {prompt[:200]}"}


def _handle_dashboard_stats(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    total_assets = next((int(item.get("value", 0)) for item in data.get("systemHealth", []) if item.get("metric") == "total_assets"), 4271)
    active_scans = sum(1 for scan in data.get("scanResults", []) if scan.get("status") == "running")
    scans_today = sum(1 for scan in data.get("scanResults", []) if scan.get("createdAt", "").startswith(datetime.utcnow().strftime("%Y-%m-%d")))
    threats_detected = sum(1 for event in data.get("defenseActivity", []) if event.get("severity") == "high" and event.get("status") == "active")
    return {
        "totalAssets": total_assets,
        "activeScans": active_scans,
        "scansToday": scans_today,
        "threatsDetected": threats_detected,
    }


def _handle_dashboard_recent(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    limit = int(input_data.get("limit", 10)) if input_data else 10
    events = sorted(data.get("defenseActivity", []), key=lambda e: e.get("createdAt", ""), reverse=True)[:limit]
    return {"activity": events}


def _handle_health_list(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    metrics = sorted(data.get("systemHealth", []), key=lambda m: m.get("recordedAt", ""), reverse=True)
    seen = set()
    deduped = []
    for metric in metrics:
        if metric.get("metric") in seen:
            continue
        seen.add(metric.get("metric"))
        deduped.append(metric)
    return {"metrics": deduped}


def _handle_health_db(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    return {"ok": True, "db": False, "sqliteFallback": False}


def _handle_health_update(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_admin(_require_authenticated(_current_user(request)))
    data = _load_data()
    metric = str(input_data.get("metric", "")).strip()
    if not metric:
        raise HTTPException(status_code=400, detail="metric is required")
    record = {
        "id": _create_id(data.get("systemHealth", [])),
        "metric": metric,
        "value": str(input_data.get("value", "")),
        "status": str(input_data.get("status", "healthy")),
        "recordedAt": datetime.utcnow().isoformat(),
    }
    data["systemHealth"].append(record)
    _save_data(data)
    return record


def _handle_scan_list(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    scans = data.get("scanResults", [])
    if input_data:
        if input_data.get("module"):
            scans = [s for s in scans if s.get("module") == input_data.get("module")]
        if input_data.get("status"):
            scans = [s for s in scans if s.get("status") == input_data.get("status")]
    offset = int(input_data.get("offset", 0)) if input_data else 0
    limit = int(input_data.get("limit", 20)) if input_data else 20
    return {"scans": scans[offset : offset + limit], "total": len(scans)}


def _handle_scan_get_by_id(input_data: Dict[str, Any], request: Request, response: Response) -> Optional[Dict[str, Any]]:
    data = _load_data()
    return next((s for s in data.get("scanResults", []) if s.get("id") == int(input_data.get("id", 0))), None)


def _handle_scan_create(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    record = {
        "id": _create_id(data.get("scanResults", [])),
        "module": str(input_data.get("module", "")),
        "target": input_data.get("target"),
        "status": "pending",
        "createdAt": datetime.utcnow().isoformat(),
    }
    data["scanResults"].append(record)
    _save_data(data)
    return record


def _handle_scan_update(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    scan = next((s for s in data.get("scanResults", []) if s.get("id") == int(input_data.get("id", 0))), None)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    for key in ["status", "findings", "summary", "duration"]:
        if key in input_data:
            scan[key] = input_data[key]
    if input_data.get("status") in {"completed", "failed"}:
        scan["completedAt"] = datetime.utcnow().isoformat()
    _save_data(data)
    return scan


def _handle_scan_delete(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_admin(_require_authenticated(_current_user(request)))
    data = _load_data()
    data["scanResults"] = [s for s in data.get("scanResults", []) if s.get("id") != int(input_data.get("id", 0))]
    _save_data(data)
    return {"success": True}


def _handle_defense_list(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    events = data.get("defenseActivity", [])
    if input_data:
        if input_data.get("severity"):
            events = [e for e in events if e.get("severity") == input_data.get("severity")]
        if input_data.get("status"):
            events = [e for e in events if e.get("status") == input_data.get("status")]
    offset = int(input_data.get("offset", 0)) if input_data else 0
    limit = int(input_data.get("limit", 20)) if input_data else 20
    return {"events": events[offset : offset + limit], "total": len(events)}


def _handle_defense_create(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    record = {
        "id": _create_id(data.get("defenseActivity", [])),
        "eventType": str(input_data.get("eventType", "")),
        "description": str(input_data.get("description", "")),
        "source": input_data.get("source"),
        "target": input_data.get("target"),
        "severity": input_data.get("severity", "medium"),
        "mitreTechnique": input_data.get("mitreTechnique"),
        "status": "active",
        "createdAt": datetime.utcnow().isoformat(),
    }
    data["defenseActivity"].append(record)
    _save_data(data)
    return record


def _handle_defense_update_status(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_admin(_require_authenticated(_current_user(request)))
    data = _load_data()
    record = next((e for e in data.get("defenseActivity", []) if e.get("id") == int(input_data.get("id", 0))), None)
    if not record:
        raise HTTPException(status_code=404, detail="Defense event not found")
    record["status"] = input_data.get("status")
    _save_data(data)
    return record


def _handle_cyber_range_list(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    logs = data.get("cyberRangeLogs", [])
    if input_data and input_data.get("scenario"):
        logs = [log for log in logs if log.get("scenario") == input_data.get("scenario")]
    offset = int(input_data.get("offset", 0)) if input_data else 0
    limit = int(input_data.get("limit", 20)) if input_data else 20
    return {"logs": logs[offset : offset + limit], "total": len(logs)}


def _handle_cyber_range_create(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    data = _load_data()
    record = {
        "id": _create_id(data.get("cyberRangeLogs", [])),
        "scenario": str(input_data.get("scenario", "")),
        "action": str(input_data.get("action", "")),
        "details": input_data.get("details"),
        "createdAt": datetime.utcnow().isoformat(),
    }
    data["cyberRangeLogs"].append(record)
    _save_data(data)
    return record


def _handle_cyber_range_delete(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_admin(_require_authenticated(_current_user(request)))
    data = _load_data()
    data["cyberRangeLogs"] = [log for log in data.get("cyberRangeLogs", []) if log.get("id") != int(input_data.get("id", 0))]
    _save_data(data)
    return {"success": True}


def _handle_admin_pending_users(input_data: Dict[str, Any], request: Request, response: Response) -> List[Dict[str, Any]]:
    _require_admin(_require_authenticated(_current_user(request)))
    return [u for u in _load_users() if not u.get("approved")]


def _handle_admin_all_users(input_data: Dict[str, Any], request: Request, response: Response) -> List[Dict[str, Any]]:
    _require_admin(_require_authenticated(_current_user(request)))
    return [_serialize_user(u) for u in _load_users()]


def _handle_admin_approve_user(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_admin(_require_authenticated(_current_user(request)))
    email = str(input_data.get("email", "")).strip()
    users = _load_users()
    target = next((u for u in users if _normalize_email(u.get("email", "")) == _normalize_email(email)), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    target["approved"] = 1
    if len([u for u in users if u.get("role") == "admin" and u.get("approved")]) < 4:
        target["role"] = "admin"
    _save_users(users)
    return {"success": True, "role": target["role"]}


def _handle_admin_reject_user(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    _require_admin(_require_authenticated(_current_user(request)))
    email = str(input_data.get("email", "")).strip()
    users = _load_users()
    users = [u for u in users if _normalize_email(u.get("email", "")) != _normalize_email(email)]
    _save_users(users)
    return {"success": True}


def _handle_report_list(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    user = _require_authenticated(_current_user(request))
    reports = [r for r in _load_data().get("reports", []) if r.get("userId") == user.get("id")]
    offset = int(input_data.get("offset", 0)) if input_data else 0
    limit = int(input_data.get("limit", 20)) if input_data else 20
    return {"reports": reports[offset : offset + limit], "total": len(reports)}


def _handle_report_generate(input_data: Dict[str, Any], request: Request, response: Response) -> Dict[str, Any]:
    user = _require_authenticated(_current_user(request))
    data = _load_data()
    report = {
        "id": _create_id(data.get("reports", [])),
        "userId": user.get("id"),
        "name": str(input_data.get("name", "Report")),
        "moduleFilter": input_data.get("moduleFilter", "all"),
        "dateFrom": input_data.get("dateFrom"),
        "dateTo": input_data.get("dateTo"),
        "scanCount": len(data.get("scanResults", [])),
        "logCount": len(data.get("cyberRangeLogs", [])),
        "defenseCount": len(data.get("defenseActivity", [])),
        "fileUrl": f"/api/reports/download/{_create_id(data.get('reports', []))}",
        "createdAt": datetime.utcnow().isoformat(),
    }
    data["reports"].append(report)
    _save_data(data)
    return {"report": report, "downloadUrl": report["fileUrl"], "reportData": report}


def _handle_report_get_by_id(input_data: Dict[str, Any], request: Request, response: Response) -> Optional[Dict[str, Any]]:
    user = _require_authenticated(_current_user(request))
    return next((r for r in _load_data().get("reports", []) if r.get("id") == int(input_data.get("id", 0)) and r.get("userId") == user.get("id")), None)


TRPC_HANDLERS = {
    "auth.login": _handle_auth_login,
    "auth.register": _handle_auth_register,
    "auth.me": _handle_auth_me,
    "auth.logout": _handle_auth_logout,
    "python.tools": _handle_python_tools,
    "python.cloneRepo": _handle_python_clone,
    "python.runTool": _handle_python_run,
    "python.runCustomCommand": _handle_python_run,
    "tools.execScript": _handle_tools_exec,
    "ai.chat": _handle_ai_chat,
    "dashboard.stats": _handle_dashboard_stats,
    "dashboard.recentActivity": _handle_dashboard_recent,
    "health.list": _handle_health_list,
    "health.db": _handle_health_db,
    "health.update": _handle_health_update,
    "scan.list": _handle_scan_list,
    "scan.getById": _handle_scan_get_by_id,
    "scan.create": _handle_scan_create,
    "scan.update": _handle_scan_update,
    "scan.delete": _handle_scan_delete,
    "defense.list": _handle_defense_list,
    "defense.create": _handle_defense_create,
    "defense.updateStatus": _handle_defense_update_status,
    "cyberRange.list": _handle_cyber_range_list,
    "cyberRange.create": _handle_cyber_range_create,
    "cyberRange.delete": _handle_cyber_range_delete,
    "admin.pendingUsers": _handle_admin_pending_users,
    "admin.allUsers": _handle_admin_all_users,
    "admin.approveUser": _handle_admin_approve_user,
    "admin.rejectUser": _handle_admin_reject_user,
    "report.list": _handle_report_list,
    "report.generate": _handle_report_generate,
    "report.getById": _handle_report_get_by_id,
}


@app.post("/api/trpc")
async def trpc_endpoint(request: Request, response: Response):
    body = await request.json()
    requests = body if isinstance(body, list) else [body]
    outputs = []
    for item in requests:
        request_id = item.get("id")
        params = item.get("params") or {}
        path = params.get("path") or ""
        input_data = params.get("input")
        if isinstance(input_data, list):
            input_data = input_data[0] if input_data else {}
        if input_data is None:
            input_data = {}

        handler = TRPC_HANDLERS.get(path)
        if not handler:
            outputs.append(_make_response(error={"code": "NOT_FOUND", "message": f"No procedure found on path '{path}'"}, id=request_id))
            continue

        try:
            result = handler(input_data, request, response)
            outputs.append(_make_response(result=result, id=request_id))
        except HTTPException as exc:
            outputs.append(_make_response(error={"code": str(exc.status_code), "message": exc.detail}, id=request_id))
        except Exception as exc:
            outputs.append(_make_response(error={"code": "INTERNAL_SERVER_ERROR", "message": str(exc)}, id=request_id))

    return JSONResponse(content=outputs if len(outputs) > 1 else outputs[0])


@app.get("/status")
def status():
    return {"status": "ok", "workspace": str(WORKSPACE_DIR)}


@app.get("/tools")
def list_tools():
    if not TOOLS_FILE.exists():
        raise HTTPException(status_code=500, detail="Tools metadata missing.")
    return json.loads(TOOLS_FILE.read_text())


@app.post("/clone")
def clone_repo(payload: Dict[str, Any]):
    if not payload.get("repo_url"):
        raise HTTPException(status_code=400, detail="repo_url is required")
    target_name = payload.get("target_dir") or str(payload["repo_url"]).rstrip("/ ").split("/")[-1].replace(".git", "")
    destination = WORKSPACE_DIR / target_name
    if destination.exists():
        raise HTTPException(status_code=400, detail=f"Destination already exists: {destination}")
    command = ["git", "clone", payload["repo_url"], str(destination)]
    if payload.get("branch"):
        command.insert(2, "--branch")
        command.insert(3, payload["branch"])
    result = subprocess.run(command, capture_output=True, text=True)
    return {"command": " ".join(shlex.quote(arg) for arg in command), "stdout": result.stdout, "stderr": result.stderr, "exit_code": result.returncode}


@app.post("/run")
def run_command(payload: Dict[str, Any]):
    if not payload.get("command") and not payload.get("tool"):
        raise HTTPException(status_code=400, detail="command or tool is required")
    if payload.get("tool"):
        tools = _get_python_tools()
        tool = next((item for item in tools if item.get("name") == payload["tool"]), None)
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found")
        command = tool.get("command", "").replace("{args}", str(payload.get("args", "")))
    else:
        command = str(payload.get("command", ""))
    return _exec_command(command)


@app.post("/ollama")
def ollama_request(payload: Dict[str, Any]):
    raise HTTPException(status_code=404, detail="Ollama is not enabled in this backend.")


def _mount_spa_static_files() -> None:
    if not DIST_DIR.exists():
        return

    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    if (DIST_DIR / "favicon.svg").exists():
        app.mount("/favicon.svg", StaticFiles(directory=DIST_DIR), name="favicon")
    if (DIST_DIR / "robots.txt").exists():
        app.mount("/robots.txt", StaticFiles(directory=DIST_DIR), name="robots")
    if (DIST_DIR / "sitemap.xml").exists():
        app.mount("/sitemap.xml", StaticFiles(directory=DIST_DIR), name="sitemap")

_mount_spa_static_files()

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Static files not found.")
