# Frontend Deployment — LogForge

This guide covers deploying the LogForge frontend (`logforge-frontend`) to a production server.

## Prerequisites

- Node.js 18+ and Yarn
- A web server (Nginx recommended)
- A running LogForge backend accessible from the server

---

## 1. Environment Configuration

Create the production `.env` file before building:

```env
REACT_APP_BACKEND_URL=https://api.your-domain.com
REACT_APP_WS_URL=wss://api.your-domain.com/api/ws/logs
```

---

## 2. Build

```bash
yarn install
yarn build
```

Static files are output to `build/`.

---

## 3. Serving with Nginx

Copy the `build/` folder to your server and configure Nginx to serve it.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/logforge-frontend/build;
    index index.html;

    # React SPA — all routes fall back to index.html
    location / {
        try_files $uri /index.html;
    }

    # Proxy API requests to the backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket — real-time log streaming
    location /api/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update the Nginx config to redirect HTTP → HTTPS and manage certificate renewal.

---

## 5. Deploying with Docker

A `Dockerfile` is included at the root of `logforge-frontend/`.

```bash
docker build -t logforge-frontend .
docker run -d \
  -p 3000:80 \
  -e REACT_APP_BACKEND_URL=https://api.your-domain.com \
  -e REACT_APP_WS_URL=wss://api.your-domain.com/api/ws/logs \
  logforge-frontend
```

The container serves the production build via `serve` on port 80.

---

## 6. Static Hosting (Alternative)

The `build/` output is plain HTML/CSS/JS. You can deploy it to:

- **Vercel** — `vercel --prod`
- **Netlify** — drag-and-drop the `build/` folder in the dashboard
- **Cloudflare Pages** — connect the repo and set build command to `yarn build`, output dir to `build`

> Make sure the backend CORS_ORIGINS allows the hosting domain.
