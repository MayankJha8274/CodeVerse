const mongoose = require('mongoose');
const DailyProgress = require('../models/DailyProgress');
const SocietyMember = require('../models/SocietyMember');

exports.getAnalyticsTrend = async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const { userIds, range = '1W' } = req.query;

    let startDate = new Date();
    if (range === '1D') startDate.setDate(startDate.getDate() - 1);
    else if (range === '1W') startDate.setDate(startDate.getDate() - 7);
    else if (range === '1M') startDate.setMonth(startDate.getMonth() - 1);
    else if (range === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate = new Date(0);

    let targetUserIds = [];
    if (userIds) {
      targetUserIds = userIds.split(',').map(id => mongoose.Types.ObjectId.createFromHexString(id));
    } else {
      const members = await SocietyMember.find({ society: entityId }).populate('user', 'username').limit(5);
      targetUserIds = members.map(m => m.user?._id).filter(Boolean);
    }

    const stats = await DailyProgress.find({
      userId: { $in: targetUserIds },
      date: { $gte: startDate }
    }).populate('userId', 'username avatar').sort({ date: 1 }).lean();

    const usersData = {};
    stats.forEach(stat => {
      if (!stat.userId) return;
      const username = stat.userId.username;
      if (!usersData[username]) usersData[username] = { userId: stat.userId._id, name: username, data: [] };
      usersData[username].data.push({
        date: stat.date.toISOString().split('T')[0],
        problemsSolved: stat.aggregatedStats?.totalProblemsSolved || 0,
        xp: (stat.aggregatedStats?.totalProblemsSolved || 0) * 10,
        contestScore: stat.aggregatedStats?.averageRating || 0
      });
    });

    let finalUsers = Object.values(usersData).map(u => {
      let maxProblems = 0;
      let maxXp = 0;
      let maxScore = 0;
      u.data.sort((a,b) => new Date(a.date) - new Date(b.date));
      u.data = u.data.map(d => {
        maxProblems = Math.max(maxProblems, d.problemsSolved);
        maxXp = Math.max(maxXp, d.xp);
        maxScore = Math.max(maxScore, d.contestScore);
        return { ...d, problemsSolved: maxProblems, xp: maxXp, contestScore: maxScore };
      });
      return u;
    });

    if (finalUsers.length === 0) {
      finalUsers = [];
    }

    res.json({ success: true, users: finalUsers });
  } catch (error) { next(error); }
};

exports.getAnalyticsComparison = async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const { userIds } = req.query;

    let targetUserIds = [];
    if (userIds) {
      targetUserIds = userIds.split(',').map(id => mongoose.Types.ObjectId.createFromHexString(id));
    } else {
      const members = await SocietyMember.find({ society: entityId }).populate('user', 'username').limit(5);
      targetUserIds = members.map(m => m.user?._id).filter(Boolean);
    }

    const latestStats = await DailyProgress.aggregate([
      { $match: { userId: { $in: targetUserIds } } },
      { $sort: { date: -1 } },
      { $group: {
          _id: "$userId",
          problemsSolved: { $first: "$aggregatedStats.totalProblemsSolved" },
          contestScore: { $first: "$aggregatedStats.averageRating" },
          commits: { $first: "$aggregatedStats.totalCommits" }
      }}
    ]);

    const populatedStats = await mongoose.model('User').populate(latestStats, { path: "_id", select: "username avatar" });

    let datasets = populatedStats.map(stat => {
      const username = stat._id?.username || 'Unknown';
      return {
        name: username,
        data: [
          stat.problemsSolved || 0,
          Math.floor((stat.contestScore || 0) / 10),
          stat.commits || 0
        ]
      };
    });

    res.json({ success: true, labels: ["Problems Solved", "Contest Score (x10)", "Commits"], datasets });
  } catch (error) { next(error); }
};

exports.getAnalyticsWeekly = async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const members = await SocietyMember.find({ society: entityId });
    const userIds = members.map(m => m.user).filter(Boolean);

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const stats = await DailyProgress.find({
      userId: { $in: userIds },
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pulseMap = {};
    for (let i = 0; i < 7; i++) {
        let d = new Date();
        d.setDate(d.getDate() - (6 - i));
        let ds = d.toISOString().split('T')[0];
        pulseMap[ds] = { day: days[d.getDay()], date: ds, count: 0 };
    }

    stats.forEach(s => {
        let ds = s.date.toISOString().split('T')[0];
        if (pulseMap[ds]) {
            pulseMap[ds].count += (s.aggregatedStats?.platformsActive || 1);
        }
    });

    res.json({
      success: true,
      data: Object.values(pulseMap)
    });
  } catch (error) { next(error); }
};

exports.getAnalyticsStreak = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { current: 3, best: 14, activeDays: 28 }
    });
  } catch (error) { next(error); }
};
