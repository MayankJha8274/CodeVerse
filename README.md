# CodeVerse

**Unified Competitive Programming Hub — Track, Compete, Collaborate.**

CodeVerse is a full-stack platform that aggregates coding activity from multiple competitive programming platforms, delivers deep analytics, enables real-time collaboration, and manages contests — all from a single, beautifully crafted dashboard.

---

## Why CodeVerse?

Competitive programmers use multiple platforms — LeetCode, Codeforces, CodeChef, GeeksforGeeks. Stats are scattered, progress is fragmented, and there's no single place to track growth, compare with peers, or collaborate with teams. CodeVerse solves this by acting as a **unified layer** over all your coding platforms.

---

## Capabilities

### Platform Aggregation
Connect your LeetCode, Codeforces, CodeChef, and GeeksforGeeks profiles. CodeVerse automatically syncs your solved counts, ratings, submissions, and achievements into one consolidated profile.

### Analytics & Insights
Track rating history across platforms with interactive charts, visualize problem-solving by DSA topic and difficulty, monitor active streaks, and measure growth over custom time ranges.

### Contest Ecosystem
Browse upcoming and ongoing contests from all major platforms in a unified feed or calendar view. Create and host custom contests for your community with full leaderboard support.

### Community Features
Form study groups with **Rooms**, build college-level communities with **Societies**, participate in events with RSVP tracking, and communicate in real-time via Socket.IO-powered chat.

### Comparison Engine
Compare your profile side-by-side with any other user — see who has solved more problems, has higher ratings, and excels in which topics.

---

## Architecture

The application follows a classic **React SPA + REST API** architecture with real-time WebSocket augmentation.

```
┌──────────────────────────────────────────────────┐
│                     Client                         │
│  React 19 + Vite 7 + Tailwind CSS 4 + Recharts    │
│  Auth via JWT │ Real-time via Socket.IO            │
└────────────────────────┬─────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────▼─────────────────────────┐
│                   Server                           │
│  Express 4 + Mongoose + Passport + Socket.IO      │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ REST API │ │ Auth     │ │ WebSocket Server  │ │
│  │ 20 ctrl  │ │ JWT+OAuth│ │ chat + sync       │ │
│  └────┬─────┘ └────┬─────┘ └───────────────────┘ │
│       └──────┬──────┘                              │
│              ▼                                     │
│  ┌───────────────────┐  ┌──────────────────────┐  │
│  │ Models (22)       │  │ Workers + Cron Jobs  │  │
│  │ Mongoose ODM      │  │ Email Queue, Sync    │  │
│  └────────┬──────────┘  └──────────┬───────────┘  │
└───────────┼────────────────────────┼──────────────┘
            │                        │
┌───────────▼────────────────────────▼──────────────┐
│               External Integrations                 │
│  MongoDB Atlas   Gmail SMTP   LeetCode / CF / CC   │
│  (primary store) (email)      (platform data)      │
└────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Stateless Authentication** — JWT tokens validated on every request. No server-side sessions. Enables horizontal scaling.

**Hybrid Email Queue** — Contest reminders queued in MongoDB by default (Redis optional). Ensures reliable delivery without additional infrastructure.

**Optimized Data Access** — Every read query uses Mongoose's `.lean()` to skip document hydration, reducing response time by 2-5x. Read-only GET endpoints are cached in-memory with configurable TTLs.

**Real-Time by Default** — Socket.IO provides live updates for platform sync progress, chat messages, and notifications without polling.

---

## Technology

### Frontend
- **React 19** with hooks, concurrent features, and function components
- **Vite 7** for instant HMR and optimized production builds
- **Tailwind CSS 4** with custom dark theme and responsive breakpoints
- **React Router 7** for declarative routing with lazy loading
- **Recharts** for interactive rating history and topic analysis charts
- **Framer Motion** for page transitions and micro-interactions
- **Socket.IO Client** for real-time WebSocket communication
- **Lucide React** for consistent iconography throughout the UI

### Backend
- **Node.js + Express 4** — RESTful API with middleware pipeline
- **MongoDB + Mongoose** — Schema-based document storage with indexes
- **Passport.js** — Google and GitHub OAuth 2.0 strategies
- **JSON Web Tokens** — Stateless auth with configurable expiry
- **Socket.IO 4** — Bidirectional event-based communication
- **Puppeteer + Cheerio** — Headless browser and HTML parsing for platform data
- **Nodemailer** — SMTP email delivery for contest reminders
- **Node-Cron** — Lightweight scheduler for sync jobs and periodic tasks
- **Winston** — Structured JSON logging with multiple transports
- **Node-Cache** — In-memory response cache for hot endpoints

---

## Project Structure

```
backend/
├── src/
│   ├── server.js          HTTP server, Socket.IO boot, cron init
│   ├── app.js             Express app, middleware, route mounting
│   ├── config/            Database, Passport, Redis connections
│   ├── controllers/       Request handlers (auth, contests, analytics, etc.)
│   ├── models/            Mongoose schemas (User, Contest, Submission, etc.)
│   ├── routes/            Express routers with auth + cache middleware
│   ├── middleware/        Auth, caching, rate limiting, error handling
│   ├── services/          Business logic, platform scrapers, email, cron
│   ├── workers/           Background job processors (email, sync)
│   ├── queues/            BullMQ + Mongo-backed job queues
│   └── data/              Static reference data (problem banks)
├── .env                   Environment configuration
├── nodemon.json           Dev server watch config
└── package.json

