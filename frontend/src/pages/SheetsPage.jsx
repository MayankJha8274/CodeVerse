import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  Check,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Star,
  Video,
  FileText,
  StickyNote,
  X,
  ArrowLeft,
  Flame,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  striverA2ZProblems, 
  neetcode150Problems, 
  blind75Problems, 
  striverSDEProblems, 
  loveBabbarProblems, 
  frazSdeProblems 
} from '../data/sheetsData';

// Popular DSA Sheets Data
const dsaSheets = [
  {
    id: 'striver-a2z',
    name: "Striver's A to Z DSA Sheet",
    author: 'Striver (Raj Vikramaditya)',
    description: 'Complete DSA preparation from basics to advanced. Covers all important topics with video explanations.',
    totalProblems: 455,
    difficulty: 'Beginner to Advanced',
    estimatedTime: '3-4 months',
    color: 'from-red-500 to-orange-500',
    accentColor: '#ef4444',
    icon: '🔥',
    topics: [
      { name: 'Learn the Basics', problems: 31 },
      { name: 'Sorting', problems: 7 },
      { name: 'Arrays', problems: 40 },
      { name: 'Binary Search', problems: 32 },
      { name: 'Strings', problems: 15 },
      { name: 'Linked List', problems: 31 },
      { name: 'Recursion', problems: 25 },
      { name: 'Bit Manipulation', problems: 18 },
      { name: 'Stack & Queue', problems: 30 },
      { name: 'Sliding Window', problems: 12 },
      { name: 'Heaps', problems: 17 },
      { name: 'Greedy', problems: 16 },
      { name: 'Binary Trees', problems: 45 },
      { name: 'BST', problems: 16 },
      { name: 'Graphs', problems: 54 },
      { name: 'Dynamic Programming', problems: 56 },
      { name: 'Tries', problems: 7 },
      { name: 'Strings Advanced', problems: 8 }
    ],
    link: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2',
    problemsData: striverA2ZProblems
  },
  {
    id: 'striver-sde',
    name: "Striver's SDE Sheet",
    author: 'Striver (Raj Vikramaditya)',
    description: 'Curated list of 191 problems for SDE interviews. Focus on most asked interview questions.',
    totalProblems: 191,
    difficulty: 'Intermediate to Advanced',
    estimatedTime: '1-2 months',
    color: 'from-purple-500 to-pink-500',
    accentColor: '#a855f7',
    icon: '💼',
    topics: [
      { name: 'Arrays', problems: 18 },
      { name: 'Arrays Part II', problems: 6 },
      { name: 'Arrays Part III', problems: 6 },
      { name: 'Arrays Part IV', problems: 6 },
      { name: 'Linked List', problems: 11 },
      { name: 'Linked List Part II', problems: 6 },
      { name: 'Linked List & Arrays', problems: 6 },
      { name: 'Greedy Algorithm', problems: 6 },
      { name: 'Recursion', problems: 6 },
      { name: 'Recursion & Backtracking', problems: 6 },
      { name: 'Binary Search', problems: 11 },
      { name: 'Heaps', problems: 6 },
      { name: 'Stack and Queue', problems: 7 },
      { name: 'Stack and Queue Part II', problems: 7 },
      { name: 'Strings', problems: 6 },
      { name: 'Strings Part II', problems: 5 },
      { name: 'Binary Tree', problems: 13 },
      { name: 'Binary Tree Part II', problems: 10 },
      { name: 'Binary Tree Part III', problems: 8 },
      { name: 'BST', problems: 11 },
      { name: 'BST Part II', problems: 5 },
      { name: 'Binary Trees Misc', problems: 6 },
      { name: 'Graphs', problems: 13 },
      { name: 'Graphs Part II', problems: 8 },
      { name: 'Dynamic Programming', problems: 7 },
      { name: 'DP Part II', problems: 9 },
      { name: 'Trie', problems: 4 }
    ],
    link: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems',
    problemsData: striverSDEProblems
  },
  {
    id: 'neetcode-150',
    name: 'NeetCode 150',
    author: 'NeetCode',
    description: 'Curated list of 150 LeetCode problems covering all important patterns for coding interviews.',
    totalProblems: 150,
    difficulty: 'Intermediate',
    estimatedTime: '2-3 months',
    color: 'from-green-500 to-teal-500',
    accentColor: '#22c55e',
    icon: '🎯',
    topics: [
      { name: 'Arrays & Hashing', problems: 9 },
      { name: 'Two Pointers', problems: 5 },
      { name: 'Sliding Window', problems: 6 },
      { name: 'Stack', problems: 7 },
      { name: 'Binary Search', problems: 7 },
      { name: 'Linked List', problems: 11 },
      { name: 'Trees', problems: 15 },
      { name: 'Tries', problems: 3 },
      { name: 'Heap / Priority Queue', problems: 7 },
      { name: 'Backtracking', problems: 9 },
      { name: 'Graphs', problems: 13 },
      { name: 'Advanced Graphs', problems: 6 },
      { name: '1-D DP', problems: 12 },
      { name: '2-D DP', problems: 11 },
      { name: 'Greedy', problems: 8 },
      { name: 'Intervals', problems: 6 },
      { name: 'Math & Geometry', problems: 8 },
      { name: 'Bit Manipulation', problems: 7 }
    ],
    link: 'https://neetcode.io/practice',
    problemsData: neetcode150Problems
  },
  {
    id: 'blind-75',
    name: 'Blind 75',
    author: 'Blind Community',
    description: 'The famous Blind 75 list - most commonly asked LeetCode questions at top tech companies.',
    totalProblems: 75,
    difficulty: 'Intermediate to Advanced',
    estimatedTime: '1 month',
    color: 'from-blue-500 to-indigo-500',
    accentColor: '#3b82f6',
    icon: '👁️',
    topics: [
      { name: 'Array', problems: 11 },
      { name: 'Binary', problems: 5 },
      { name: 'Dynamic Programming', problems: 11 },
      { name: 'Graph', problems: 8 },
      { name: 'Interval', problems: 5 },
      { name: 'Linked List', problems: 6 },
      { name: 'Matrix', problems: 4 },
      { name: 'String', problems: 10 },
      { name: 'Tree', problems: 14 },
      { name: 'Heap', problems: 1 }
    ],
    link: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions',
    problemsData: blind75Problems
  },
  {
    id: 'love-babbar',
    name: 'Love Babbar DSA Sheet',
    author: 'Love Babbar',
    description: 'Comprehensive 450 DSA questions sheet covering all important topics for placements.',
    totalProblems: 450,
    difficulty: 'Beginner to Advanced',
    estimatedTime: '3-4 months',
    color: 'from-yellow-500 to-amber-500',
    accentColor: '#f59e0b',
    icon: '💛',
    topics: [
      { name: 'Arrays', problems: 36 },
      { name: 'Matrix', problems: 10 },
      { name: 'Strings', problems: 43 },
      { name: 'Searching & Sorting', problems: 36 },
      { name: 'Linked List', problems: 36 },
      { name: 'Bit Manipulation', problems: 10 },
      { name: 'Greedy', problems: 35 },
      { name: 'Backtracking', problems: 17 },
      { name: 'Dynamic Programming', problems: 60 },
      { name: 'Stacks & Queues', problems: 38 },
      { name: 'Binary Trees', problems: 35 },
      { name: 'BST', problems: 22 },
      { name: 'Graphs', problems: 44 },
      { name: 'Heap', problems: 18 },
      { name: 'Trie', problems: 6 },
      { name: 'Segment Trees', problems: 4 }
    ],
    link: 'https://450dsa.com/',
    problemsData: loveBabbarProblems
  },
  {
    id: 'fraz-sde',
    name: 'Fraz SDE Sheet',
    author: 'Fraz (Lead SDE)',
    description: 'Quality over quantity - carefully selected problems by Lead SDE to crack interviews.',
    totalProblems: 250,
    difficulty: 'Intermediate',
    estimatedTime: '2 months',
    color: 'from-cyan-500 to-blue-500',
    accentColor: '#06b6d4',
    icon: '🚀',
    topics: [
      { name: 'Arrays', problems: 25 },
      { name: 'Strings', problems: 20 },
      { name: 'Linked List', problems: 18 },
      { name: 'Stack & Queue', problems: 22 },
      { name: 'Binary Trees', problems: 30 },
      { name: 'BST', problems: 15 },
      { name: 'Graphs', problems: 35 },
      { name: 'DP', problems: 40 },
      { name: 'Binary Search', problems: 15 },
      { name: 'Two Pointers', problems: 12 },
      { name: 'Recursion & Backtracking', problems: 18 }
    ],
    link: 'https://docs.google.com/spreadsheets/d/1-wKcV99KtO91dXdPkwmXGTdtyxAfk1mbPXQg81R9sFE',
    problemsData: frazSdeProblems
  }
];

