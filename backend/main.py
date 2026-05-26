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

BESZEL_URL = os.environ.get("BESZEL_URL")
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
    except Exception as e:
        print(f"Auth/system error: {e}")
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
            s = latest.get("stats", {})
            la = s.get("la", [0, 0, 0])
            b = s.get("b", [0, 0])

            history = []
            for item in reversed(items):
                item_stats = item.get("stats", {})
                ila = item_stats.get("la", [0])
                history.append({
                    "time": item.get("created", ""),
                    "cpu": item_stats.get("cpu", 0),
                    "load": ila[0] if ila else 0,
                })

            return {
                "cpu": s.get("cpu", 0),
                "memory": s.get("mp", 0),
                "memory_used": s.get("mu", 0),
                "disk": s.get("dp", 0),
                "disk_used": s.get("du", 0),
                "network_sent": b[0] if len(b) > 0 else 0,
                "network_recv": b[1] if len(b) > 1 else 0,
                "load": la[0] if len(la) > 0 else 0,
                "load5": la[1] if len(la) > 1 else 0,
                "load15": la[2] if len(la) > 2 else 0,
                "history": history,
                "last_updated": latest.get("created"),
            }
    except Exception as e:
        print(f"Stats fetch error: {e}")
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