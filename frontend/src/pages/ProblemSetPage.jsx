import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  LockClosedIcon,
  GlobeAltIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expert: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
};

const visibilityIcons = {
  public: <GlobeAltIcon className="w-4 h-4 text-green-500" />,
  private: <LockClosedIcon className="w-4 h-4 text-red-500" />,
  unlisted: <LinkIcon className="w-4 h-4 text-yellow-500" />
};

const ProblemSetPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('public');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ difficulty: '', tags: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchProblems();
  }, [activeTab, pagination.page]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      if (activeTab === 'public') {
        const params = { page: pagination.page, limit: 20 };
        if (search) params.search = search;
        if (filters.difficulty) params.difficulty = filters.difficulty;
        if (filters.tags) params.tags = filters.tags;
        
        const response = await api.getPublicProblems(params);
        setProblems(response.data || []);
        setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      } else {
        const response = await api.getMyProblems();
        setProblems(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProblems();
  };

  const handleDelete = async (slug) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    
    try {
      await api.deleteProblem(slug);
      setProblems(prev => prev.filter(p => p.slug !== slug));
    } catch (error) {
      alert(error.message || 'Failed to delete problem');
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Problem Set</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create, manage, and share coding problems with the community
            </p>
          </div>
          
          {user && (
            <button
              onClick={() => navigate('/problem-set/create')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Problem
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('public')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'public'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5" />
              Public Problems
            </div>
            {activeTab === 'public' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
          
          {user && (
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'my'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                My Problems
              </div>
              {activeTab === 'my' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          )}
        </div>

        {/* Search and Filters */}
        {activeTab === 'public' && (
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search problems..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
            
            {showFilters && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={filters.tags}
                      onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., dp, graphs, strings"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Problems List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ChartBarIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {activeTab === 'my' ? 'No problems yet' : 'No problems found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTab === 'my' 
                ? 'Create your first problem to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {user && activeTab === 'my' && (
              <button
                onClick={() => navigate('/problem-set/create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                <PlusIcon className="w-5 h-5" />
                Create Problem
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {problems.map((problem) => (
              <div
                key={problem._id || problem.slug}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {activeTab === 'my' && visibilityIcons[problem.visibility]}
                      <Link
                        to={`/problem-set/${problem.slug}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                      >
                        {problem.problemCode && (
                          <span className="text-gray-500 dark:text-gray-400 mr-2">
                            {problem.problemCode}.
                          </span>
                        )}
                        {problem.title}
                      </Link>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[problem.difficulty]}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {problem.owner && (
                        <span>by @{problem.owner.username || problem.owner}</span>
                      )}
                      <span>{problem.maxScore || 100} pts</span>
                      {problem.stats && (
                        <>
                          <span className="flex items-center gap-1">
                            <CheckCircleIcon className="w-4 h-4" />
                            {problem.stats.acceptedSubmissions || 0} solved
                          </span>
                          {problem.stats.totalSubmissions > 0 && (
                            <span>
                              {Math.round((problem.stats.acceptedSubmissions / problem.stats.totalSubmissions) * 100)}% acceptance
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {problem.tags && problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {problem.tags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 5 && (
                          <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500">
                            +{problem.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/problem-set/${problem.slug}`}
                      className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Problem"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                    
                    {activeTab === 'my' && (
                      <>
                        <Link
                          to={`/problem-set/${problem.slug}/edit`}
                          className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit Problem"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(problem.slug)}
                          className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete Problem"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {activeTab === 'public' && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemSetPage;
