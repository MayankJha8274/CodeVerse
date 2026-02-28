const SheetProgress = require('../models/SheetProgress');
const mongoose = require('mongoose');

// Get all progress for a sheet
exports.getSheetProgress = async (req, res, next) => {
  try {
    const { sheetId } = req.params;
    const userId = req.user.id;

    const progress = await SheetProgress.find({ user: userId, sheetId });
    
    // Convert to a map for easier frontend access
    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.problemId] = {
        status: p.status,
        notes: p.notes,
        revision: p.revision,
        solvedAt: p.solvedAt
      };
    });

    res.json({ success: true, progress: progressMap });
  } catch (error) {
    next(error);
  }
};

// Get all progress for a user (all sheets)
exports.getAllProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const progress = await SheetProgress.find({ user: userId });
    
    // Group by sheetId
    const progressBySheet = {};
    progress.forEach(p => {
      if (!progressBySheet[p.sheetId]) {
        progressBySheet[p.sheetId] = {};
      }
      progressBySheet[p.sheetId][p.problemId] = {
        status: p.status,
        notes: p.notes,
        revision: p.revision,
        solvedAt: p.solvedAt,
        topicIndex: p.topicIndex,
        problemIndex: p.problemIndex
      };
    });

    res.json({ success: true, progress: progressBySheet });
  } catch (error) {
    next(error);
  }
};

// Update problem status
exports.updateProblemStatus = async (req, res, next) => {
  try {
    const { sheetId, problemId, topicIndex, problemIndex, status } = req.body;
    const userId = req.user.id;

    const updateData = {
      status,
      ...(status === 'solved' ? { solvedAt: new Date() } : {})
    };

    const progress = await SheetProgress.findOneAndUpdate(
      { user: userId, sheetId, problemId },
      { 
        $set: updateData,
        $setOnInsert: { topicIndex, problemIndex }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

// Update problem notes
exports.updateProblemNotes = async (req, res, next) => {
  try {
    const { sheetId, problemId, topicIndex, problemIndex, notes } = req.body;
    const userId = req.user.id;

    const progress = await SheetProgress.findOneAndUpdate(
      { user: userId, sheetId, problemId },
      { 
        $set: { notes },
        $setOnInsert: { topicIndex, problemIndex, status: 'unsolved' }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

// Toggle revision status
exports.toggleRevision = async (req, res, next) => {
  try {
    const { sheetId, problemId, topicIndex, problemIndex } = req.body;
    const userId = req.user.id;

    // First, check if document exists
    const existing = await SheetProgress.findOne({ user: userId, sheetId, problemId });
    
    let progress;
    if (existing) {
      progress = await SheetProgress.findOneAndUpdate(
        { user: userId, sheetId, problemId },
        { $set: { revision: !existing.revision } },
        { new: true }
      );
    } else {
      progress = await SheetProgress.create({
        user: userId,
        sheetId,
        problemId,
        topicIndex,
        problemIndex,
        revision: true,
        status: 'unsolved'
      });
    }

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

// Get revision problems (for revision page)
exports.getRevisionProblems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const revisionProblems = await SheetProgress.find({ 
      user: userId, 
      revision: true 
    });

    res.json({ success: true, problems: revisionProblems });
  } catch (error) {
    next(error);
  }
};

// Get stats for a user
exports.getProgressStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const stats = await SheetProgress.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$sheetId',
          total: { $sum: 1 },
          solved: { 
            $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } 
          },
          attempted: { 
            $sum: { $cond: [{ $eq: ['$status', 'attempted'] }, 1, 0] } 
          },
          revision: { 
            $sum: { $cond: ['$revision', 1, 0] } 
          }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id] = {
        total: s.total,
        solved: s.solved,
        attempted: s.attempted,
        revision: s.revision
      };
    });

    res.json({ success: true, stats: statsMap });
  } catch (error) {
    next(error);
  }
};
