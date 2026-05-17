# Docker

## Local run

Create a root `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Build and start:

```bash
docker compose up --build
```

Open:

```text
http://localhost:8080
```

Backend docs:

```text
http://localhost:8000/docs
```

## Google Cloud notes

For a VM-based deployment, install Docker and Docker Compose, copy the project, create `.env`, then run:

```bash
docker compose up -d --build
```

Expose TCP port `8080` in the VM firewall. The frontend container proxies `/api/*` to the backend container.

For separate Cloud Run services, deploy `backend` first, then build the frontend with:

```bash
docker build --build-arg VITE_API_URL=https://YOUR_BACKEND_URL -t frontend ./frontend
```

In that mode, also restrict `allow_origins` in `backend/main.py` to the frontend service URL.