frontend/
├── src/
│   ├── main.jsx           React root, providers, render
│   ├── App.jsx            Router tree with lazy-loaded routes
│   ├── index.css          Tailwind directives, global styles, scrollbars
│   ├── pages/             26 route-level page components
│   ├── components/        Reusable UI (common/, dashboard/, society/)
│   ├── layouts/           DashboardLayout, Navbar, Sidebar
│   ├── context/           AuthContext (JWT), SocketContext (WebSocket)
│   ├── services/api.js    HTTP client with request dedup
│   ├── hooks/             Custom hooks (theme, sync status)
│   ├── data/              Static sheet/problem data
│   └── utils/             Platform config and display helpers
├── .env                   VITE_API_URL
├── vite.config.js         Build configuration
├── tailwind.config.js     Theme tokens and content paths
├── vercel.json            SPA rewrite rules
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (developed on 22)
- MongoDB instance (Atlas recommended)
- Gmail account with App Password (for email features)

### Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
# Edit backend/.env with your MongoDB URI, JWT secret, OAuth keys
# Edit frontend/.env with your API URL (default: http://localhost:5000/api)

# Start development servers
cd backend && npm run dev     # API server on :5000
cd frontend && npm run dev    # Vite dev server on :5173
```

### Environment Variables

**Backend** — Configure via `backend/.env`:
- `PORT` — Server port (default 5000)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Token signing key
- `JWT_EXPIRE` — Token lifetime (e.g. 7d)
- `FRONTEND_URL` — CORS origin for the frontend
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth credentials
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — Email configuration
- `REDIS_ENABLED` — Set to true to use BullMQ with Redis (default: false)

**Frontend** — Configure via `frontend/.env`:
- `VITE_API_URL` — Backend API base URL (e.g. http://localhost:5000/api)

---

## API Overview

All API endpoints are prefixed with `/api`. Authenticated endpoints require an `Authorization: Bearer <token>` header.

| Module | Key Endpoints | Auth | Cache |
|--------|--------------|------|-------|
| **Auth** | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/google`, `/auth/github` | Mixed | No |
| **Contests** | `/contests`, `/contests/calendar`, `/hosted-contests/public` | Mixed | 60s |
| **Dashboard** | `/dashboard/summary`, `/dashboard/combined`, `/dashboard/calendar` | Yes | No |
| **Leaderboard** | `/leaderboard`, `/leaderboard/rank`, `/leaderboard/institution/:inst` | Yes | 120s |
| **Analytics** | `/analytics/global`, `/analytics/rating-history/:platform` | Mixed | 60s |
| **Platforms** | `/platforms/stats`, `/platforms/achievements`, `/platforms/sync` | Yes | No |
| **Societies** | `/societies`, `/societies/:id`, `/societies/:id/join` | Yes | 60s |
| **Comparison** | `/compare/top`, `/compare/:userId` | Mixed | 120s |
| **Problem Sets** | `/problem-set/public` | No | 300s |
| **Notifications** | `/notifications` | Yes | No |

---

## Key Features Walkthrough

### Authentication Flow
Users can register via email/password or authenticate instantly through Google or GitHub OAuth. On success, a JWT token is issued and stored client-side. Every subsequent API request includes this token in the Authorization header. The backend verifies the token, fetches the user, and attaches it to the request context — all without server-side sessions.

### Platform Synchronization
Users link their coding platform usernames in Settings. A background sync process scrapes profile data using platform-specific adapters (Puppeteer for JavaScript-rendered pages, Cheerio for static HTML). Results are stored in MongoDB and the dashboard updates in real-time via Socket.IO.

### Contest Reminders
A cron job runs every minute, checks for upcoming contests, and queues reminder emails. The email queue uses MongoDB as its backend (configurable to Redis via BullMQ). A background worker processes the queue and sends emails via Gmail SMTP.

### Real-Time Collaboration
Socket.IO connections are established post-authentication. Users join platform-specific rooms for sync updates and society/room channels for chat. The server broadcasts sync progress, new messages, and notification events instantly.

---

## Performance

The application has been profiled and optimized across both stack tiers:

- **Database** — 143 Mongoose queries use `.lean()` for lean result objects. Compound indexes cover the most frequent query patterns (contest listings, leaderboards, user lookups).
- **Caching** — 18 GET endpoints are cached in-memory with endpoint-specific TTLs (60s for contests, 120s for leaderboards, 300s for reference data).
- **Frontend** — Context values are memoized to prevent cascading re-renders. Heavy components (Navbar, Sidebar, Dashboard sections) are wrapped in `React.memo`. A 178KB static data file is lazy-loaded via dynamic import, keeping the initial bundle lean.
- **Network** — Identical concurrent GET requests are deduplicated with automatic AbortController cleanup. All responses are gzip-compressed.
- **Auth** — JWT verification is O(1) with no session store lookups.

---

*Built with React 19, Express 4, MongoDB Atlas, and a deep appreciation for competitive programming.*
