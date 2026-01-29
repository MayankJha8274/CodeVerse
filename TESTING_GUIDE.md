# 🧪 CodeVerse Testing Guide

## Step-by-Step Testing Instructions

### 1. Start Both Servers ✅ (Already Running)

**Backend (Terminal 1)**:
```bash
cd backend
npm run dev
```
Should show: `Server running on port 5000`

**Frontend (Terminal 2)**:
```bash
cd frontend
npm run dev
```
Should show: `Local: http://localhost:5174/`

---

## 2. Test OAuth Login 🔐

### Option A: Login with Google
1. Open browser: `http://localhost:5174`
2. Click "Login" button
3. Click "Continue with Google"
4. Authorize with your Google account
5. You'll be redirected to Dashboard

### Option B: Login with GitHub
1. Open browser: `http://localhost:5174`
2. Click "Login" button
3. Click "Continue with GitHub"
4. Authorize with your GitHub account
5. You'll be redirected to Dashboard

**Expected Result**: 
- You should see a welcome page that says **"No Platforms Linked Yet"**
- This is NORMAL - new users have no data to display
- You'll see a big blue button: **"Link Your First Platform"**

---

## 3. Link Your Coding Platforms 🔗

### Navigate to Platforms Page
- Click the **"Link Your First Platform"** button on Dashboard
- OR click **"Platforms"** in the sidebar

### Link LeetCode (Recommended First)
1. Find the LeetCode card
2. Click the **"Link"** button
3. Enter your LeetCode username (e.g., `yourname`)
4. Click **"Link Account"**
5. Wait 5-10 seconds for data to sync
6. You should see a success message!

### Link GitHub
1. Find the GitHub card
2. Click **"Link"** button
3. Enter your GitHub username (e.g., `yourusername`)
4. Click **"Link Account"**
5. Wait for sync
6. Success notification appears

### Link Codeforces
1. Find the Codeforces card
2. Click **"Link"** button
3. Enter your Codeforces handle (e.g., `tourist`)
4. Click **"Link Account"**
5. Wait for sync

### Other Platforms
Repeat the same process for:
- **CodeChef**: Enter your CodeChef username
- **GeeksForGeeks**: Enter your GFG username
- **HackerRank**: Enter your HackerRank username
- **CodingNinjas**: Enter your CodingNinjas username

---

## 4. View Your Dashboard 📊

### Go Back to Dashboard
- Click **"Dashboard"** in the sidebar
- You should NOW see stats populated!

### What You'll See:
✅ **Stat Cards**:
- Total Problems Solved (combined from all platforms)
- Active Days & Current Streak
- Average Rating
- GitHub Commits

✅ **Charts** (if you have enough data):
- Problems Solved Over Time (bar chart)
- Rating Growth (line chart)
- Topic Mastery (heatmap)

✅ **Platform Cards**:
- LeetCode stats (if linked)
- Codeforces stats (if linked)
- GitHub stats (if linked)

---

## 5. Test Rooms/Societies Feature 👥

### Create a Room
1. Click **"Rooms"** in sidebar
2. Click **"Create Room"** button
3. Enter room details:
   - **Name**: "My Coding Club"
   - **Description**: "Let's compete together!"
   - **Type**: Public or Private
4. Click **"Create"**
5. You'll see your new room!

### View Leaderboard
1. Click on your room card
2. View the leaderboard showing all members' stats
3. You should be #1 if you're the only member!

### Invite Friends (Optional)
1. Copy the invite code from the room
2. Share with friends
3. They can join using the code

---

## 6. Test Comparison Feature 🆚

### Compare with Another User
1. Click **"Compare"** in sidebar
2. Enter a username to compare with
3. View side-by-side comparison:
   - Total problems
   - Ratings
   - Platform-specific stats
   - Charts comparing progress

---

## 7. Test Platform Detail Views 📈

### View Platform Details
1. Go to **"Platforms"** page
2. Click on any **tab** (LeetCode, Codeforces, etc.)
3. See detailed stats for that platform:
   - Difficulty breakdown
   - Submission activity
   - Rating history
   - Recent submissions

### Sync Data Manually
1. On platform detail page
2. Click **"Sync"** button
3. Wait for data to refresh
4. Stats should update!

---

## 8. Test Settings Page ⚙️

### Update Profile
1. Click **"Settings"** in sidebar
2. Update your profile:
   - Change display name
   - Update email
   - Change password (if you registered with email)
3. Click **"Save"**

