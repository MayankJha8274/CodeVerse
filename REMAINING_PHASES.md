# 🗺️ CodeVerse - Remaining Phases Overview

## ✅ Completed Phases (1-3)
- ✅ **Phase 1:** Project Setup (MERN stack, models, auth)
- ✅ **Phase 2:** Platform Connectors (7 platforms integrated)
- ✅ **Phase 3:** Room/Society APIs (11 endpoints, leaderboard, analytics)

---

## 🚀 PHASE 4: Aggregation & Analytics Engine

**Goal:** Automate daily data sync and generate intelligent insights

### Tasks to Complete:

#### 1. **Enhance Aggregation Service** (`backend/src/services/aggregationService.js`)
```javascript
// Already exists, add these functions:

calculateUserStats(userId) {
  // ✅ Already implemented
  // Total problems, commits, ratings
}

calculateStreaks(userId) {
  // NEW: Track consecutive active days
  // Return current streak, longest streak
}

calculateLanguageBreakdown(userId) {
  // NEW: From GitHub repos
  // Return: { JavaScript: 45%, Python: 30%, Java: 25% }
}

calculateWeeklyProgress(userId) {
  // NEW: Compare this week vs last week
  // Return: { improvement: 15%, trend: 'up' }
}
```

#### 2. **Create CP Rating Service** (`backend/src/services/cpRatingService.js` - NEW)
```javascript
trackRatingHistory(userId, platform) {
  // Store rating snapshots over time
  // Return graph data for charts
}

detectRatingChange(userId) {
  // Check if rating increased/decreased
  // Return: { platform, oldRating, newRating, change }
}

predictNextRating(userId, platform) {
  // ML-based prediction (optional)
  // Simple: linear trend analysis
}

analyzeContestPerformance(userId) {
  // Contest frequency, average rank
  // Best/worst performances
}
```

#### 3. **Create Insights Service** (`backend/src/services/insightsService.js` - NEW)
```javascript
identifyWeakAreas(userId) {
  // Find platforms with low activity
  // Return: ['hackerrank', 'codingninjas']
}

suggestDailyGoals(userId) {
  // Based on history and peer comparison
  // Return: { problemsToSolve: 3, commitsToday: 2 }
}

findSimilarUsers(userId) {
  // Users with similar stats/interests
  // For comparison and motivation
}

detectAchievements(userId) {
  // Milestones: 100 problems, 500 commits
  // Return badges/notifications
}
```

#### 4. **Enhance Cron Service** (`backend/src/services/cronService.js`)
```javascript
// Already has basic structure, enhance:

// Daily sync at 2 AM
cron.schedule('0 2 * * *', async () => {
  const users = await User.find({ isActive: true });
  for (const user of users) {
    await syncAllUserPlatforms(user._id);
    await generateDailySummary(user._id);
  }
});

// Weekly report on Sundays at 4 AM
cron.schedule('0 4 * * SUN', async () => {
  const users = await User.find({ isActive: true });
  for (const user of users) {
    await generateWeeklyReport(user._id);
  }
});

// Monthly summary on 1st of month
cron.schedule('0 5 1 * *', async () => {
  await generateMonthlyReports();
});
```

### Deliverables:
- ✅ Enhanced `aggregationService.js`
- ✅ New `cpRatingService.js`
- ✅ New `insightsService.js`
- ✅ Enhanced `cronService.js` with 3 scheduled jobs
- ✅ Test cron jobs manually

**Estimated Time:** 3-4 days

---

## 📊 PHASE 5: Dashboard & Comparison APIs

**Goal:** Complete REST APIs for all frontend pages

### Tasks to Complete:

#### 1. **Create Dashboard Controller** (`backend/src/controllers/dashboardController.js` - NEW)
```javascript
getUserProfile(req, res) {
  // GET /api/dashboard/profile/:userId
  // Return full user profile with all stats
}

getUserSummary(req, res) {
  // GET /api/dashboard/summary
  // Current user's aggregated stats
}

getUserTimeline(req, res) {
  // GET /api/dashboard/timeline?days=30
  // Activity graph data (last N days)
}

getUserRooms(req, res) {
  // GET /api/dashboard/rooms
  // All rooms user belongs to
}
```

#### 2. **Create Comparison Controller** (`backend/src/controllers/comparisonController.js` - NEW)
```javascript
compareUsers(req, res) {
  // GET /api/compare/users?u1=id1&u2=id2
  // Side-by-side comparison
}

compareWithRoom(req, res) {
  // GET /api/compare/room/:roomId
  // Current user vs room average
}

getTopPerformers(req, res) {
  // GET /api/compare/top?limit=10
  // Global or room-specific top performers
}
```

#### 3. **Extend Platform Controller** (`backend/src/controllers/platformController.js`)
```javascript
// Already has syncAllPlatforms, add:

getPlatformStats(req, res) {
  // GET /api/platforms/:platform/stats
  // Detailed stats for single platform
}

getAllPlatformStats(req, res) {
  // GET /api/platforms/stats
  // Overview of all connected platforms
}
```

