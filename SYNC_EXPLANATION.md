# How CodeVerse Syncing and Data Updates Work

## 📊 What Does "Sync All Platforms" Do?

When you click **"Sync All Platforms"**, CodeVerse:

1. **Fetches FRESH data** from each platform's API in real-time:
   - LeetCode: Problems solved, contest ratings, submissions calendar
   - GitHub: Commits, PRs, contribution calendar
   - Codeforces: Problems solved, rating, contest history
   - HackerRank: Problems solved, submissions calendar
   - CodeChef: Problems solved, rating, contests
   - GeeksForGeeks: Problems solved, coding score
   - CodingNinjas: Problems solved, score

2. **Saves to database**: Stores the fetched stats in PlatformStats collection

3. **Recalculates aggregated stats**: Sums up total problems, calculates streaks, etc.

4. **Updates your dashboard**: Shows the fresh data

## ⏰ When Does Data Update Automatically?

**CodeVerse does NOT auto-update data.** You must manually click "Sync" because:

- **API rate limits**: Each platform has limits on how often we can fetch data
- **Performance**: Live-fetching all platforms takes 10-30 seconds
- **User control**: You decide when to refresh your data

## 🔄 Why Does Data Change Each Sync?

Data can change between syncs because:

1. **You solved new problems** since last sync
2. **Platform APIs update their data** (they may have delays/caches)
3. **Streak calculations update** based on new submissions
4. **Calendar data refreshes** with latest activity

## ⚠️ Current Issue with Oct 31, 2025

- **HackerRank API was returning 8 submissions** on Oct 31, 2025
- **You said you had zero activity** that day
- **I manually removed Oct 31** from your HackerRank calendar
- **Refresh your dashboard** to see correct streaks now

## ✅ Recommended Usage

- **Sync once per day** after you finish coding
- **Don't spam the sync button** - it refetches all platforms each time
- **Cooldown**: 1-hour cooldown between syncs to prevent API abuse

## 🔮 Future Auto-Sync (Not Implemented Yet)

Planned features:
- Daily auto-sync at midnight
- Background sync every 6 hours
- Webhook integration for instant updates
