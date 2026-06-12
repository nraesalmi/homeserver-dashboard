from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import time
from datetime import datetime, timezone
import httpx
import psutil
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
SERVICES_FILE = os.path.join(BASE_DIR, "services.json")
load_dotenv(os.path.join(BASE_DIR, ".env"))

BESZEL_URL = os.environ.get("BESZEL_URL")
BESZEL_EMAIL = os.environ.get("BESZEL_EMAIL")
BESZEL_PASSWORD = os.environ.get("BESZEL_PASSWORD")
UPTIME_KUMA_URL = os.environ.get("UPTIME_KUMA_URL", "http://uptime-kuma:3001")
PIHOLE_URL = os.environ.get("PIHOLE_URL", "http://pihole:80")
PIHOLE_API_KEY = os.environ.get("PIHOLE_API_KEY")

_token_cache = {"token": None, "expires_at": 0}
_uptime_kuma_cache = {"data": None, "expires_at": 0}
_pihole_cache = {"data": None, "expires_at": 0}

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
                ib = item_stats.get("b", [0, 0])
                history.append({
                    "time": item.get("created", ""),
                    "cpu": item_stats.get("cpu", 0),
                    "load": ila[0] if ila else 0,
                    "network_sent": ib[0] if len(ib) > 0 else 0,
                    "network_recv": ib[1] if len(ib) > 1 else 0,
                })

            n = len(items)
            if n >= 2:
                try:
                    t0 = datetime.fromisoformat(items[0]["created"].replace("Z", "+00:00"))
                    t1 = datetime.fromisoformat(items[-1]["created"].replace("Z", "+00:00"))
                    span_min = (t0 - t1).total_seconds() / 60
                    expected = max(n, round(span_min))
                    uptime_pct = round(n / expected * 100, 1) if expected > 0 else 100.0
                except Exception:
                    uptime_pct = 100.0
            else:
                uptime_pct = 100.0 if n == 1 else 0.0

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
                "uptime_pct": uptime_pct,
                "history": history,
                "last_updated": latest.get("created"),
            }
    except Exception as e:
        print(f"Stats fetch error: {e}")
        return None

async def fetch_uptime_kuma_data():
    now = time.time()
    if _uptime_kuma_cache["data"] and now < _uptime_kuma_cache["expires_at"]:
        return _uptime_kuma_cache["data"]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Get ID -> name mapping from status page
            sp = await client.get(f"{UPTIME_KUMA_URL}/api/status-page/local-services")
            hb = await client.get(f"{UPTIME_KUMA_URL}/api/status-page/heartbeat/local-services")

            if sp.status_code != 200 or hb.status_code != 200:
                return None

            sp_data = sp.json()
            hb_data = hb.json()

        # Build ID -> name map from publicGroupList
        id_to_name = {}
        for group in sp_data.get("publicGroupList", []):
            for monitor in group.get("monitorList", []):
                mid = str(monitor["id"])
                name = monitor["name"].strip()
                if monitor.get("type") != "group":
                    id_to_name[mid] = name

        heartbeat_list = hb_data.get("heartbeatList", {})
        uptime_list = hb_data.get("uptimeList", {})
        cutoff = now - 86400

        result = {}
        for mid, name in id_to_name.items():
            heartbeats = heartbeat_list.get(mid, [])
            uptime_raw = uptime_list.get(mid)

            # Current status from latest heartbeat
            up = heartbeats[-1].get("status") == 1 if heartbeats else False

            # 24h uptime from uptimeList (already calculated by Uptime Kuma)
            if uptime_raw is not None:
                uptime_24h = round(float(uptime_raw) * 100, 1)
            else:
                uptime_24h = 100.0

            result[name] = {"up": up, "uptime_24h": uptime_24h}

        _uptime_kuma_cache["data"] = result
        _uptime_kuma_cache["expires_at"] = now + 30
        return result

    except Exception as e:
        print(f"Uptime Kuma fetch error: {e}")
        return None


def match_service_status(monitors, services):
    result = []
    for svc in services:
        svc_name = svc.get("name", "").strip().lower()
        matched = None
        for mon_name, mon_data in monitors.items():
            if mon_name.lower() == svc_name:
                matched = mon_data
                break
        if matched:
            status = "up" if matched["up"] else "down"
        else:
            status = "unknown"
        result.append({**svc, "status": status})
    return result


@app.get("/api/uptime")
async def get_uptime():
    data = await fetch_uptime_kuma_data()
    if data is None:
        return {}
    return data


@app.get("/api/service-status")
async def get_service_status():
    services = []
    if os.path.exists(SERVICES_FILE):
        with open(SERVICES_FILE, "r") as f:
            services = json.load(f)

    monitors = await fetch_uptime_kuma_data()
    if monitors is None:
        monitors = {}

    return match_service_status(monitors, services)


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

async def get_pi_hole_sid():
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{PIHOLE_URL}/api/auth",
            json={"password": PIHOLE_API_KEY}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Pi-hole auth failed")
        return resp.json()["session"]["sid"]

@app.get("/api/pi-hole")
async def get_pi_hole_stats():
    now = time.time()
    if _pihole_cache["data"] and now < _pihole_cache["expires_at"]:
        return _pihole_cache["data"]
    try:
        sid = await get_pi_hole_sid()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{PIHOLE_URL}/api/stats/summary",
                headers={"sid": sid}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Pi-hole API error")
            d = resp.json()
            result = {
                "queries_total": d.get("queries", {}).get("total", 0),
                "queries_blocked": d.get("queries", {}).get("blocked", 0),
                "blocked_pct": round(float(d.get("queries", {}).get("percent_blocked", 0)), 1),
                "domains_blocked": d.get("gravity", {}).get("domains_being_blocked", 0),
            }
            _pihole_cache["data"] = result
            _pihole_cache["expires_at"] = now + 30
            return result
    except Exception as e:
        print(f"Pi-hole fetch error: {e}")
        raise HTTPException(status_code=503, detail="Unable to fetch Pi-hole stats")

@app.get("/api/server-stats")
async def get_server_stats():
    stats = await fetch_beszel_stats()
    if stats is None:
        raise HTTPException(status_code=503, detail="Unable to fetch Beszel stats")
    return stats