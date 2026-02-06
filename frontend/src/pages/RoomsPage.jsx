import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  TrendingUp, 
  Copy, 
  LogOut, 
  Settings,
  X,
  UserPlus,
  Crown,
  Shield,
  Check,
  Search,
  Share2,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import LeaderboardRow from '../components/LeaderboardRow';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RoomsPage = () => {
  const { user: authUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 50
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchLeaderboard();
    }
  }, [selectedRoom, filter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await api.getRooms();
      setRooms(roomsData || []);
      if (roomsData?.length > 0) {
        setSelectedRoom(roomsData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedRoom) return;
    try {
      const data = await api.getRoomLeaderboard(selectedRoom._id || selectedRoom.id, filter);
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) {
      setError('Room name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const createdRoom = await api.createRoom({
        name: newRoom.name,
        description: newRoom.description,
        settings: {
          isPrivate: newRoom.isPrivate,
          maxMembers: newRoom.maxMembers
        }
      });
      
      setRooms(prev => [createdRoom, ...prev]);
      setSelectedRoom(createdRoom);
      setShowCreateModal(false);
      setNewRoom({ name: '', description: '', isPrivate: false, maxMembers: 50 });
    } catch (error) {
      setError(error.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const joinedRoom = await api.joinRoom(inviteCode.toUpperCase());
      setRooms(prev => [joinedRoom, ...prev]);
      setSelectedRoom(joinedRoom);
      setShowJoinModal(false);
      setInviteCode('');
    } catch (error) {
      setError(error.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRoom = async (roomId) => {
    if (!confirm('Are you sure you want to leave this room?')) return;

    try {
      await api.leaveRoom(roomId);
      setRooms(prev => prev.filter(r => (r._id || r.id) !== roomId));
      if ((selectedRoom?._id || selectedRoom?.id) === roomId) {
        setSelectedRoom(rooms.length > 1 ? rooms.find(r => (r._id || r.id) !== roomId) : null);
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;

    try {
      await api.deleteRoom(roomId);
      setRooms(prev => prev.filter(r => (r._id || r.id) !== roomId));
      if ((selectedRoom?._id || selectedRoom?.id) === roomId) {
        setSelectedRoom(rooms.length > 1 ? rooms.find(r => (r._id || r.id) !== roomId) : null);
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const copyInviteCode = () => {
    if (selectedRoom?.inviteCode) {
      navigator.clipboard.writeText(selectedRoom.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMemberRole = (room) => {
    const member = room?.members?.find(m => 
      (m.user?._id || m.user) === (authUser?._id || authUser?.id)
    );
    return member?.role || 'member';
  };

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Societies & Rooms
          </h1>
          <p className="text-gray-400">
            Compete with friends and track team progress
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-[#16161f] hover:bg-[#1a1a2e] border border-gray-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Join Room
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Room
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No rooms yet"
          description="Create or join a room to start competing with others"
          action={
            <div className="flex gap-2">
              <button 
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-[#16161f] hover:bg-[#1a1a2e] border border-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Join Room
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
              >
                Create Your First Room
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Rooms List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-white mb-3">Your Rooms ({rooms.length})</h3>
            {rooms.map((room) => (
              <button
                key={room._id || room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  (selectedRoom?._id || selectedRoom?.id) === (room._id || room.id)
                    ? 'bg-amber-500/20 border-2 border-amber-500'
                    : 'bg-[#16161f] hover:bg-[#1a1a2e] border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-white truncate">
                    {room.name}
                  </div>
                  {getMemberRole(room) === 'owner' && (
                    <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  {getMemberRole(room) === 'admin' && (
                    <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {room.members?.length || room.stats?.totalMembers || 0} members
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {room.settings?.isPrivate ? (
                    <><Lock className="w-3 h-3" /> Private</>
                  ) : (
                    <><Unlock className="w-3 h-3" /> Public</>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-3 space-y-6">
            {selectedRoom && (
              <>
                {/* Room Info */}
                <div className="bg-[#16161f] rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedRoom.name}
                      </h2>
                      <p className="text-gray-400">
                        {selectedRoom.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20">
                        <Users className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-amber-400">
                          {selectedRoom.members?.length || selectedRoom.stats?.totalMembers || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Invite Code & Actions */}
                  <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Invite Code:</span>
                      <code className="px-3 py-1 bg-[#1a1a2e] rounded text-amber-500 font-mono">
                        {selectedRoom.inviteCode}
                      </code>
                      <button
                        onClick={copyInviteCode}
                        className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
                        title="Copy invite code"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex-1" />

                    {getMemberRole(selectedRoom) === 'owner' ? (
                      <button
                        onClick={() => handleDeleteRoom(selectedRoom._id || selectedRoom.id)}
                        className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Room
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeaveRoom(selectedRoom._id || selectedRoom.id)}
                        className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-1 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave Room
                      </button>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 mt-4">
                    {['daily', 'weekly', 'monthly', 'all-time'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === f
                            ? 'bg-amber-500 text-black'
                            : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#252536]'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Members/Leaderboard */}
                <div className="bg-[#16161f] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Room Leaderboard
                  </h3>
                  
                  {leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.map((entry) => (
                        <LeaderboardRow
                          key={entry.rank || entry.user?.username}
                          rank={entry.rank}
                          user={entry.user}
                          totalProblems={entry.totalProblems}
                          weeklyProblems={entry.weeklyProblems}
                          avgRating={entry.avgRating}
                          score={entry.score}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No leaderboard data yet</p>
                      <p className="text-sm mt-2">Members need to link their platforms to appear here</p>
                    </div>
                  )}
                </div>

                {/* Members List */}
                <div className="bg-[#16161f] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Members ({selectedRoom.members?.length || 0})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedRoom.members?.map((member) => (
                      <div 
                        key={member.user?._id || member.user}
                        className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg"
                      >
                        <UserAvatar 
                          user={{ 
                            avatar: member.user?.avatar, 
                            name: member.user?.fullName || member.user?.username 
                          }} 
                          size="md" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {member.user?.fullName || member.user?.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{member.user?.username || 'user'}
                          </div>
                        </div>
                        {member.role === 'owner' && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                        {member.role === 'admin' && (
                          <Shield className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#16161f] rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Room</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., DSA Warriors"
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's your room about?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Members
                </label>
                <select
                  value={newRoom.maxMembers}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value={10}>10 members</option>
                  <option value={25}>25 members</option>
                  <option value={50}>50 members</option>
                  <option value={100}>100 members</option>
                  <option value={200}>200 members</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e]">
                <div>
                  <div className="font-medium text-white">Private Room</div>
                  <div className="text-sm text-gray-500">Only invited members can join</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewRoom(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    newRoom.isPrivate ? 'bg-amber-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      newRoom.isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#252536] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#16161f] rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Join Room</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none font-mono text-center text-lg tracking-widest uppercase"
                  maxLength={8}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Ask the room owner for the invite code
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#252536] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || inviteCode.length < 8}
                  className="flex-1 px-4 py-3 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {joining ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