#### 4. **Create Routes**
- `backend/src/routes/dashboardRoutes.js` (NEW)
- `backend/src/routes/comparisonRoutes.js` (NEW)
- Update `backend/src/routes/platformRoutes.js`

#### 5. **Register Routes in App**
```javascript
// In backend/src/app.js
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/compare', require('./routes/comparisonRoutes'));
```

### Deliverables:
- ✅ `dashboardController.js` (4 functions)
- ✅ `comparisonController.js` (3 functions)
- ✅ Enhanced `platformController.js`
- ✅ All routes registered
- ✅ Postman collection updated

**Estimated Time:** 2-3 days

---

## 🎨 PHASE 6: Frontend-Backend Integration

**Goal:** Connect React to real APIs, remove all mock data

### Tasks to Complete:

#### 1. **Create API Service** (`frontend/src/services/api.js`)
```javascript
// Already exists, enhance with all methods:

// Auth
export const login = async (credentials) => {...}
export const register = async (data) => {...}
export const logout = async () => {...}

// Platforms
export const linkPlatform = async (platform, username) => {...}
export const syncPlatforms = async () => {...}
export const getPlatformStats = async (platform) => {...}

// Rooms
export const createRoom = async (roomData) => {...}
export const joinRoom = async (inviteCode) => {...}
export const getRooms = async () => {...}
export const getLeaderboard = async (roomId, period) => {...}

// Dashboard
export const getProfile = async (userId) => {...}
export const getSummary = async () => {...}
export const getTimeline = async (days) => {...}

// Compare
export const compareUsers = async (u1, u2) => {...}
export const compareWithRoom = async (roomId) => {...}
```

#### 2. **Create Auth Context** (`frontend/src/context/AuthContext.jsx` - NEW)
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {...}
  const logout = () => {...}
  const register = async (data) => {...}

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 3. **Create Protected Route** (`frontend/src/components/PrivateRoute.jsx` - NEW)
```javascript
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <SkeletonLoader />;
  return user ? children : <Navigate to="/login" />;
};
```

#### 4. **Update Pages** (Remove mockData, use APIs)
- `Dashboard.jsx` - Fetch real stats
- `RoomsPage.jsx` - Fetch rooms, create/join
- `ComparisonPage.jsx` - Fetch comparison data
- `SettingsPage.jsx` - Update profile, link platforms
- `PlatformDetailPage.jsx` - Fetch platform stats

#### 5. **Add Loading & Error States**
- Use `SkeletonLoader` component for loading
- Add toast notifications for errors
- Handle API failures gracefully

### Deliverables:
- ✅ Complete `api.js` with all methods
- ✅ AuthContext + PrivateRoute
- ✅ All pages connected to APIs
- ✅ Loading & error handling
- ✅ Remove all mock data

**Estimated Time:** 4-5 days

---

## 🔔 PHASE 7: Real-time Updates & Notifications

**Goal:** Add WebSocket for live updates + email notifications

### Tasks to Complete:

#### 1. **Backend WebSocket** (`backend/src/services/websocketService.js` - NEW)
```javascript
const socketIO = require('socket.io');

module.exports.initWebSocket = (server) => {
  const io = socketIO(server);

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });
  });

  return io;
};

// Emit events when:
// - User syncs platforms
// - Leaderboard updates
// - New member joins room
```

#### 2. **Email Service** (`backend/src/services/emailService.js` - NEW)
```javascript
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {...}

const sendDailySummary = async (user) => {
  // Problems solved, commits today
}

const sendWeeklyReport = async (user) => {
  // Weekly stats, room rankings
}

const sendRoomInvite = async (user, room) => {
  // Invitation email with link
}
```

#### 3. **Frontend WebSocket** (`frontend/src/hooks/useWebSocket.js` - NEW)
```javascript
const useWebSocket = (roomId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    newSocket.emit('join-room', roomId);
    
    newSocket.on('leaderboard-updated', (data) => {
      // Update leaderboard state
    });

    return () => newSocket.close();
  }, [roomId]);

  return socket;
};
```

#### 4. **Add Notification Preferences to User Model**
```javascript
notifications: {
  email: { type: Boolean, default: true },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'weekly' }
}
```

### Deliverables:
- ✅ WebSocket server setup
- ✅ Email service with nodemailer
- ✅ Frontend WebSocket hook
- ✅ Real-time leaderboard updates
- ✅ Email notification system

**Estimated Time:** 2-3 days

---

## 🧪 PHASE 8: Testing, Security & Optimization

**Goal:** Production-ready quality & performance

### Tasks to Complete:

#### 1. **Unit Tests** (`backend/tests/`)
```javascript
// Install: jest, supertest
describe('Room Controller', () => {
  test('should create room', async () => {...})
  test('should join room with valid code', async () => {...})
})
```

#### 2. **Security Enhancements**
```javascript
// Install packages:
npm install helmet express-rate-limit express-validator

// In app.js:
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet()); // Security headers

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);
```

