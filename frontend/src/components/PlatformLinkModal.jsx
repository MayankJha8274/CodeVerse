import React, { useState } from 'react';
import { X } from 'lucide-react';

const PlatformLinkModal = ({ platform, isOpen, onClose, onLink }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onLink(platform.id, username.trim());
      setUsername('');
      onClose();
    } catch (err) {
      console.error('Modal submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to link platform';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#16161f] rounded-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Link {platform.name}
          </h2>
          <p className="text-gray-400 text-sm">
            Enter your {platform.name} username to connect your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`Your ${platform.name} username`}
              className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-[#1a1a2e] text-white placeholder-gray-500"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Platform Specific Instructions */}
          <div className="mb-6 p-3 bg-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-300">
              <strong>Note:</strong> Make sure your {platform.name} profile is public for stats to be fetched correctly.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-[#1a1a2e] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:bg-amber-500/50 disabled:cursor-not-allowed"
              disabled={loading || !username.trim()}
            >
              {loading ? 'Linking...' : 'Link Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformLinkModal;
