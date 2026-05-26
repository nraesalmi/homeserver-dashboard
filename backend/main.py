from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import time
import httpx
import psutil
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
SERVICES_FILE = os.path.join(BASE_DIR, "services.json")
load_dotenv(os.path.join(BASE_DIR, ".env"))

BESZEL_URL = os.environ.get("BESZEL_URL", "http://192.168.0.105:809")
BESZEL_EMAIL = os.environ.get("BESZEL_EMAIL")
BESZEL_PASSWORD = os.environ.get("BESZEL_PASSWORD")

_token_cache = {"token": None, "expires_at": 0}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_beszel_token():
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"]:
        return _token_cache["token"]
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{BESZEL_URL}/api/collections/users/auth-with-password",
            json={"identity": BESZEL_EMAIL, "password": BESZEL_PASSWORD},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Beszel auth failed")
        data = resp.json()
        _token_cache["token"] = data["token"]
        _token_cache["expires_at"] = now + 3600
        return data["token"]

async def get_system_id(token):
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{BESZEL_URL}/api/collections/systems/records",
            headers={"Authorization": f"Bearer {token}"},
            params={"perPage": 1},
        )
        if resp.status_code != 200 or not resp.json().get("items"):
            return None
        return resp.json()["items"][0]["id"]

async def fetch_beszel_stats():
    try:
        token = await get_beszel_token()
        system_id = await get_system_id(token)
    except Exception:
        return None

    params = {"sort": "-created", "perPage": 60}
    if system_id:
        params["filter"] = f"(system='{system_id}')"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BESZEL_URL}/api/collections/system_stats/records",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
            )
            if resp.status_code != 200:
                return None
            items = resp.json().get("items", [])
            if not items:
                return None

            latest = items[0]
            fields = ["cpu", "memory", "disk", "networkSent", "networkRecv", "load1", "load5", "load15"]

            def get_field(item, keys):
                for k in keys:
                    v = item.get(k)
                    if v is not None:
                        return v
                return 0

            history = []
            for item in reversed(items):
                cpu = get_field(item, ["cpu"])
                load = get_field(item, ["load1", "load", "loadAvg"])
                history.append({"time": item.get("created", ""), "cpu": cpu, "load": load})

            return {
                "cpu": get_field(latest, ["cpu"]),
                "memory": get_field(latest, ["memory"]),
                "disk": get_field(latest, ["disk"]),
                "network_sent": get_field(latest, ["networkSent", "network_sent"]),
                "network_recv": get_field(latest, ["networkRecv", "network_recv"]),
                "load": get_field(latest, ["load1", "load", "loadAvg"]),
                "load5": get_field(latest, ["load5", "load5"]),
                "load15": get_field(latest, ["load15", "load15"]),
                "history": history,
                "last_updated": latest.get("created"),
            }
    except Exception:
        return None

@app.get("/api/stats")
def get_stats():
    return {
        "cpu": psutil.cpu_percent(interval=1),
        "ram": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage("/").percent,
        "ram_used": round(psutil.virtual_memory().used / 1024**3, 2),
        "ram_total": round(psutil.virtual_memory().total / 1024**3, 2),
        "disk_used": round(psutil.disk_usage("/").used / 1024**3, 2),
        "disk_total": round(psutil.disk_usage("/").total / 1024**3, 2),
    }

@app.get("/api/services")
def get_services():
    if os.path.exists(SERVICES_FILE):
        with open(SERVICES_FILE, "r") as f:
            return json.load(f)
    return []

@app.get("/api/server-stats")
async def get_server_stats():
    stats = await fetch_beszel_stats()
    if stats is None:
        raise HTTPException(status_code=503, detail="Unable to fetch Beszel stats")
    return stats
