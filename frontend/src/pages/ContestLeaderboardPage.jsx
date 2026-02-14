import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, Medal, Clock, Loader2, RefreshCw, Filter, Search
} from 'lucide-react';
import api from '../services/api';

const ContestLeaderboardPage = () => {
  const { contestSlug } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [problems, setProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [contestSlug, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contestData, leaderboardData, problemsData] = await Promise.all([
        api.getHostedContest(contestSlug),
        api.getContestLeaderboard(contestSlug, page, 50),
        api.getContestProblems(contestSlug)
      ]);
      
      setContest(contestData.data);
      setLeaderboard(leaderboardData.data || []);
      setTotalPages(leaderboardData.totalPages || 1);
      setProblems(problemsData.data || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPenalty = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return rank;
  };

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex items-center justify-center transition-colors">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <div className="bg-[#0d0d14] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link 
            to={`/contest/${contestSlug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contest
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{contest?.name} - Leaderboard</h1>
              <p className="text-gray-400 mt-1">
                {leaderboard.length} participants • Format: {contest?.contestFormat?.toUpperCase()}
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participants..."
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#0d0d14] rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a1a24]">
                  <th className="text-left py-4 px-4 font-medium text-gray-400 w-16">#</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-400">Participant</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-400 w-24">Score</th>
                  {contest?.contestFormat === 'icpc' && (
                    <th className="text-center py-4 px-4 font-medium text-gray-400 w-24">Penalty</th>
                  )}
                  {/* Problem columns */}
                  {problems.map(problem => (
                    <th 
                      key={problem._id}
                      className="text-center py-4 px-2 font-medium text-gray-400 w-16"
                      title={problem.title}
                    >
                      {problem.problemCode}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((entry, index) => (
                  <tr 
                    key={entry._id || index}
                    className={`border-t border-gray-800 hover:bg-gray-800/30 ${
                      index < 3 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(entry.rank || index + 1)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-sm">
                          {entry.user?.name?.[0] || entry.user?.username?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{entry.user?.username || 'Anonymous'}</p>
                          {entry.user?.name && entry.user.name !== entry.user?.username && (
                            <p className="text-sm text-gray-500">{entry.user.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xl font-bold text-amber-500">{entry.totalScore || 0}</span>
                    </td>
                    {contest?.contestFormat === 'icpc' && (
                      <td className="py-4 px-4 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatPenalty(entry.totalPenalty)}
                        </div>
                      </td>
                    )}
                    {/* Problem cells */}
                    {problems.map(problem => {
                      const problemResult = entry.problemResults?.find(
                        pr => pr.problem === problem._id || pr.problem?._id === problem._id
                      );
                      
                      return (
                        <td key={problem._id} className="py-4 px-2 text-center">
                          {problemResult ? (
                            <div className={`inline-flex flex-col items-center ${
                              problemResult.solved ? 'text-green-500' : 
                              problemResult.attempts > 0 ? 'text-red-400' : ''
                            }`}>
                              <span className="font-medium">
                                {problemResult.solved ? problemResult.score || '+' : `-${problemResult.attempts}`}
                              </span>
                              {problemResult.solved && contest?.contestFormat === 'icpc' && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(problemResult.solveTime)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No participants found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 p-4 bg-[#0d0d14] rounded-lg border border-gray-800">
          <h3 className="font-medium mb-3">Legend</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-gray-400">Solved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-gray-400">Wrong attempts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded" />
              <span className="text-gray-400">Not attempted</span>
            </div>
            {contest?.contestFormat === 'icpc' && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Penalty time (ICPC)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestLeaderboardPage;
