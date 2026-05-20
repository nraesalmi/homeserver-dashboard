from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psutil

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
    return [
        {
            "name": "Docmost",
            "url": "https://docs.nfrastructure.xyz",
            "icon": "📚",
            "description": "Documentation Wiki",
            "locked": True
        },
        {
            "name": "Firefly III",
            "url": "https://firefly.nfrastructure.xyz",
            "icon": "💰",
            "description": "Personal Finance",
            "locked": True
        }
    ]
