# 🚀 Quick Start Guide - CodeVerse

## ⚡ Start Your Servers

### Terminal 1 - Backend
```bash
cd C:\Users\mayan\OneDrive\Desktop\CodeVerse\CODEVERSE-PROJECT\backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd C:\Users\mayan\OneDrive\Desktop\CodeVerse\CODEVERSE-PROJECT\frontend
npm run dev
```

### Terminal 3 - MongoDB (if not running as service)
```bash
mongod
```

---

## 🔑 OAuth Setup (REQUIRED!)

**Before OAuth works, you MUST:**

1. **Get Google OAuth Credentials**:
   - Go to: https://console.cloud.google.com/
   - Create project → Enable Google+ API → Create OAuth credentials
   - Redirect URI: `http://localhost:5000/api/auth/google/callback`

2. **Get GitHub OAuth Credentials**:
   - Go to: https://github.com/settings/developers
   - Create OAuth App
   - Callback URL: `http://localhost:5000/api/auth/github/callback`

3. **Update `.env` file** in backend folder:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:5173
```

4. **Restart backend server**

**📖 Full detailed guide**: See `OAUTH_SETUP_GUIDE.md`

---

## 🎮 Test Your Application

### 1. Register/Login
- Go to: http://localhost:5173
- Click "Login" or "Register"
- Try email/password OR OAuth (Google/GitHub)

### 2. Link Platforms
- Go to "Platforms" page
- Click "Link" button on any platform card
- Enter your username for that platform
- Watch your stats sync automatically!

### 3. View Stats
- Dashboard: Overview of all platforms
- Platforms: Detailed stats per platform
- Rooms: Create/join rooms and compete
- Compare: Compare with friends

---

## 📁 Project Structure

```
CODEVERSE-PROJECT/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── passport.js        ← NEW! OAuth config
│   │   ├── models/
│   │   │   └── User.js            ← Updated with OAuth fields
│   │   ├── routes/
│   │   │   └── authRoutes.js      ← Updated with OAuth routes
│   │   ├── controllers/
│   │   ├── services/
│   │   └── app.js                 ← Updated with passport
│   └── .env                       ← ADD OAUTH CREDENTIALS HERE!
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      ← Updated with real OAuth
│   │   │   ├── OAuthSuccess.jsx   ← NEW! OAuth callback handler
│   │   │   └── PlatformDetailPage.jsx ← Updated with linking
│   │   ├── components/
│   │   │   └── PlatformLinkModal.jsx ← NEW! Link platforms
│   │   └── App.jsx                ← Updated with OAuth route
│
├── OAUTH_SETUP_GUIDE.md           ← Full OAuth setup guide
├── PROJECT_STATUS.md              ← Complete project status
└── QUICK_START.md                 ← This file!
```

---

## 🔥 New Features Implemented

### OAuth Login ✅
- ✅ Login with Google
- ✅ Login with GitHub
- ✅ Automatic account creation
- ✅ JWT token generation

### Platform Linking ✅
- ✅ Link 7 coding platforms
- ✅ Visual link status indicators
- ✅ Interactive modal interface
- ✅ Automatic data sync
- ✅ Success/error notifications

---

## 🆕 New Packages Installed

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-github2": "^0.1.12"
}
```

---

## ⚠️ Troubleshooting

### "OAuth not working"
→ Did you set up OAuth credentials and update .env?
→ See OAUTH_SETUP_GUIDE.md

### "Cannot connect to MongoDB"
→ Make sure MongoDB is running
→ Check MONGO_URI in .env

### "Port already in use"
→ Kill existing process or change PORT in .env

### "Frontend not loading"
→ Run `npm install` in frontend folder
→ Check if Vite dev server is running

### "Backend API errors"
→ Run `npm install` in backend folder
→ Check if all .env variables are set
→ Check backend console for error logs

---

## 📊 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login with email/password
- GET `/api/auth/google` - Login with Google
- GET `/api/auth/github` - Login with GitHub

### Platforms
- POST `/api/platforms/link` - Link platform account
- POST `/api/platforms/sync/:platform` - Sync platform data
- GET `/api/platforms/stats/:platform` - Get platform stats

### Rooms
- GET `/api/rooms` - Get all rooms
- POST `/api/rooms` - Create room
- POST `/api/rooms/:id/join` - Join room
- GET `/api/rooms/:id/leaderboard` - Get room leaderboard

### Dashboard
- GET `/api/dashboard/overview` - User overview
- GET `/api/dashboard/analytics` - Analytics data
- GET `/api/dashboard/achievements` - User achievements

---

## ✅ What Works Now

- ✅ OAuth login (Google + GitHub)
- ✅ Email/password login
- ✅ Platform linking (LeetCode, Codeforces, CodeChef, GitHub, GFG, HackerRank)
- ✅ Stats syncing
- ✅ Dashboard with charts
- ✅ Room creation and leaderboards
- ✅ User comparisons
- ✅ Achievements tracking
- ✅ Streak calculations

---

## 🎯 What's Left To Do

### Optional Enhancements:
- Real-time updates (Socket.io)
- Email notifications
- More detailed testing
- Deployment preparation

### Current Status:
**70% Complete - Core features fully functional!**

---

## 🎉 You're All Set!

Once you complete the OAuth setup:

1. Start all servers
2. Open http://localhost:5173
3. Login with Google/GitHub
4. Link your coding platforms
5. Watch your stats come to life!

**Enjoy your fully functional CodeVerse platform!** 🚀

---

**Need help?** Check:
- `OAUTH_SETUP_GUIDE.md` - Detailed OAuth setup
- `PROJECT_STATUS.md` - Complete project overview
- Backend console - Error logs
- Browser console - Frontend errors
