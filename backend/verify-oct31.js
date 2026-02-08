require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const token = jwt.sign({ id: '697774b9d8d704296dd261e2' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const response = await axios.get('http://localhost:5000/api/dashboard/calendar', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const cal = response.data.data.calendar;
  
  // Find Oct 31, 2025
  const oct31 = cal.find(d => d.date === '2025-10-31');
  console.log('Oct 31, 2025 data:', JSON.stringify(oct31, null, 2));
  
  // Show Oct 28 to Nov 3
  console.log('\nOct 28 - Nov 3, 2025:');
  const dates = ['2025-10-28', '2025-10-29', '2025-10-30', '2025-10-31', '2025-11-01', '2025-11-02', '2025-11-03'];
  dates.forEach(date => {
    const day = cal.find(d => d.date === date);
    if (day) {
      console.log(`  ${date}: ${day.count} total (${day.problems || 0} problems, ${day.commits || 0} commits)`);
    } else {
      console.log(`  ${date}: NOT FOUND`);
    }
  });
  
  // Recalculate streaks manually
  console.log('\n=== Manual Streak Calculation ===');
  let maxStreak = 0, tempStreak = 0;
  cal.forEach((d, idx) => {
    if (d.count > 0) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      if (tempStreak > 0) {
        console.log(`Streak ended at ${d.date}, was ${tempStreak} days`);
      }
      tempStreak = 0;
    }
  });
  console.log('Max streak:', maxStreak);
  
  // Current streak
  let currentStreak = 0;
  let i = cal.length - 1;
  if (i >= 0 && cal[i].count === 0) i--;
  for (; i >= 0; i--) {
    if (cal[i].count > 0) {
      currentStreak++;
    } else {
      console.log(`Current streak ends at ${cal[i].date}`);
      break;
    }
  }
  console.log('Current streak:', currentStreak);
  console.log('Current streak date range:', cal[i + 1]?.date, 'to', cal[cal.length - 1]?.date);
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
