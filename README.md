# CodeVerse

A comprehensive coding platform analytics dashboard that aggregates and visualizes your coding stats from multiple platforms.

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev   # Development with nodemon (auto-restart)
# OR
npm start     # Production mode
```

**Note**: Backend now automatically frees port 5000 if it's in use!

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- **Multi-platform integration**: LeetCode, GitHub, Codeforces, CodeChef, GeeksforGeeks, HackerRank, CodingNinjas
- **Accurate GitHub stats**: Fetches all-time contributions using GraphQL (requires token)
- **Real-time stats aggregation**
- **User authentication** with JWT
- **OAuth support** (Google & GitHub)
- **Progress tracking and analytics**

## Environment Setup

Create `.env` file in backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GITHUB_TOKEN=your_github_personal_access_token  # REQUIRED for accurate GitHub stats
```

**Important**: Add your GitHub Personal Access Token to get accurate all-time GitHub statistics. Without it, only current year data will be available.

## Recent Fixes (Feb 2026)

✅ **GitHub Service Completely Rewritten**
- Now fetches **accurate all-time contributions** using GraphQL API
- Queries contributions for each year since account creation
- Correctly counts commits, PRs, and issues across all years
- Calculates contribution streaks accurately
- Provides detailed logging of what data is being fetched

✅ **Auto Port Cleanup**
- Backend automatically detects and frees port 5000 if occupied
- No more manual `taskkill` commands needed
- Smart retry logic if port is still busy

✅ **Project Cleanup**
- Removed all unnecessary test files and documentation
- Clean, production-ready structure
