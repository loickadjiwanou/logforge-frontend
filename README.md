# LogForge — Frontend

React 19 web dashboard for LogForge, the self-hosted real-time log management platform.

## Tech Stack

- **React 19** — UI framework
- **Tailwind CSS** — Styling
- **Radix UI / Shadcn** — Accessible component primitives
- **Recharts** — Data visualisations
- **Lucide Icons** — Icon set

## Prerequisites

- Node.js 18+
- Yarn
- A running LogForge backend

## Installation

```bash
yarn install
```

## Configuration

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Backend API base URL | `http://localhost:8000` |
| `REACT_APP_WS_URL` | WebSocket URL for real-time logs | `ws://localhost:8000/api/ws/logs` |

## Development

```bash
yarn start
```

The app runs at `http://localhost:3000`.

## Production Build

```bash
yarn build
```

Static files are output to `build/`. Serve them behind Nginx or any static file server (see [deployment.md](deployment.md)).

## Features

For the full feature list of the LogForge platform, see the [logforge-backend README](https://github.com/loickadjiwanou/logforge-backend#features).

This repository contains the React interface for all those features, including:
- Log Explorer, real-time dashboard, session replay viewer
- SDK Documentation page (dynamic code snippets pre-filled with your API key)
- Docker Log Explorer
- Settings, alerting rules, user management, and RBAC panels
- Dark / Light mode, collapsible sidebar, i18n (EN / FR)

## Project Structure

```
src/
├── components/
│   ├── layout/        # Sidebar, AppLayout, modals
│   └── ui/            # Shadcn component library
├── pages/             # One file per route
├── lib/
│   ├── api.js         # Axios client with JWT interceptors
│   ├── AuthContext.js
│   └── LanguageContext.js
└── hooks/
```

## License

MIT — see [LICENCE](LICENCE)
