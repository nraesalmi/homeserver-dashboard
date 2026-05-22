from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import psutil

BASE_DIR = os.path.dirname(__file__)
SERVICES_FILE = os.path.join(BASE_DIR, "services.json")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
