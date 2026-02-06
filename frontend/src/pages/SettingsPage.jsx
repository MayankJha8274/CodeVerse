import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Eye, EyeOff, CheckCircle, Camera, Upload, AlertCircle } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SettingsPage = () => {
  const { user: authUser, login: updateAuthUser } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  const [user, setUser] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    institution: '',
    country: '',
    avatar: ''
  });

  const [platforms, setPlatforms] = useState({
    leetcode: '',
    codeforces: '',
    codechef: '',
    github: '',
    geeksforgeeks: '',
    hackerrank: ''
  });

  const [settings, setSettings] = useState({
    publicProfile: true,
    showEmail: false,
    emailNotifications: true,
    weeklyDigest: true,
    roomInvites: true
  });

  // Load user data from AuthContext
  useEffect(() => {
    if (authUser) {
      setUser({
        name: authUser.name || authUser.fullName || '',
        username: authUser.username || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        location: authUser.location || '',
        institution: authUser.institution || '',
        country: authUser.country || 'IN',
        avatar: authUser.avatar || authUser.avatarUrl || ''
      });
      
      // Load platform usernames if available
      if (authUser.platforms) {
        setPlatforms({
          leetcode: authUser.platforms.leetcode?.username || authUser.platforms.leetcode || '',
          codeforces: authUser.platforms.codeforces?.username || authUser.platforms.codeforces || '',
          codechef: authUser.platforms.codechef?.username || authUser.platforms.codechef || '',
          github: authUser.platforms.github?.username || authUser.platforms.github || '',
          geeksforgeeks: authUser.platforms.geeksforgeeks?.username || authUser.platforms.geeksforgeeks || '',
          hackerrank: authUser.platforms.hackerrank?.username || authUser.platforms.hackerrank || ''
        });
      }
    }
  }, [authUser]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const result = await api.uploadAvatar(file);
      setUser(prev => ({ ...prev, avatar: result.avatar }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
    setError(null);
    
    try {
      const response = await api.updateUser({ 
        ...user, 
        fullName: user.name,
        platforms, 
        settings 
      });
      
      // Update auth context with new user data
      if (response && updateAuthUser) {
        // Refresh user data
        const userData = await api.getUser();
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError(error.message || 'Failed to save settings');
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
        <h1 className="text-3xl font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-400">
          Manage your profile and platform connections
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-[#16161f] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Profile Information
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <UserAvatar user={{ avatar: user.avatar, name: user.name }} size="2xl" />
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 p-2 bg-amber-500 hover:bg-amber-600 rounded-full text-black transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <button 
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg mb-2 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploadingAvatar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Change Avatar
                </>
              )}
            </button>
            <p className="text-sm text-gray-500">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleUserChange}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={user.username}
                onChange={handleUserChange}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleUserChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={user.bio}
              onChange={handleUserChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={user.location}
              onChange={handleUserChange}
              placeholder="e.g., Mumbai, India"
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Institution / College
              </label>
              <input
                type="text"
                name="institution"
                value={user.institution}
                onChange={handleUserChange}
                placeholder="e.g., IIT Delhi"
                className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country
              </label>
              <select
                name="country"
                value={user.country}
                onChange={handleUserChange}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="SG">Singapore</option>
                <option value="JP">Japan</option>
                <option value="CN">China</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="bg-[#16161f] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Platform Connections
        </h2>

        <div className="space-y-4">
          {Object.entries(platforms).map(([platform, username]) => (
            <div key={platform} className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="text"
                  name={platform}
                  value={username}
                  onChange={handlePlatformChange}
                  placeholder={`Your ${platform} username`}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a2e] text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={() => handleRefresh(platform)}
                disabled={refreshing === platform}
                className="mt-7 p-3 rounded-lg hover:bg-[#1a1a2e] text-gray-400 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing === platform ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Notifications */}
      <div className="bg-[#16161f] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Privacy & Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e]">
            <div className="flex items-center gap-3">
              {settings.publicProfile ? (
                <Eye className="w-5 h-5 text-gray-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div className="font-medium text-white">Public Profile</div>
                <div className="text-sm text-gray-500">Allow others to view your profile</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('publicProfile')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.publicProfile ? 'bg-amber-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e]">
            <div>
              <div className="font-medium text-white">Show Email</div>
              <div className="text-sm text-gray-500">Display email on public profile</div>
            </div>
            <button
              onClick={() => handleSettingChange('showEmail')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showEmail ? 'bg-amber-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e]">
            <div>
              <div className="font-medium text-white">Email Notifications</div>
              <div className="text-sm text-gray-500">Receive updates via email</div>
            </div>
            <button
              onClick={() => handleSettingChange('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-amber-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e]">
            <div>
              <div className="font-medium text-white">Weekly Digest</div>
              <div className="text-sm text-gray-500">Get weekly progress summary</div>
            </div>
            <button
              onClick={() => handleSettingChange('weeklyDigest')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.weeklyDigest ? 'bg-amber-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e]">
            <div>
              <div className="font-medium text-white">Room Invites</div>
              <div className="text-sm text-gray-500">Allow others to invite you to rooms</div>
            </div>
            <button
              onClick={() => handleSettingChange('roomInvites')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.roomInvites ? 'bg-amber-500' : 'bg-gray-600'
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
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
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
