import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trophy, Calendar, Users, Clock, Settings, Search,
  MoreVertical, Edit, Trash2, Eye, PlusCircle, Filter
} from 'lucide-react';
import api from '../services/api';

const ContestAdminPage = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const data = await api.getMyHostedContests();
      setContests(data.data || []);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-400',
      scheduled: 'bg-blue-500/20 text-blue-400',
      live: 'bg-green-500/20 text-green-400 animate-pulse',
      ended: 'bg-amber-500/20 text-amber-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    return styles[status] || styles.draft;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredContests = contests.filter(contest => {
    const matchesSearch = contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contest.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || contest.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteContest = async (slug) => {
    if (!confirm('Are you sure you want to delete this contest? This action cannot be undone.')) return;
    
    try {
      await api.deleteHostedContest(slug);
      fetchContests();
    } catch (error) {
      console.error('Failed to delete contest:', error);
      alert('Failed to delete contest');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="bg-[#0d0d14] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Administration</h1>
              <p className="text-gray-400">Manage your coding contests and challenges</p>
            </div>
            <button
              onClick={() => window.open('/contests/create', '_blank')}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Contest
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-8">
            <button className="px-4 py-2 text-white border-b-2 border-amber-500 font-medium">
              Manage Contests
            </button>
            <button 
              onClick={() => navigate('/problem-set')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Manage Challenges
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Text & Search */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Contests you can edit are below. For more info, visit our FAQ or join our discussion forum.
          </p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Start typing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1a1a24] border border-gray-700 rounded-lg pl-10 pr-4 py-2 w-64 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        {/* Contests Table */}
        {filteredContests.length > 0 ? (
          <div className="bg-[#0d0d14] rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Contest Name</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Contest Slug</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Contest Owner</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Start Date</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium">Signups</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium">Participants</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContests.map((contest) => (
                  <tr key={contest._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium hover:text-amber-500 cursor-pointer"
                            onClick={() => navigate(`/contests/${contest.slug}/edit`)}>
                        {contest.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{contest.slug}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {contest.owner?.username || contest.owner?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(contest.startTime)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(contest.status)}`}>
                        {contest.status?.charAt(0).toUpperCase() + contest.status?.slice(1)}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 text-gray-400">{contest.signups?.length || 0}</td>
                    <td className="text-center px-6 py-4 text-gray-400">{contest.statistics?.totalParticipants || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/contests/${contest.slug}/edit`)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => window.open(`/contest/${contest.slug}`, '_blank')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteContest(contest.slug)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#0d0d14] rounded-xl border border-gray-800 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Contests Yet</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'No contests match your search criteria'
                : 'Create your first coding contest and start hosting!'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/contests/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Create Your First Contest
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestAdminPage;