#### 3. **Input Validation**
```javascript
const { body, validationResult } = require('express-validator');

router.post('/rooms', [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().isLength({ max: 500 })
], createRoom);
```

#### 4. **Redis Caching** (Optional but recommended)
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache leaderboard for 5 minutes
const cachedLeaderboard = await client.get(`leaderboard:${roomId}`);
if (cachedLeaderboard) return JSON.parse(cachedLeaderboard);

// ... fetch from DB ...
await client.setEx(`leaderboard:${roomId}`, 300, JSON.stringify(data));
```

#### 5. **Database Optimization**
- Add indexes (already done in models)
- Query optimization (use `.select()` to limit fields)
- Pagination for large lists

### Deliverables:
- ✅ Unit tests (>70% coverage)
- ✅ Security middleware (helmet, rate-limit)
- ✅ Input validation
- ✅ Redis caching (optional)
- ✅ Optimized queries

**Estimated Time:** 3-4 days

---

## 🚢 PHASE 9: Deployment

**Goal:** Live production app on cloud

### Tasks to Complete:

#### 1. **MongoDB Atlas Setup**
- Create cluster at mongodb.com/cloud/atlas
- Whitelist IP addresses
- Get connection string
- Update `.env`: `MONGODB_URI=mongodb+srv://...`

#### 2. **Backend Deployment** (Choose one)

**Option A: Render.com**
```bash
# 1. Create account at render.com
# 2. New Web Service
# 3. Connect GitHub repo
# 4. Build command: npm install
# 5. Start command: npm start
# 6. Add environment variables
```

**Option B: Railway.app**
```bash
# 1. Install CLI: npm i -g @railway/cli
# 2. railway login
# 3. railway init
# 4. railway up
# 5. Set env vars in dashboard
```

#### 3. **Frontend Deployment** (Vercel)
```bash
# 1. Install: npm i -g vercel
# 2. cd frontend
# 3. vercel
# 4. Set env var: VITE_API_URL=https://your-backend.com
```

#### 4. **CI/CD Pipeline** (`.github/workflows/deploy.yml`)
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Backend
        run: railway up
      - name: Deploy Frontend
        run: vercel --prod
```

#### 5. **Monitoring**
- Sentry.io for error tracking
- UptimeRobot for uptime monitoring
- MongoDB Atlas monitoring

### Deliverables:
- ✅ MongoDB Atlas cluster
- ✅ Backend deployed (Render/Railway)
- ✅ Frontend deployed (Vercel)
- ✅ CI/CD pipeline
- ✅ Custom domain (optional)
- ✅ Monitoring setup

**Estimated Time:** 2-3 days

---

## 📅 Timeline Summary

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| Phase 1 | Project Setup | - | ✅ Done |
| Phase 2 | Platform Connectors | - | ✅ Done |
| Phase 3 | Room APIs | - | ✅ Done |
| **Phase 4** | Aggregation & Analytics | 3-4 days | 🔴 Next |
| **Phase 5** | Dashboard APIs | 2-3 days | ⚪ Pending |
| **Phase 6** | Frontend Integration | 4-5 days | ⚪ Pending |
| **Phase 7** | Real-time & Notifications | 2-3 days | ⚪ Pending |
| **Phase 8** | Testing & Security | 3-4 days | ⚪ Pending |
| **Phase 9** | Deployment | 2-3 days | ⚪ Pending |

**Total Remaining Time:** 16-22 days (solo backend dev)

---

## 🎯 Quick Start Guide

### To Continue from Phase 3:

1. **Start Phase 4 Now:**
   ```bash
   cd backend/src/services
   # Edit aggregationService.js
   # Create cpRatingService.js
   # Create insightsService.js
   # Update cronService.js
   ```

2. **Test Each Service:**
   ```bash
   npm run dev
   # Test cron jobs manually
   # Verify aggregation functions
   ```

3. **Move to Phase 5:**
   ```bash
   cd backend/src/controllers
   # Create dashboardController.js
   # Create comparisonController.js
   ```

---

## 📖 Documentation Files

- ✅ `IMPLEMENTATION_ROADMAP.md` - Complete project plan
- ✅ `PHASE3_COMPLETE.md` - Phase 3 API documentation
- ✅ `PHASE3_SUMMARY.md` - Phase 3 summary report
- ✅ `postman_collection_phase3.json` - Postman tests
- ⬜ `PHASE4_COMPLETE.md` - (Create after Phase 4)
- ⬜ `PHASE5_COMPLETE.md` - (Create after Phase 5)

---

## 💡 Tips for Success

1. **Test each phase thoroughly** before moving to next
2. **Use Postman** to verify all endpoints
3. **Keep git commits small** and descriptive
4. **Document as you go** - don't wait until end
5. **Ask for help** when stuck on platform APIs
6. **Focus on MVP first** - optimize later

---

**Ready to start Phase 4?** Let me know! 🚀
