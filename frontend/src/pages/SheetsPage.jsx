import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  Check,
  Circle,
  ExternalLink,
  Search,
  Filter,
  TrendingUp,
  Award,
  Clock,
  Target,
  CheckCircle2,
  CircleDot
} from 'lucide-react';
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
    icon: '🔥',
    topics: [
      { name: 'Learn the Basics', problems: 31, completed: 0 },
      { name: 'Sorting', problems: 7, completed: 0 },
      { name: 'Arrays', problems: 40, completed: 0 },
      { name: 'Binary Search', problems: 32, completed: 0 },
      { name: 'Strings', problems: 15, completed: 0 },
      { name: 'Linked List', problems: 31, completed: 0 },
      { name: 'Recursion', problems: 25, completed: 0 },
      { name: 'Bit Manipulation', problems: 18, completed: 0 },
      { name: 'Stack & Queue', problems: 30, completed: 0 },
      { name: 'Sliding Window', problems: 12, completed: 0 },
      { name: 'Heaps', problems: 17, completed: 0 },
      { name: 'Greedy', problems: 16, completed: 0 },
      { name: 'Binary Trees', problems: 45, completed: 0 },
      { name: 'BST', problems: 16, completed: 0 },
      { name: 'Graphs', problems: 54, completed: 0 },
      { name: 'Dynamic Programming', problems: 56, completed: 0 },
      { name: 'Tries', problems: 7, completed: 0 },
      { name: 'Strings Advanced', problems: 8, completed: 0 }
    ],
    link: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2'
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
    icon: '💼',
    topics: [
      { name: 'Arrays', problems: 18, completed: 0 },
      { name: 'Arrays Part II', problems: 6, completed: 0 },
      { name: 'Arrays Part III', problems: 6, completed: 0 },
      { name: 'Arrays Part IV', problems: 6, completed: 0 },
      { name: 'Linked List', problems: 11, completed: 0 },
      { name: 'Linked List Part II', problems: 6, completed: 0 },
      { name: 'Linked List & Arrays', problems: 6, completed: 0 },
      { name: 'Greedy Algorithm', problems: 6, completed: 0 },
      { name: 'Recursion', problems: 6, completed: 0 },
      { name: 'Recursion & Backtracking', problems: 6, completed: 0 },
      { name: 'Binary Search', problems: 11, completed: 0 },
      { name: 'Heaps', problems: 6, completed: 0 },
      { name: 'Stack and Queue', problems: 7, completed: 0 },
      { name: 'Stack and Queue Part II', problems: 7, completed: 0 },
      { name: 'Strings', problems: 6, completed: 0 },
      { name: 'Strings Part II', problems: 5, completed: 0 },
      { name: 'Binary Tree', problems: 13, completed: 0 },
      { name: 'Binary Tree Part II', problems: 10, completed: 0 },
      { name: 'Binary Tree Part III', problems: 8, completed: 0 },
      { name: 'BST', problems: 11, completed: 0 },
      { name: 'BST Part II', problems: 5, completed: 0 },
      { name: 'Binary Trees Misc', problems: 6, completed: 0 },
      { name: 'Graphs', problems: 13, completed: 0 },
      { name: 'Graphs Part II', problems: 8, completed: 0 },
      { name: 'Dynamic Programming', problems: 7, completed: 0 },
      { name: 'DP Part II', problems: 9, completed: 0 },
      { name: 'Trie', problems: 4, completed: 0 }
    ],
    link: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems'
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
    icon: '🎯',
    topics: [
      { name: 'Arrays & Hashing', problems: 9, completed: 0 },
      { name: 'Two Pointers', problems: 5, completed: 0 },
      { name: 'Sliding Window', problems: 6, completed: 0 },
      { name: 'Stack', problems: 7, completed: 0 },
      { name: 'Binary Search', problems: 7, completed: 0 },
      { name: 'Linked List', problems: 11, completed: 0 },
      { name: 'Trees', problems: 15, completed: 0 },
      { name: 'Tries', problems: 3, completed: 0 },
      { name: 'Heap / Priority Queue', problems: 7, completed: 0 },
      { name: 'Backtracking', problems: 9, completed: 0 },
      { name: 'Graphs', problems: 13, completed: 0 },
      { name: 'Advanced Graphs', problems: 6, completed: 0 },
      { name: '1-D DP', problems: 12, completed: 0 },
      { name: '2-D DP', problems: 11, completed: 0 },
      { name: 'Greedy', problems: 8, completed: 0 },
      { name: 'Intervals', problems: 6, completed: 0 },
      { name: 'Math & Geometry', problems: 8, completed: 0 },
      { name: 'Bit Manipulation', problems: 7, completed: 0 }
    ],
    link: 'https://neetcode.io/practice'
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
    icon: '👁️',
    topics: [
      { name: 'Array', problems: 11, completed: 0 },
      { name: 'Binary', problems: 5, completed: 0 },
      { name: 'Dynamic Programming', problems: 11, completed: 0 },
      { name: 'Graph', problems: 8, completed: 0 },
      { name: 'Interval', problems: 5, completed: 0 },
      { name: 'Linked List', problems: 6, completed: 0 },
      { name: 'Matrix', problems: 4, completed: 0 },
      { name: 'String', problems: 10, completed: 0 },
      { name: 'Tree', problems: 14, completed: 0 },
      { name: 'Heap', problems: 1, completed: 0 }
    ],
    link: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions'
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
    icon: '💛',
    topics: [
      { name: 'Arrays', problems: 36, completed: 0 },
      { name: 'Matrix', problems: 10, completed: 0 },
      { name: 'Strings', problems: 43, completed: 0 },
      { name: 'Searching & Sorting', problems: 36, completed: 0 },
      { name: 'Linked List', problems: 36, completed: 0 },
      { name: 'Bit Manipulation', problems: 10, completed: 0 },
      { name: 'Greedy', problems: 35, completed: 0 },
      { name: 'Backtracking', problems: 17, completed: 0 },
      { name: 'Dynamic Programming', problems: 60, completed: 0 },
      { name: 'Stacks & Queues', problems: 38, completed: 0 },
      { name: 'Binary Trees', problems: 35, completed: 0 },
      { name: 'BST', problems: 22, completed: 0 },
      { name: 'Graphs', problems: 44, completed: 0 },
      { name: 'Heap', problems: 18, completed: 0 },
      { name: 'Trie', problems: 6, completed: 0 },
      { name: 'Segment Trees', problems: 4, completed: 0 }
    ],
    link: 'https://450dsa.com/'
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
    icon: '🚀',
    topics: [
      { name: 'Arrays', problems: 25, completed: 0 },
      { name: 'Strings', problems: 20, completed: 0 },
      { name: 'Linked List', problems: 18, completed: 0 },
      { name: 'Stack & Queue', problems: 22, completed: 0 },
      { name: 'Binary Trees', problems: 30, completed: 0 },
      { name: 'BST', problems: 15, completed: 0 },
      { name: 'Graphs', problems: 35, completed: 0 },
      { name: 'DP', problems: 40, completed: 0 },
      { name: 'Binary Search', problems: 15, completed: 0 },
      { name: 'Two Pointers', problems: 12, completed: 0 },
      { name: 'Recursion & Backtracking', problems: 18, completed: 0 }
    ],
    link: 'https://docs.google.com/spreadsheets/d/1-wKcV99KtO91dXdPkwmXGTdtyxAfk1mbPXQg81R9sFE'
  }
];

