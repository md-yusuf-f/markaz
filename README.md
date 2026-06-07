# Markaz — Self-Hosted Ops Dashboard

A real-time operations dashboard for self-hosted infrastructure.
Built with React + Vite, served by Nginx, designed for Docker-based homelabs.

![Markaz Dashboard](https://raw.githubusercontent.com/md-yusuf-f/markaz/main/screenshot.png)

## Features

- **System Stats** — CPU, RAM, disk usage, load average, uptime (via Prometheus)
- **Real Process List** — top processes by CPU/MEM (via Glances API)
- **Container Grid** — all Docker containers with status, filter, click for details, restart action
- **Service Tiles** — quick-launch tiles with live Uptime Kuma status dots
- **Node Bar** — multi-node health strip with per-node metrics
- **Network Graph** — live RX/TX bandwidth (via Prometheus node-exporter)
- **Traefik Routes** — active routers with TLS and provider badges
- **Infra Status** — active alerts and container restart tracking
- **Filesystem** — disk usage per mount point with used/free/total

## Requirements

- Docker + Docker Compose
- Prometheus with node-exporter and cAdvisor
- Uptime Kuma
- Docker socket-proxy (tecnativa/docker-socket-proxy)
- Glances (running in web server mode)
- Alertmanager
- Traefik (optional, for routing)

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/md-yusuf-f/markaz.git
cd markaz
```

### 2. Configure

Edit these files to match your infrastructure:

**`markaz-ui/src/components/ServiceTiles.jsx`** — set your service URLs and Kuma monitor names  
**`markaz-ui/src/components/NodeBar.jsx`** — set your node labels, roles, and Kuma monitor names  
**`nginx.conf`** — set the upstream service names to match your Docker service names  

Both `ServiceTiles.jsx` and `NodeBar.jsx` contain a `KUMA_SLUG` constant at the top — set it to your Uptime Kuma status page slug.

### 3. Copy and edit environment file

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 4. Build and run

```bash
# Copy nginx.conf to build context (required before every build)
cp nginx.conf markaz-ui/nginx.conf 2>/dev/null || true

docker compose up --build -d
```

### 5. Access

```
http://localhost:3000
```

Or configure Traefik labels in `docker-compose.yml` to serve via your domain.

## Architecture

```
Browser → Nginx (port 3000)
              ├── /api/prometheus/  → Prometheus
              ├── /api/kuma/        → Uptime Kuma
              ├── /api/docker/      → Docker socket-proxy
              ├── /api/alerts/      → Alertmanager
              ├── /api/traefik/     → Traefik API
              └── /api/glances/     → Glances
```

## Stack

- React 18 + Vite
- Recharts (network graph)
- Lucide React (icons)
- Nginx (static serving + API proxy)
- Docker multi-stage build (node:20-alpine → nginx:alpine)
- ARM64 compatible

## Configuration

All user-facing configuration lives in two component files:

| File | What to change |
|------|----------------|
| `markaz-ui/src/components/ServiceTiles.jsx` | Service names, URLs, Kuma monitor names, `KUMA_SLUG` |
| `markaz-ui/src/components/NodeBar.jsx` | Node labels, roles, Kuma monitor names, `KUMA_SLUG` |

## Credits

Inspired by [eDEX-UI](https://github.com/GitSquared/edex-ui).

## License

MIT
