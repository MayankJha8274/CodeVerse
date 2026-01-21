import React, { useState, useEffect } from 'react';
import { Users, Plus, TrendingUp } from 'lucide-react';
import LeaderboardRow from '../components/LeaderboardRow';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsData = await api.getRooms();
        setRooms(roomsData);
        if (roomsData.length > 0) {
          setSelectedRoom(roomsData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const fetchLeaderboard = async () => {
        try {
          const data = await api.getRoomLeaderboard(selectedRoom.id, filter);
          setLeaderboard(data);
        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
        }
      };

      fetchLeaderboard();
    }
  }, [selectedRoom, filter]);

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Societies & Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compete with friends and track team progress
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No rooms yet"
          description="Create or join a room to start competing with others"
          action={
            <button className="btn-primary">
              Create Your First Room
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Rooms List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Rooms</h3>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                    : 'card hover:shadow-md'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {room.name}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {room.members} members
                </div>
                <div className="text-xs text-gray-400">
                  {room.isPublic ? 'Public' : 'Private'}
                </div>
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-3 space-y-6">
            {selectedRoom && (
              <>
                {/* Room Info */}
                <div className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedRoom.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedRoom.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                      <Users className="w-5 h-5 text-primary-500" />
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {selectedRoom.members}
                      </span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly', 'all-time'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === f
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <LeaderboardRow
                        key={entry.rank}
                        rank={entry.rank}
                        user={entry.user}
                        totalProblems={entry.totalProblems}
                        weeklyProblems={entry.weeklyProblems}
                        avgRating={entry.avgRating}
                        score={entry.score}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
