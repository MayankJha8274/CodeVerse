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
  
  // Find the last zero day
  let lastZeroIndex = -1;
  for (let i = cal.length - 1; i >= 0; i--) {
    if (cal[i].count === 0) {
      lastZeroIndex = i;
      break;
    }
  }
  
  if (lastZeroIndex === -1) {
    console.log('No zero days found in the entire calendar!');
    console.log('All', cal.length, 'days have activity');
  } else {
    console.log('Last zero day:', cal[lastZeroIndex].date);
    console.log('Days since last zero:', cal.length - 1 - lastZeroIndex);
    
    // Show all days since last zero
    console.log('\nAll days since last zero:');
    for (let i = lastZeroIndex + 1; i < cal.length; i++) {
      console.log(`  ${cal[i].date}: ${cal[i].count} activities`);
    }
  }
  
  // Also check for any zero days in the last 150 days
  const recentZeros = cal.slice(-150).filter(d => d.count === 0);
  console.log(`\nZero days in last 150 days: ${recentZeros.length}`);
  if (recentZeros.length > 0) {
    console.log('Dates:', recentZeros.map(d => d.date).join(', '));
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