// Circular Progress for sheet completion
const SheetProgress = ({ completed, total, size = 60, color }) => {
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
        <span className="text-sm font-bold text-white">{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

const SheetsPage = () => {
  const [sheets, setSheets] = useState(dsaSheets);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [expandedTopics, setExpandedTopics] = useState({});

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('sheetProgress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setSheets(prevSheets => prevSheets.map(sheet => ({
          ...sheet,
          topics: sheet.topics.map(topic => ({
            ...topic,
            completed: progress[sheet.id]?.[topic.name] || 0
          }))
        })));
      } catch (e) {
        console.error('Error loading sheet progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (sheetId, topicName, completed) => {
    const savedProgress = JSON.parse(localStorage.getItem('sheetProgress') || '{}');
    if (!savedProgress[sheetId]) savedProgress[sheetId] = {};
    savedProgress[sheetId][topicName] = completed;
    localStorage.setItem('sheetProgress', JSON.stringify(savedProgress));
  };

  const updateTopicProgress = (sheetId, topicName, delta) => {
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      return {
        ...sheet,
        topics: sheet.topics.map(topic => {
          if (topic.name !== topicName) return topic;
          const newCompleted = Math.max(0, Math.min(topic.problems, topic.completed + delta));
          saveProgress(sheetId, topicName, newCompleted);
          return { ...topic, completed: newCompleted };
        })
      };
    }));
  };

  const getSheetProgress = (sheet) => {
    const completed = sheet.topics.reduce((sum, t) => sum + t.completed, 0);
    return { completed, total: sheet.totalProblems };
  };

  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sheet.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || 
                             sheet.difficulty.toLowerCase().includes(filterDifficulty.toLowerCase());
    return matchesSearch && matchesDifficulty;
  });

  const toggleTopic = (topicName) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white p-6">
      <div className="max-w-7xl mx-auto">
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
              className="w-full bg-[#16161f] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-[#16161f] border border-gray-700 rounded-lg pl-10 pr-8 py-3 text-white appearance-none focus:outline-none focus:border-amber-500"
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
          <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-amber-500" />
              <span className="text-gray-400 text-sm">Total Sheets</span>
            </div>
            <p className="text-3xl font-bold text-white">{sheets.length}</p>
          </div>
          <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-gray-400 text-sm">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {sheets.filter(s => getSheetProgress(s).completed > 0).length}
            </p>
          </div>
          <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-gray-400 text-sm">Completed</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {sheets.filter(s => getSheetProgress(s).completed === s.totalProblems).length}
            </p>
          </div>
          <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400 text-sm">Problems Solved</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {sheets.reduce((sum, s) => sum + getSheetProgress(s).completed, 0)}
            </p>
          </div>
        </div>

        {/* Sheets Grid or Detail View */}
        {!selectedSheet ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSheets.map(sheet => {
              const progress = getSheetProgress(sheet);
              return (
                <div
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet)}
                  className="bg-[#16161f] rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-gray-600 transition-all group"
                >
                  {/* Gradient Header */}
                  <div className={`h-2 bg-gradient-to-r ${sheet.color}`}></div>
                  
                  <div className="p-6">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl">{sheet.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-amber-500 transition-colors">
                          {sheet.name}
                        </h3>
                        <p className="text-sm text-gray-400">by {sheet.author}</p>
                      </div>
                      <SheetProgress 
                        completed={progress.completed} 
                        total={progress.total}
                        color={sheet.color.includes('red') ? '#ef4444' : 
                               sheet.color.includes('purple') ? '#a855f7' :
                               sheet.color.includes('green') ? '#22c55e' :
                               sheet.color.includes('blue') ? '#3b82f6' :
                               '#f59e0b'}
                      />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{sheet.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="font-semibold text-white">{sheet.totalProblems}</span> problems
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        {sheet.estimatedTime}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{progress.completed} / {progress.total} solved</span>
                        <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${sheet.color} transition-all`}
                          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* View Button */}
                    <button className="mt-4 w-full bg-[#1a1a2e] hover:bg-[#252538] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      View Sheet <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Sheet Detail View */
          <div className="bg-[#16161f] rounded-xl border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className={`h-2 bg-gradient-to-r ${selectedSheet.color}`}></div>
            <div className="p-6">
              <button
                onClick={() => setSelectedSheet(null)}
                className="text-amber-500 hover:text-amber-400 mb-4 flex items-center gap-1"
              >
                ← Back to all sheets
              </button>

              <div className="flex items-start gap-6 mb-6">
                <div className="text-6xl">{selectedSheet.icon}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedSheet.name}</h2>
                  <p className="text-gray-400 mb-2">by {selectedSheet.author}</p>
                  <p className="text-gray-400 text-sm mb-4">{selectedSheet.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-sm rounded-lg">
                      {selectedSheet.difficulty}
                    </span>
                    <span className="text-sm text-gray-400">
                      <Clock className="w-4 h-4 inline mr-1" />
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
                <SheetProgress 
                  completed={getSheetProgress(selectedSheet).completed} 
                  total={getSheetProgress(selectedSheet).total}
                  size={100}
                />
              </div>

              {/* Topics List */}
              <div className="space-y-3">
                {selectedSheet.topics.map((topic, index) => (
                  <div key={topic.name} className="bg-[#1a1a2e] rounded-lg overflow-hidden">
                    <div 
                      onClick={() => toggleTopic(topic.name)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#252538] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-sm w-8">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-white font-medium">{topic.name}</span>
                        <span className="text-sm text-gray-400">({topic.problems} problems)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{topic.completed}/{topic.problems}</span>
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${selectedSheet.color} transition-all`}
                              style={{ width: `${(topic.completed / topic.problems) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        {topic.completed === topic.problems ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedTopics[topic.name] ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </div>
                    {expandedTopics[topic.name] && (
                      <div className="p-4 pt-0 border-t border-gray-700">
                        {/* Real Problems List */}
                        {selectedSheet.id === 'striver-a2z' && striverA2ZProblems[topic.name] && (
                          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                            {striverA2ZProblems[topic.name].map((problem, idx) => {
                              const isCompleted = idx < topic.completed;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-[#16161f] rounded-lg hover:bg-[#252538] transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicProgress(selectedSheet.id, topic.name, isCompleted ? -1 : 1);
                                      }}
                                      className="transition-all"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                      {problem.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedSheet.id === 'neetcode-150' && neetcode150Problems[topic.name] && (
                          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                            {neetcode150Problems[topic.name].map((problem, idx) => {
                              const isCompleted = idx < topic.completed;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-[#16161f] rounded-lg hover:bg-[#252538] transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicProgress(selectedSheet.id, topic.name, isCompleted ? -1 : 1);
                                      }}
                                      className="transition-all"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                      {problem.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedSheet.id === 'blind-75' && blind75Problems[topic.name] && (
                          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                            {blind75Problems[topic.name].map((problem, idx) => {
                              const isCompleted = idx < topic.completed;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-[#16161f] rounded-lg hover:bg-[#252538] transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicProgress(selectedSheet.id, topic.name, isCompleted ? -1 : 1);
                                      }}
                                      className="transition-all"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                      {problem.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedSheet.id === 'striver-sde' && striverSDEProblems[topic.name] && (
                          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                            {striverSDEProblems[topic.name].map((problem, idx) => {
                              const isCompleted = idx < topic.completed;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-[#16161f] rounded-lg hover:bg-[#252538] transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicProgress(selectedSheet.id, topic.name, isCompleted ? -1 : 1);
                                      }}
                                      className="transition-all"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                      {problem.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedSheet.id === 'love-babbar' && loveBabbarProblems[topic.name] && (
                          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                            {loveBabbarProblems[topic.name].map((problem, idx) => {
                              const isCompleted = idx < topic.completed;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-[#16161f] rounded-lg hover:bg-[#252538] transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicProgress(selectedSheet.id, topic.name, isCompleted ? -1 : 1);
                                      }}
                                      className="transition-all"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                      {problem.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedSheet.id === 'fraz-sde' && frazSdeProblems[topic.name] && (
                          <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                            {frazSdeProblems[topic.name].map((problem, idx) => {
                              const isCompleted = idx < topic.completed;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-[#16161f] rounded-lg hover:bg-[#252538] transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicProgress(selectedSheet.id, topic.name, isCompleted ? -1 : 1);
                                      }}
                                      className="transition-all"
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                      {problem.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <a
                                      href={problem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400">Track your progress for this topic</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateTopicProgress(selectedSheet.id, topic.name, -1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white"
                            >
                              -
                            </button>
                            <span className="text-white font-semibold w-12 text-center">{topic.completed}</span>
                            <button
                              onClick={() => updateTopicProgress(selectedSheet.id, topic.name, 1)}
                              className="w-8 h-8 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center justify-center text-black"
                            >
                              +
                            </button>
                            <button
                              onClick={() => {
                                const newCompleted = topic.completed === topic.problems ? 0 : topic.problems;
                                setSheets(prevSheets => prevSheets.map(sheet => {
                                  if (sheet.id !== selectedSheet.id) return sheet;
                                  return {
                                    ...sheet,
                                    topics: sheet.topics.map(t => {
                                      if (t.name !== topic.name) return t;
                                      saveProgress(selectedSheet.id, topic.name, newCompleted);
                                      return { ...t, completed: newCompleted };
                                    })
                                  };
                                }));
                              }}
                              className="ml-2 px-3 py-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg text-sm"
                            >
                              {topic.completed === topic.problems ? 'Reset' : 'Complete All'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetsPage;