// Notes Modal Component
const NotesModal = ({ isOpen, onClose, problem, notes, onSave }) => {
  const [noteText, setNoteText] = useState(notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNoteText(notes || '');
  }, [notes, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave(noteText);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <StickyNote className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{problem?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add your notes here... (approach, time complexity, key insights)"
            className="w-full h-48 bg-gray-50 dark:bg-[#0d0d14] border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none transition-colors"
          />
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// Circular Progress Component
const CircularProgress = ({ completed, total, size = 60, color }) => {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2a2a3e"
          strokeWidth={6}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || '#f59e0b'}
          strokeWidth={6}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

// Difficulty Badge Component
const DifficultyBadge = ({ difficulty }) => {
  const colors = {
    'Easy': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Hard': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[difficulty] || colors['Medium']}`}>
      {difficulty}
    </span>
  );
};

// Status Button Component
const StatusButton = ({ status, onChange }) => {
  const getNextStatus = () => {
    if (status === 'unsolved') return 'solved';
    if (status === 'solved') return 'attempted';
    return 'unsolved';
  };

  const statusConfig = {
    'unsolved': { icon: Circle, color: 'text-gray-500 hover:text-amber-500' },
    'attempted': { icon: Circle, color: 'text-yellow-500' },
    'solved': { icon: CheckCircle2, color: 'text-green-500' }
  };

  const config = statusConfig[status] || statusConfig['unsolved'];
  const Icon = config.icon;

  return (
    <button
      onClick={() => onChange(getNextStatus())}
      className={`transition-colors ${config.color}`}
      title={`Status: ${status} (click to change)`}
    >
      <Icon className={`w-5 h-5 ${status === 'attempted' ? 'fill-yellow-500/30' : ''}`} />
    </button>
  );
};

const SheetsPage = () => {
  const { user } = useAuth();
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [expandedTopics, setExpandedTopics] = useState({});
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [notesModal, setNotesModal] = useState({ isOpen: false, problem: null, sheetId: '', topicIndex: 0, problemIndex: 0, problemId: '' });
  const [stats, setStats] = useState({ totalSolved: 0, totalRevision: 0 });
  const [activeTab, setActiveTab] = useState('all');

  // Fetch progress from API
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await api.get('/sheets/progress');
        if (response.data.success) {
          setProgress(response.data.progress);
          
          let solved = 0;
          let revision = 0;
          Object.values(response.data.progress).forEach(sheet => {
            Object.values(sheet).forEach(problem => {
              if (problem.status === 'solved') solved++;
              if (problem.revision) revision++;
            });
          });
          setStats({ totalSolved: solved, totalRevision: revision });
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        const saved = localStorage.getItem('sheetProgressV2');
        if (saved) {
          setProgress(JSON.parse(saved));
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProgress();
    } else {
      const saved = localStorage.getItem('sheetProgressV2');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
      setLoading(false);
    }
  }, [user]);

  // Generate problem ID
  const getProblemId = (sheetId, topicIndex, problemIndex) => {
    return `${sheetId}-${topicIndex}-${problemIndex}`;
  };

  // Get problem progress
  const getProblemProgress = (sheetId, problemId) => {
    return progress[sheetId]?.[problemId] || { status: 'unsolved', notes: '', revision: false };
  };

  // Update problem status
  const updateStatus = async (sheetId, problemId, topicIndex, problemIndex, status) => {
    const currentStatus = getProblemProgress(sheetId, problemId).status;
    const newProgress = { ...progress };
    if (!newProgress[sheetId]) newProgress[sheetId] = {};
    newProgress[sheetId][problemId] = {
      ...newProgress[sheetId][problemId],
      status,
      ...(status === 'solved' ? { solvedAt: new Date().toISOString() } : {})
    };
    setProgress(newProgress);
    localStorage.setItem('sheetProgressV2', JSON.stringify(newProgress));

    // Update stats
    if (status === 'solved' && currentStatus !== 'solved') {
      setStats(prev => ({ ...prev, totalSolved: prev.totalSolved + 1 }));
    } else if (currentStatus === 'solved' && status !== 'solved') {
      setStats(prev => ({ ...prev, totalSolved: prev.totalSolved - 1 }));
    }

    if (user) {
      try {
        await api.post('/sheets/status', { sheetId, problemId, topicIndex, problemIndex, status });
      } catch (error) {
        console.error('Error saving status:', error);
      }
    }
  };

  // Toggle revision
  const toggleRevision = async (sheetId, problemId, topicIndex, problemIndex) => {
    const currentProgress = getProblemProgress(sheetId, problemId);
    const newProgress = { ...progress };
    if (!newProgress[sheetId]) newProgress[sheetId] = {};
    newProgress[sheetId][problemId] = {
      ...newProgress[sheetId][problemId],
      revision: !currentProgress.revision
    };
    setProgress(newProgress);
    localStorage.setItem('sheetProgressV2', JSON.stringify(newProgress));

    setStats(prev => ({
      ...prev,
      totalRevision: currentProgress.revision ? prev.totalRevision - 1 : prev.totalRevision + 1
    }));

    if (user) {
      try {
        await api.post('/sheets/revision', { sheetId, problemId, topicIndex, problemIndex });
      } catch (error) {
        console.error('Error toggling revision:', error);
      }
    }
  };

  // Save notes
  const saveNotes = async (notes) => {
    const { sheetId, problemId, topicIndex, problemIndex } = notesModal;
    const newProgress = { ...progress };
    if (!newProgress[sheetId]) newProgress[sheetId] = {};
    newProgress[sheetId][problemId] = {
      ...newProgress[sheetId][problemId],
      notes
    };
    setProgress(newProgress);
    localStorage.setItem('sheetProgressV2', JSON.stringify(newProgress));

    if (user) {
      try {
        await api.post('/sheets/notes', { sheetId, problemId, topicIndex, problemIndex, notes });
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }
  };

  // Calculate sheet progress
  const getSheetProgress = (sheet) => {
    const sheetProgress = progress[sheet.id] || {};
    let solved = 0;
    let attempted = 0;
    let revision = 0;

    Object.values(sheetProgress).forEach(p => {
      if (p.status === 'solved') solved++;
      if (p.status === 'attempted') attempted++;
      if (p.revision) revision++;
    });

    return { solved, attempted, revision, total: sheet.totalProblems };
  };

  // Calculate topic progress
  const getTopicProgress = (sheetId, topicIndex, problemCount) => {
    const sheetProgress = progress[sheetId] || {};
    let solved = 0;
    
    for (let i = 0; i < problemCount; i++) {
      const problemId = getProblemId(sheetId, topicIndex, i);
      if (sheetProgress[problemId]?.status === 'solved') solved++;
    }

    return { solved, total: problemCount };
  };

  // Toggle topic expansion
  const toggleTopic = (topicKey) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Filter sheets
  const filteredSheets = dsaSheets.filter(sheet => {
    const matchesSearch = sheet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sheet.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || 
                             sheet.difficulty.toLowerCase().includes(filterDifficulty.toLowerCase());
    return matchesSearch && matchesDifficulty;
  });

  // Filter problems based on active tab
  const shouldShowProblem = (sheetId, problemId) => {
    const prob = getProblemProgress(sheetId, problemId);
    if (activeTab === 'all') return true;
    if (activeTab === 'revision') return prob.revision;
    if (activeTab === 'attempted') return prob.status === 'attempted';
    if (activeTab === 'solved') return prob.status === 'solved';
    if (activeTab === 'unsolved') return prob.status === 'unsolved';
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d0d14] flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white dark:bg-[#0d0d14] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Notes Modal */}
        <NotesModal
          isOpen={notesModal.isOpen}
          onClose={() => setNotesModal({ isOpen: false, problem: null, sheetId: '', topicIndex: 0, problemIndex: 0, problemId: '' })}
          problem={notesModal.problem}
          notes={notesModal.problem ? getProblemProgress(notesModal.sheetId, notesModal.problemId)?.notes : ''}
          onSave={saveNotes}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-500" />
            DSA Sheets
          </h1>
          <p className="text-gray-400">Track your progress on popular DSA preparation sheets</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#16161f] border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-white dark:bg-[#16161f] border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-8 py-3 text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-amber-500" />
              <span className="text-gray-400 text-sm">Total Sheets</span>
            </div>
            <p className="text-3xl font-bold text-white">{dsaSheets.length}</p>
          </div>
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-gray-400 text-sm">Problems Solved</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalSolved}</p>
          </div>
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">For Revision</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRevision}</p>
          </div>
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Streak</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0 days</p>
          </div>
        </div>

        {/* Sheets Grid or Detail View */}
        {!selectedSheet ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSheets.map(sheet => {
              const prog = getSheetProgress(sheet);
              return (
                <div
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet)}
                  className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-all group transition-colors"
                >
                  <div className={`h-2 bg-gradient-to-r ${sheet.color}`}></div>
                  
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl">{sheet.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          {sheet.name}
                        </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">by {sheet.author}</p>
                      </div>
                      <CircularProgress 
                        completed={prog.solved} 
                        total={prog.total}
                        color={sheet.accentColor}
                      />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{sheet.description}</p>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{sheet.totalProblems}</span> problems
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        {sheet.estimatedTime}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>{prog.solved} / {prog.total} solved</span>
                      <span>{Math.round((prog.solved / prog.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-[#1a1a2e] rounded-full overflow-hidden transition-colors">
                      <div 
                        className={`h-full bg-gradient-to-r ${sheet.color} transition-all`}
                        style={{ width: `${(prog.solved / prog.total) * 100}%` }}
                      ></div>
                    </div>

                    <button className="mt-4 w-full bg-white dark:bg-[#1a1a2e] hover:bg-gray-100 dark:hover:bg-[#252538] text-gray-900 dark:text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 transition-colors">
                      View Sheet <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Sheet Detail View - Striver Style Table */
          <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
            <div className={`h-2 bg-gradient-to-r ${selectedSheet.color}`}></div>
            
            {/* Sheet Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 transition-colors">
              <button
                onClick={() => setSelectedSheet(null)}
                className="text-amber-500 hover:text-amber-400 mb-4 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to all sheets
              </button>

              <div className="flex items-start gap-6">
                <div className="text-6xl">{selectedSheet.icon}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedSheet.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">by {selectedSheet.author}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{selectedSheet.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-sm rounded-lg">
                      {selectedSheet.difficulty}
                    </span>
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedSheet.estimatedTime}
                    </span>
                    <a
                      href={selectedSheet.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1"
                    >
                      Original Sheet <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <CircularProgress 
                  completed={getSheetProgress(selectedSheet).solved} 
                  total={getSheetProgress(selectedSheet).total}
                  size={100}
                  color={selectedSheet.accentColor}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'all', label: 'All Problems' },
                { id: 'unsolved', label: 'Unsolved' },
                { id: 'solved', label: 'Solved' },
                { id: 'attempted', label: 'Attempted' },
                { id: 'revision', label: 'Revision' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Topics List with Problem Tables */}
            <div className="divide-y divide-gray-800">
              {selectedSheet.topics.map((topic, topicIndex) => {
                const topicKey = `${selectedSheet.id}-${topicIndex}`;
                const topicProblems = selectedSheet.problemsData?.[topic.name] || [];
                const topicProg = getTopicProgress(selectedSheet.id, topicIndex, topicProblems.length);
                const isExpanded = expandedTopics[topicKey];

                return (
                  <div key={topicKey}>
                    {/* Topic Header */}
                    <div 
                      onClick={() => toggleTopic(topicKey)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 font-mono text-sm w-8">
                          {String(topicIndex + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <span className="text-white font-medium">{topic.name}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            ({topicProblems.length} problems)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">
                            {topicProg.solved}/{topicProg.total}
                          </span>
                          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${selectedSheet.color} transition-all`}
                              style={{ width: `${topicProg.total > 0 ? (topicProg.solved / topicProg.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        {topicProg.solved === topicProg.total && topicProg.total > 0 ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </div>

                    {/* Problems Table */}
                    {isExpanded && topicProblems.length > 0 && (
                      <div className="bg-[#0d0d14] border-t border-gray-800">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800">
                          <div className="col-span-1 text-center">Status</div>
                          <div className="col-span-4">Problem</div>
                          <div className="col-span-1 text-center">Solve</div>
                          <div className="col-span-2 text-center">Resources</div>
                          <div className="col-span-1 text-center">Notes</div>
                          <div className="col-span-1 text-center">Revision</div>
                          <div className="col-span-2 text-center">Difficulty</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-800/50">
                          {topicProblems.map((problem, problemIndex) => {
                            const problemId = getProblemId(selectedSheet.id, topicIndex, problemIndex);
                            const prob = getProblemProgress(selectedSheet.id, problemId);

                            if (!shouldShowProblem(selectedSheet.id, problemId)) return null;

                            return (
                              <div 
                                key={problemIndex}
                                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#16161f]/50 transition-colors group"
                              >
                                {/* Status */}
                                <div className="col-span-1 flex justify-center">
                                  <StatusButton
                                    status={prob.status}
                                    onChange={(status) => updateStatus(selectedSheet.id, problemId, topicIndex, problemIndex, status)}
                                  />
                                </div>

                                {/* Problem Name */}
                                <div className="col-span-4">
                                  <span className={`text-sm ${prob.status === 'solved' ? 'text-gray-400' : 'text-white'}`}>
                                    {problemIndex + 1}. {problem.name}
                                  </span>
                                </div>

                                {/* Solve Link */}
                                <div className="col-span-1 flex justify-center">
                                  <a
                                    href={problem.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-[#1a1a2e] hover:bg-amber-500/20 text-gray-400 hover:text-amber-500 transition-colors"
                                    title="Solve on LeetCode/GFG"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>

                                {/* Resources */}
                                <div className="col-span-2 flex justify-center gap-2">
                                  <button
                                    className="p-1.5 rounded-lg bg-[#1a1a2e] hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Video Solution"
                                  >
                                    <Video className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-1.5 rounded-lg bg-[#1a1a2e] hover:bg-blue-500/20 text-gray-400 hover:text-blue-500 transition-colors"
                                    title="Article/Editorial"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Notes */}
                                <div className="col-span-1 flex justify-center">
                                  <button
                                    onClick={() => setNotesModal({
                                      isOpen: true,
                                      problem,
                                      sheetId: selectedSheet.id,
                                      problemId,
                                      topicIndex,
                                      problemIndex
                                    })}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      prob.notes 
                                        ? 'bg-amber-500/20 text-amber-500' 
                                        : 'bg-[#1a1a2e] text-gray-400 hover:text-amber-500 hover:bg-amber-500/20'
                                    }`}
                                    title={prob.notes ? 'View/Edit Notes' : 'Add Notes'}
                                  >
                                    <StickyNote className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Revision Star */}
                                <div className="col-span-1 flex justify-center">
                                  <button
                                    onClick={() => toggleRevision(selectedSheet.id, problemId, topicIndex, problemIndex)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      prob.revision 
                                        ? 'bg-yellow-500/20 text-yellow-500' 
                                        : 'bg-[#1a1a2e] text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/20'
                                    }`}
                                    title={prob.revision ? 'Remove from Revision' : 'Add to Revision'}
                                  >
                                    <Star className={`w-4 h-4 ${prob.revision ? 'fill-current' : ''}`} />
                                  </button>
                                </div>

                                {/* Difficulty */}
                                <div className="col-span-2 flex justify-center">
                                  <DifficultyBadge difficulty={problem.difficulty} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetsPage;
