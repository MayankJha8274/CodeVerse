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
  console.log('Calendar length:', cal.length);
  
  // Count active days
  const activeDays = cal.filter(d => d.count > 0);
  console.log('Active days:', activeDays.length);
  
  // Max streak (forward scan)
  let maxStreak = 0, tempStreak = 0;
  cal.forEach(d => {
    if (d.count > 0) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });
  console.log('Max streak:', maxStreak);
  
  // Current streak (backward scan from today)
  let currentStreak = 0;
  let i = cal.length - 1;
  // Skip today if no activity
  if (i >= 0 && cal[i].count === 0) i--;
  for (; i >= 0; i--) {
    if (cal[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  console.log('Current streak:', currentStreak);
  
  // Show last 30 days
  console.log('\nLast 30 days:');
  cal.slice(-30).forEach(d => {
    console.log(`  ${d.date}: ${d.count} (${d.problems || 0}p + ${d.commits || 0}c)`);
  });
  
  // Find last zero day
  const zeroDays = [];
  for (let j = cal.length - 1; j >= 0 && zeroDays.length < 5; j--) {
    if (cal[j].count === 0) {
      zeroDays.push(cal[j].date);
    }
  }
  console.log('\nLast 5 zero-activity days:', zeroDays.join(', '));
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