### Unlink Platform (Optional)
1. Go to Settings → Platforms section
2. Click **"Unlink"** on any platform
3. Confirm unlinking
4. Platform removed from your account

---

## Common Issues & Solutions 🔧

### Issue 1: Dashboard is Blank After Login
**Cause**: You haven't linked any platforms yet
**Solution**: Click "Link Your First Platform" → Link at least one platform

### Issue 2: "Failed to fetch platform data"
**Cause**: Invalid username or private profile
**Solutions**:
- Check username spelling
- Make sure your profile is public on that platform
- Try again in a few seconds (rate limiting)

### Issue 3: GitHub Says "API rate limit exceeded"
**Cause**: You're using unauthenticated GitHub requests (60/hour limit)
**Solution**: The backend is configured with `GITHUB_TOKEN` (5000/hour), so this shouldn't happen

### Issue 4: Stats Not Updating
**Cause**: Data is cached
**Solutions**:
- Click the "Sync" button on platform page
- Wait a few minutes and refresh
- Check backend terminal for errors

### Issue 5: OAuth Redirect Loop
**Cause**: Token not saving properly
**Solutions**:
- Clear browser localStorage
- Try different browser
- Check browser console for errors

---

## Verification Checklist ✅

After testing, confirm these work:

- [ ] OAuth login with Google works
- [ ] OAuth login with GitHub works
- [ ] Dashboard shows empty state for new users
- [ ] Can link LeetCode account
- [ ] Can link GitHub account
- [ ] Can link Codeforces account
- [ ] Dashboard shows stats after linking platforms
- [ ] Can create a room
- [ ] Can view room leaderboard
- [ ] Can compare with another user
- [ ] Can view platform detail pages
- [ ] Can manually sync platform data
- [ ] Can update profile in settings
- [ ] Can logout and login again

---

## Test Data Suggestions 📝

### Public Accounts You Can Use for Testing:

**LeetCode**:
- `neal_wu` - Competitive programmer
- `kamyu104` - Lots of problems solved

**Codeforces**:
- `tourist` - #1 ranked competitive programmer
- `Benq` - Top coder with great stats

**GitHub**:
- `torvalds` - Linus Torvalds (Linux creator)
- `tj` - TJ Holowaychuk (Express.js creator)
- `yourusername` - Your own account!

**CodeChef**:
- `gennady.korotkevich` - Legendary coder

---

## Expected API Response Times ⏱️

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Login | 1-2 seconds | Fast JWT generation |
| Link Platform | 5-15 seconds | Fetches data from external API |
| Sync Platform | 5-15 seconds | Scrapes/fetches fresh data |
| Dashboard Load | 1-3 seconds | Multiple API calls |
| Room Creation | 1 second | Database write |

---

## Browser DevTools Tips 🛠️

### Check Network Requests:
1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter by "Fetch/XHR"
4. Watch API calls as you interact
5. Check for 200 OK responses

### Check Console for Errors:
1. Open DevTools (F12)
2. Go to "Console" tab
3. Look for red errors
4. Common errors:
   - 401 Unauthorized → Token expired, login again
   - 404 Not Found → API endpoint doesn't exist
   - 500 Internal Server Error → Backend issue

### Check LocalStorage:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "Local Storage" → `http://localhost:5174`
4. Should see:
   - `token` - Your JWT token
   - `user` - Your user data

---

## Next Steps After Testing ✨

Once everything works locally:

### Short Term:
1. Fix any bugs you encounter
2. Link all 7 platforms
3. Create multiple rooms
4. Invite friends to test

### Before Production:
1. Update OAuth redirect URIs in Google/GitHub to production URLs
2. Set environment variables on hosting platform
3. Deploy backend to Render/Railway/Heroku
4. Deploy frontend to Vercel/Netlify
5. Test OAuth flow on production domain
6. Configure custom domain (optional)

### Nice to Have:
1. Add real-time features with Socket.io
2. Email notifications for achievements
3. Mobile responsive improvements
4. Dark mode toggle
5. Export stats to PDF

---

## Support 💬

**If something doesn't work**:
1. Check both terminal windows for errors
2. Check browser console (F12)
3. Verify environment variables in `.env` files
4. Make sure MongoDB is connected
5. Restart both servers

**Most Common Fix**: 
```bash
# Clear everything and restart
# Terminal 1 (Backend)
cd backend
rm -rf node_modules
npm install
npm run dev

# Terminal 2 (Frontend)
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

**Happy Testing! 🎉**

Your CodeVerse platform is ready to track your coding journey across all major platforms!
