import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  GitCommit,
  Loader2,
  Link as LinkIcon,
  RefreshCw,
  Swords,
  Trophy,
  UserRound
} from 'lucide-react';
import api from '../services/api';
import { PlatformIcon, getPlatformConfig, getPlatformName } from '../utils/platformConfig';

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const StatCard = ({ icon: Icon, label, value, subtext, colorClass = 'text-amber-500' }) => (
  <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <Icon className={`w-4 h-4 ${colorClass}`} />
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    {subtext && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</div>}
  </div>
);

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const connectedPlatforms = useMemo(() => {
    return Object.entries(profile?.user?.platforms || {}).filter(([, handle]) => Boolean(handle));
  }, [profile]);

  const githubStats = useMemo(() => {
    return profile?.platformStats?.find((entry) => entry.platform === 'github')?.stats || {};
  }, [profile]);

  const githubContributions =
    githubStats.totalContributions ||
    githubStats.allTimeContributions ||
    profile?.stats?.totalCommits ||
    0;

  const displayName = profile?.user?.fullName || profile?.user?.username || 'User Profile';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-2xl p-8 text-center">
          <UserRound className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Profile unavailable</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || 'This user profile could not be loaded.'}</p>
          <button
            onClick={loadProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {profile.user?.avatar ? (
            <img
              src={profile.user.avatar}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-amber-500/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">@{profile.user?.username}</div>
            {profile.user?.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-3xl">{profile.user.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(profile.user?.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Last synced {formatDate(profile.user?.lastSynced)}
              </span>
              {profile.user?.institution && <span>{profile.user.institution}</span>}
              {profile.user?.country && <span>{profile.user.country}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Problems Solved" value={profile.stats?.totalProblems || 0} colorClass="text-amber-500" />
        <StatCard
          icon={GitCommit}
          label="GitHub Contributions"
          value={githubContributions}
          colorClass="text-gray-400"
        />
        <StatCard icon={Swords} label="Average Rating" value={profile.stats?.averageRating || 0} colorClass="text-blue-500" />
        <StatCard icon={LinkIcon} label="Connected Platforms" value={profile.stats?.platformsConnected || 0} subtext={`${connectedPlatforms.length} IDs visible`} colorClass="text-green-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Platform IDs</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">All linked handles</span>
            </div>

            {connectedPlatforms.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No platform IDs linked yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedPlatforms.map(([platform, handle]) => {
                  const platformConfig = getPlatformConfig(platform);
                  const profileUrl = platformConfig?.url?.(handle);

                  return (
                    <div
                      key={platform}
                      className="border border-gray-200 dark:border-gray-800/50 rounded-xl p-4 bg-gray-50 dark:bg-[#111118]"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <PlatformIcon platform={platform} className="w-5 h-5" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{getPlatformName(platform)}</span>
                        </div>
                        {profileUrl && (
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-amber-500 transition-colors"
                            title={`Open ${getPlatformName(platform)} profile`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm font-mono break-all text-amber-600 dark:text-amber-400">{handle}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Performance</h2>
            {profile.platformStats?.length ? (
              <div className="space-y-4">
                {profile.platformStats.map((entry) => {
                  const stats = entry.stats || {};
                  const solved = stats.problemsSolved || stats.totalSolved || 0;
                  const rating = stats.rating || 0;
                  const commits = stats.totalCommits || 0;
                  const contests = stats.contestsParticipated || 0;

                  return (
                    <div
                      key={entry.platform}
                      className="border border-gray-200 dark:border-gray-800/50 rounded-xl p-4 bg-gray-50 dark:bg-[#111118]"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <PlatformIcon platform={entry.platform} className="w-5 h-5" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{getPlatformName(entry.platform)}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Updated {formatDate(entry.lastFetched)}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Solved</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{solved}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{rating}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Contests</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{contests}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Commits</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{commits}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No platform stats available yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            {profile.recentActivity?.length ? (
              <div className="space-y-3">
                {profile.recentActivity.map((day) => (
                  <div key={day._id} className="border border-gray-200 dark:border-gray-800/50 rounded-xl p-3 bg-gray-50 dark:bg-[#111118]">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{formatDate(day.date)}</div>
                    {/** Show per-day deltas first; fallback to totals for older records */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Problems</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {typeof day.changes?.problemsDelta === 'number'
                            ? day.changes.problemsDelta
                            : (day.aggregatedStats?.totalProblemsSolved || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Commits</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {typeof day.changes?.commitsDelta === 'number'
                            ? day.changes.commitsDelta
                            : (day.aggregatedStats?.totalCommits || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Contests</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{day.aggregatedStats?.totalContests || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{day.aggregatedStats?.averageRating || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No recent activity available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;