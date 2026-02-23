import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Camera, Upload, AlertCircle, CheckCircle, X, Edit } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SettingsPage = () => {
  const { user: authUser, updateUserData } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [user, setUser] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    institution: '',
    degree: '',
    branch: '',
    graduationYear: '',
    country: 'IN',
    avatar: ''
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (authUser) {
      // Clear any previous errors when authUser loads
      setError(null);
      
      const full = authUser.fullName || authUser.name || '';
      const parts = full.trim().split(/\s+/);
      setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
      setLastName(parts.slice(-1).join(' ') || '');

      setUser(prev => ({
        ...prev,
        name: full,
        username: authUser.username || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        location: authUser.location || '',
        institution: authUser.institution || '',
        degree: authUser.degree || '',
        branch: authUser.branch || '',
        graduationYear: authUser.graduationYear || '',
        country: authUser.country || 'IN',
        avatar: authUser.avatar || authUser.avatarUrl || ''
      }));
    }
  }, [authUser]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please upload an image file');
    if (file.size > 2 * 1024 * 1024) return setError('Image must be less than 2MB');

    setUploadingAvatar(true);
    setError(null);
    try {
      const result = await api.uploadAvatar(file);
      const newAvatar = result.avatar;
      setUser(prev => ({ ...prev, avatar: newAvatar }));
      // Update auth context so avatar shows everywhere (merge only avatar)
      updateUserData({ avatar: newAvatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.avatar) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      // Use profile endpoint which handles avatar field
      const updated = await api.updateProfile({ avatar: '' });
      // Update local state and auth context with authoritative server data
      const returnedFull = updated.fullName || updated.name || '';
      const parts = returnedFull.trim().split(/\s+/);
      setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
      setLastName(parts.slice(-1).join(' ') || '');

      setUser(prev => ({
        ...prev,
        name: returnedFull,
        username: updated.username || prev.username || '',
        email: updated.email || prev.email || '',
        bio: updated.bio ?? prev.bio ?? '',
        location: updated.location ?? prev.location ?? '',
        institution: updated.institution ?? prev.institution ?? '',
        degree: updated.degree ?? prev.degree ?? '',
        branch: updated.branch ?? prev.branch ?? '',
        graduationYear: updated.graduationYear ?? prev.graduationYear ?? '',
        country: updated.country ?? prev.country ?? 'IN',
        avatar: updated.avatar ?? ''
      }));
      updateUserData(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Remove avatar error:', err);
      setError(err.message || 'Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUserChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
  const handleFirstNameChange = (e) => setFirstName(e.target.value);
  const handleLastNameChange = (e) => setLastName(e.target.value);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Combine first + last into `name` which backend expects as `name` (will be saved as fullName)
      const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
      const payload = { 
        name: fullName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        institution: user.institution,
        degree: user.degree,
        branch: user.branch,
        graduationYear: user.graduationYear,
        country: user.country,
        // include avatar explicitly so server persists removals/changes
        avatar: user.avatar
      };
      
      const updatedUser = await api.updateUser(payload);

      // After settings update, refresh authoritative user state (so avatar changes/removals persist)
      const fresh = await api.getUser();

      if (fresh) {
        updateUserData(fresh);

        const returnedFullName = fresh.fullName || fresh.name || '';
        const parts = returnedFullName.trim().split(/\s+/);
        setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
        setLastName(parts.slice(-1).join(' ') || '');

        setUser(prev => ({
          ...prev,
          name: returnedFullName || prev.name,
          username: fresh.username ?? prev.username ?? '',
          email: fresh.email ?? prev.email ?? '',
          bio: fresh.bio ?? prev.bio ?? '',
          location: fresh.location ?? prev.location ?? '',
          institution: fresh.institution ?? prev.institution ?? '',
          degree: fresh.degree ?? prev.degree ?? '',
          branch: fresh.branch ?? prev.branch ?? '',
          graduationYear: fresh.graduationYear ?? prev.graduationYear ?? '',
          country: fresh.country ?? prev.country ?? 'IN',
          avatar: fresh.avatar ?? prev.avatar ?? ''
        }));
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setError(serverMsg || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (authUser) {
      const full = authUser.fullName || authUser.name || '';
      const parts = full.trim().split(/\s+/);
      setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
      setLastName(parts.slice(-1).join(' ') || '');

      setUser({
        name: full,
        username: authUser.username || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        location: authUser.location || '',
        institution: authUser.institution || '',
        degree: authUser.degree || '',
        branch: authUser.branch || '',
        graduationYear: authUser.graduationYear || '',
        country: authUser.country || 'IN',
        avatar: authUser.avatar || authUser.avatarUrl || ''
      });
    }
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile and platform connections</p>
      </div>

      <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Basic Info</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">You can manage your details here.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Basic Details</h3>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
          <div className="relative">
              <UserAvatar user={{ avatar: user.avatar, name: user.name }} size="2xl" />
              <div className="absolute -bottom-4 left-0 right-0 flex items-center justify-between px-2">
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar || !user.avatar}
                  title="Remove avatar"
                  className="w-9 h-9 bg-white dark:bg-[#2b2b2b] text-gray-700 dark:text-white rounded-full flex items-center justify-center shadow border border-gray-200 dark:border-transparent transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  title="Change avatar"
                  className="w-9 h-9 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-black transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

          <div className="flex-1">
            <div className="mb-4">
              <span className="text-sm text-gray-400">CodeVerse Id: </span>
              <span className="text-sm text-gray-500">{user.username}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="firstName" 
                  value={firstName} 
                  onChange={handleFirstNameChange} 
                  placeholder="Mayank"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Last Name</label>
                <input 
                  name="lastName" 
                  value={lastName} 
                  onChange={handleLastNameChange} 
                  placeholder="Jha"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors" 
                />
              </div>
            </div>

            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
            <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Email</label>
            <input 
              type="email" 
              name="email" 
              value={user.email} 
              onChange={handleUserChange} 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Bio (Max 200 Characters)</label>
            <textarea 
              name="bio" 
              value={user.bio} 
              onChange={handleUserChange} 
              maxLength={200}
              rows={3} 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors resize-none" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Location</label>
              <input 
                name="location" 
                value={user.location} 
                onChange={handleUserChange} 
                placeholder="e.g., Mumbai, India"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select 
                name="country" 
                value={user.country} 
                onChange={handleUserChange} 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
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

          {/* Institution input moved to Educational Details to avoid duplication */}
        </div>
      </div>

      

      <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Educational Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              School / College / University <span className="text-red-500">*</span>
            </label>
            <input 
              name="institution" 
              value={user.institution} 
              onChange={handleUserChange} 
              placeholder="Bhagwan Parshuram Institute of Technology"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Degree <span className="text-red-500">*</span>
            </label>
            <select 
              name="degree" 
              value={user.degree} 
              onChange={handleUserChange} 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Select Degree</option>
              <option value="Bachelor of Technology">Bachelor of Technology</option>
              <option value="Bachelor of Engineering">Bachelor of Engineering</option>
              <option value="Bachelor of Science">Bachelor of Science</option>
              <option value="Bachelor of Computer Applications">Bachelor of Computer Applications</option>
              <option value="Master of Technology">Master of Technology</option>
              <option value="Master of Engineering">Master of Engineering</option>
              <option value="Master of Science">Master of Science</option>
              <option value="Master of Computer Applications">Master of Computer Applications</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Branch <span className="text-red-500">*</span>
            </label>
            <select 
              name="branch" 
              value={user.branch} 
              onChange={handleUserChange} 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Select Branch</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics and Communication">Electronics and Communication</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Chemical Engineering">Chemical Engineering</option>
              <option value="Biotechnology">Biotechnology</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Data Science">Data Science</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Year of Graduation <span className="text-red-500">*</span>
            </label>
            <select 
              name="graduationYear" 
              value={user.graduationYear} 
              onChange={handleUserChange} 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Select Year</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors">
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

        <button onClick={handleCancel} disabled={loading} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">Cancel</button>

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
