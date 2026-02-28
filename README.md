# CodeVerse

**A full-stack coding analytics platform that aggregates your stats from 7+ platforms into one unified dashboard — track progress, compete in leaderboards, join societies, solve daily challenges, and more.**

---

## Features

### Profile Tracker
- **Unified Dashboard** — View combined stats from all linked platforms: total problems solved, ratings, contributions, streaks, and a GitHub-style contribution heatmap
- **Platform Integration** — Link and sync data from **LeetCode**, **Codeforces**, **CodeChef**, **GitHub**, **GeeksforGeeks**, **HackerRank**, and **Coding Ninjas**
- **Platform Detail Pages** — Deep-dive into per-platform stats, rating history, and submission trends
- **Coding Score** — Comprehensive score calculated from problems solved, platform ratings, GitHub activity, and consistency

### Community
- **Global Leaderboard** — Rank against all users by Coding Score, Total Questions, per-platform ratings, or GitHub contributions. Filterable by individual platforms
- **Societies** — Create or join coding societies (communities) with their own leaderboard, announcements, events, chat channels, member management, and admin dashboard
- **Rooms** — Private coding rooms with invite codes, leaderboards, and analytics for small groups

### Question Tracker
- **DSA Sheets** — Track progress through curated DSA problem sheets (Striver's SDE Sheet, Love Babbar 450, NeetCode 150, etc.) with status tracking, notes, and revision flags
- **Daily Challenge** — Personalized daily DSA problems with streak tracking
- **Problem Set** — Browse and manage a bank of coding problems

### Event Tracker
- **Contest Calendar** — Aggregated upcoming contest data from Codeforces, CodeChef, LeetCode, and others
- **Host Contest** — Create and manage custom coding contests with problem creation, code execution, submissions, leaderboard, and multiple scoring formats (IOI, ICPC)

### Other
- **User Comparison** — Head-to-head comparison of two users across all platforms
- **Dark / Light Mode** — Full theme support throughout the app
- **Real-time Chat** — Socket.io powered messaging in societies and rooms
- **Responsive Design** — Works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router 7, Tailwind CSS 4, Recharts, Lucide Icons, Socket.io Client |
| **Backend** | Node.js, Express 4, Mongoose 9 (MongoDB), JWT Auth, Socket.io, Node-Cron |
| **Database** | MongoDB (Atlas or local) |
| **Platform APIs** | Cheerio (scraping), Axios, GitHub REST API, Codeforces API, LeetCode GraphQL |

---

## Project Structure

```
CODEVERSE-PROJECT/
├── backend/
│   ├── src/
│   │   ├── server.js                 # Entry point (Express + Socket.io)
│   │   ├── app.js                    # Express app configuration & route mounting
│   │   ├── config/
│   │   │   ├── database.js           # MongoDB connection
│   │   │   └── passport.js           # OAuth strategies
│   │   ├── controllers/              # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── leaderboardController.js
│   │   │   ├── societyController.js
│   │   │   ├── roomController.js
│   │   │   ├── contestController.js
│   │   │   ├── hostedContestController.js
│   │   │   ├── dailyChallengeController.js
│   │   │   └── ...
│   │   ├── models/                   # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── PlatformStats.js
│   │   │   ├── Society.js
│   │   │   ├── Room.js
│   │   │   ├── HostedContest.js
│   │   │   └── ...
│   │   ├── routes/                   # Express route definitions
│   │   ├── services/
│   │   │   ├── platforms/            # Per-platform data fetchers
│   │   │   │   ├── leetcodeService.js
│   │   │   │   ├── codeforcesService.js
│   │   │   │   ├── githubService.js
│   │   │   │   ├── codechefService.js
│   │   │   │   ├── geeksforgeeksService.js
│   │   │   │   ├── hackerrankService.js
│   │   │   │   └── codingNinjasService.js
│   │   │   ├── aggregationService.js
│   │   │   ├── codeExecutionService.js
│   │   │   ├── cronService.js
│   │   │   └── socketHandler.js
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication
│   │   │   ├── societyAuth.js        # Society role-based access
│   │   │   └── errorHandler.js
│   │   └── utils/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                  # Entry point (theme init + React root)
│   │   ├── App.jsx                   # Router & route definitions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Main analytics dashboard
│   │   │   ├── LeaderboardPage.jsx   # Global leaderboard
│   │   │   ├── SocietiesPage.jsx     # Society explore & list
│   │   │   ├── SocietyDetailPage.jsx # Society detail (tabs)
│   │   │   ├── RoomsPage.jsx         # Rooms management
│   │   │   ├── SheetsPage.jsx        # DSA sheet tracker
│   │   │   ├── DailyChallengePage.jsx
│   │   │   ├── ComparisonPage.jsx    # User vs user comparison
│   │   │   ├── ContestsPage.jsx      # Contest calendar
│   │   │   ├── ContestEditPage.jsx   # Host contest editor
│   │   │   ├── SettingsPage.jsx      # Profile & platform settings
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── ContributionCalendar.jsx
│   │   │   ├── PlatformCard.jsx
│   │   │   ├── society/             # Society sub-components
│   │   │   └── ...
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx  # Sidebar + Navbar + Outlet
│   │   │   ├── Sidebar.jsx
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── services/
│   │   │   └── api.js               # All API calls (authFetch wrapper)
│   │   ├── hooks/
│   │   │   └── useCustomHooks.js    # useTheme, useDebounce, etc.
│   │   └── utils/
│   │       └── platformConfig.js    # Platform icons, colors, names
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster

### 1. Clone the repository

```bash
git clone https://github.com/your-username/codeverse.git
cd codeverse/CODEVERSE-PROJECT
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/codeverse   # or your Atlas URI
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
GITHUB_TOKEN=your_github_personal_access_token    # recommended for GitHub stats
```

Start the backend:

```bash
npm run dev    # development with hot reload (nodemon)
npm start      # production
```

The API server runs at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## API Overview

All API routes are prefixed with `/api`. Authentication is via JWT Bearer token.

| Route Prefix | Description |
|-------------|-------------|
| `/api/auth` | Register, login, OAuth, profile |
| `/api/dashboard` | Dashboard analytics data |
| `/api/platforms` | Link/unlink/sync platforms |
| `/api/leaderboard` | Global leaderboard & rankings |
| `/api/compare` | User comparison & search |
| `/api/societies` | Society CRUD, members, chat, events, announcements, leaderboard |
| `/api/rooms` | Room CRUD, members, leaderboard, analytics |
| `/api/sheets` | DSA sheet progress tracking |
| `/api/daily-challenge` | Daily challenge & streaks |
| `/api/contests` | External contest aggregation |
| `/api/hosted-contests` | Custom contest hosting & submissions |
| `/api/problem-set` | Problem bank management |
| `/api/analytics` | Advanced analytics & streaks |

---

## Coding Score Formula

The Coding Score (max ~1000 points) is calculated from:

| Component | Max Points | Calculation |
|-----------|-----------|-------------|
| Problems Solved | 400 | 0.5 pts per problem, capped at 400 |
| Platform Ratings | 300 | LeetCode (rating/30, max 100) + Codeforces (rating/20, max 100) + CodeChef (rating/20, max 100) |
| GitHub Activity | 150 | 0.1 pts per contribution, capped at 150 |
| Consistency | 150 | Streak (2 pts/day, max 100) + Contests participated (5 pts each, max 50) |

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `GITHUB_TOKEN` | Recommended | GitHub personal access token for contribution data |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |

---

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## License

ISC
