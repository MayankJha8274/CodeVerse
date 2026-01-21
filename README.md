# CodeVerse - Competitive Programming Analytics Platform

A comprehensive platform for tracking coding progress across multiple platforms (LeetCode, GitHub, Codeforces, CodeChef, etc.) with room/society features for collaborative tracking.

## Project Structure

\\\
CodeVerse-Project/
 backend/          # Node.js/Express API (Phase 1 & 2 Complete)
    src/
       controllers/
       models/
       routes/
       services/
       middleware/
    package.json

 frontend/         # React/Vite UI
     src/
        components/
        pages/
        layouts/
        services/
     package.json
\\\

## Setup

### Backend
\\\ash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
\\\

Backend runs on: http://localhost:5000

### Frontend
\\\ash
cd frontend
npm install
npm run dev
\\\

Frontend runs on: http://localhost:5173

## Features

### Backend (Phase 1 & 2 Complete)
-  User authentication (JWT)
-  Platform integrations (7 platforms)
-  Data aggregation from all platforms
-  Progress tracking (daily/weekly/monthly)
-  Auto-sync with cron jobs

### Frontend
-  Landing page
-  Authentication pages
-  Dashboard with stats
-  Room/Society management
-  Comparison views

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Axios (API calls)
- Cheerio (Web scraping)

**Frontend:**
- React 19
- Vite 7
- Tailwind CSS 4
- React Router
- Recharts

## Contributors

- Backend Developer: Mayank Jha
- Frontend Developer: Arnab Maity
