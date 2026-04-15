# LogForge — Frontend

React 19 web dashboard for LogForge, the self-hosted real-time log management platform. Version **0.2.0**.

## Tech Stack

- **React 19** — UI framework
- **React Router v7** — Client-side routing (BrowserRouter in browser, HashRouter in Electron)
- **Tailwind CSS** — Styling
- **Radix UI / Shadcn** — Accessible component primitives
- **Recharts** — Data visualisations
- **Framer Motion** — Animations
- **Lucide Icons** — Icon set
- **Axios** — HTTP client with dynamic backend URL resolution

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

> **Note:** When running inside the Electron desktop app, the backend URL is read from `localStorage` at runtime (set via the backend configurator on the login screen). The env variable is the fallback for web deployments.

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

> The `homepage: "./"` setting in `package.json` makes all asset paths relative — required for Electron to load the app from `file://` protocol.

## Desktop App (Electron)

The frontend is designed to run both in a browser and inside the **logforge-desktop** Electron wrapper.

When running inside Electron:
- `window.electronAPI.isElectron` is `true` (exposed via preload script)
- The app uses `HashRouter` instead of `BrowserRouter` (required for `file://` navigation)
- A server icon button appears on the login screen to configure the backend URL at runtime
- The backend URL is persisted in `localStorage` and survives restarts

To build the desktop app, see the [logforge-desktop README](../logforge-desktop/README.md). The two repos must be **sibling directories** — the desktop build embeds `../logforge-frontend/build` at build time.

## Features

- Log Explorer with full-text search, level/channel/project/env filters
- Real-time dashboard with WebSocket streaming (project-scoped)
- Session Replay viewer (RRWeb)
- Docker Log Explorer with container-level filtering
- SDK Documentation page (dynamic code snippets pre-filled with your API key)
- Settings, alert rules, SMTP configuration
- User management, RBAC, invitation system
- Dark / Light mode with custom primary color
- Collapsible sidebar, i18n (EN / FR)
- Material Design mode

## Project Structure

```
src/
├── components/
│   ├── layout/        # Sidebar, AppLayout, ChangelogModal, BackendConfig
│   └── ui/            # Shadcn component library
├── pages/             # One file per route
├── lib/
│   ├── api.js         # Axios client — dynamic backend URL + JWT interceptors
│   ├── AuthContext.js
│   └── LanguageContext.js
└── hooks/
```

## License

MIT — see [LICENCE](LICENCE)
