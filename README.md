# nhub homeserver dashboard

A self-hosted dashboard for your home server — monitors system stats, provides quick access to your services, and includes a streaming service launcher page.

<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/03045edf-da11-4f5d-98e9-e4917ee15d0d" />

## Features

- **System Stats** — real-time CPU, RAM, and disk usage gauges
- **Service Directory** — categorized links to all your self-hosted services (public and protected)
- **Responsive Design** — works on desktop and mobile
- **Dark/Light Mode** — toggleable theme
- **Streaming Launcher** — separate page with quick links to your streaming platforms
- **Dockerized** — runs with `docker compose`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 4, lucide-react |
| Backend | FastAPI, psutil |
| Infrastructure | Docker, Docker Compose, Nginx |

## Getting Started

### Prerequisites

- Docker and Docker Compose
- A server with a reverse proxy (e.g., Cloudflare Tunnel, Nginx Proxy Manager)

### Quick Start

```bash
git clone https://github.com/nraesalmi/homeserver-dashboard
cd homeserver-dashboard
```

#### 1. Configure your services

Copy the example services file and edit it with your own services:

```bash
cp backend/services.example.json backend/services.json
```

Edit `backend/services.json` with your service name, URL, emoji icon, description, and whether it's locked (requires auth):

```json
[
  {
    "name": "My App",
    "url": "https://app.example.com",
    "icon": "🚀",
    "description": "What it does",
    "locked": true
  }
]
```

#### 2. Start the stack

```bash
docker compose up -d --build
```

- Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8001`

#### 3. (Optional) Setup streaming page

Open `streaming/streaming.html` in a browser, or host it alongside the dashboard.

## Project Structure

```
homeserver-dashboard/
├── frontend/              # React dashboard
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ResourceGauge.jsx
│   │   │   ├── ServiceCard.jsx
│   │   │   └── SocialButton.jsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx        # Main app
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets (logo, favicon)
│   └── Dockerfile
├── backend/               # FastAPI backend
│   ├── main.py            # API endpoints
│   ├── requirements.txt
│   ├── services.example.json  # Template for service config
│   └── Dockerfile
├── streaming/             # Streaming service launcher page
│   ├── streaming.html
│   └── logos/             # Streaming platform logo images
├── docker-compose.yml
└── .gitignore
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Returns CPU %, RAM usage, disk usage |
| `GET /api/services` | Returns service list from `services.json` |

## Customization

### Adding a service

Edit `backend/services.json` and add an entry:

```json
{
  "name": "My Service",
  "url": "https://service.example.com",
  "icon": "🔧",
  "description": "Short description",
  "locked": false
}
```

- `locked: true` — appears under "Protected Services" (assumes auth required)
- `locked: false` — appears under "Services" (public)

### Changing the greeting

Edit the `greetings` array in `frontend/src/App.jsx` — the app picks one randomly on each page load.

### Adding social links

Update the top bar in `frontend/src/App.jsx` — replace the `href` props on `SocialButton` components.

## License

Apache License 2.0
