import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import api from '../services/api';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  const [user, setUser] = useState({
    name: 'Alex Johnson',
    username: 'alexj',
    email: 'alex@codeverse.com',
    bio: 'Passionate competitive programmer | Full Stack Developer',
    location: 'San Francisco, CA',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  });

  const [platforms, setPlatforms] = useState({
    leetcode: 'alexj_codes',
    codeforces: 'alex_cf',
    codechef: 'alexj',
    github: 'alexjohnson',
    geeksforgeeks: 'alexj',
    hackerrank: 'alexj'
  });

  const [settings, setSettings] = useState({
    publicProfile: true,
    showEmail: false,
    emailNotifications: true,
    weeklyDigest: true,
    roomInvites: true
  });

  const handleUserChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const handlePlatformChange = (e) => {
    setPlatforms({
      ...platforms,
      [e.target.name]: e.target.value
    });
  };

  const handleSettingChange = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    
    try {
      await api.updateUser({ ...user, platforms, settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (platform) => {
    setRefreshing(platform);
    
    try {
      await api.refreshData(platform);
    } catch (error) {
      console.error(`Failed to refresh ${platform} data:`, error);
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile and platform connections
        </p>
      </div>

      {/* Profile Information */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Profile Information
        </h2>

        <div className="flex items-center gap-6 mb-6">
          <UserAvatar user={user} size="2xl" />
          <div>
            <button className="btn-primary mb-2">
              Change Avatar
            </button>
            <p className="text-sm text-gray-500">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleUserChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={user.username}
                onChange={handleUserChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleUserChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={user.bio}
              onChange={handleUserChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={user.location}
              onChange={handleUserChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Platform Connections
        </h2>

        <div className="space-y-4">
          {Object.entries(platforms).map(([platform, username]) => (
            <div key={platform} className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="text"
                  name={platform}
                  value={username}
                  onChange={handlePlatformChange}
                  placeholder={`Your ${platform} username`}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={() => handleRefresh(platform)}
                disabled={refreshing === platform}
                className="mt-7 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing === platform ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Notifications */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Privacy & Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
            <div className="flex items-center gap-3">
              {settings.publicProfile ? (
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Public Profile</div>
                <div className="text-sm text-gray-500">Allow others to view your profile</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('publicProfile')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.publicProfile ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Show Email</div>
              <div className="text-sm text-gray-500">Display email on public profile</div>
            </div>
            <button
              onClick={() => handleSettingChange('showEmail')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showEmail ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
              <div className="text-sm text-gray-500">Receive updates via email</div>
            </div>
            <button
              onClick={() => handleSettingChange('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Weekly Digest</div>
              <div className="text-sm text-gray-500">Get weekly progress summary</div>
            </div>
            <button
              onClick={() => handleSettingChange('weeklyDigest')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.weeklyDigest ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Room Invites</div>
              <div className="text-sm text-gray-500">Allow others to invite you to rooms</div>
            </div>
            <button
              onClick={() => handleSettingChange('roomInvites')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.roomInvites ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.roomInvites ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Changes saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
