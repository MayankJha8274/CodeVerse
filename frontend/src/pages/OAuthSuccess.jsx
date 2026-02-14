import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUserData } = useAuth();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [decoded, setDecoded] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMsg('No token found in URL.');
      // Redirect back to login after short delay
      setTimeout(() => navigate('/login?error=oauth_failed'), 2500);
      return;
    }
 
    // Save token immediately so api calls use it
    localStorage.setItem('token', token);

    const fetchUserData = async () => {
      try {
        const userData = await api.getUser();
        const user = {
          id: userData._id || userData.id,
          username: userData.username || userData.userName || userData.fullName,
          email: userData.email,
          fullName: userData.fullName || userData.name,
          avatar: userData.avatar,
          platforms: userData.platforms || {}
        };
        localStorage.setItem('user', JSON.stringify(user));
        updateUserData(user);
        setStatus('success');
        // Ensure user sees the success state briefly
        setTimeout(() => navigate('/dashboard'), 600);
      } catch (error) {
        console.error('Error fetching user data after OAuth:', error);
        // Attempt to decode token payload as a fallback
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            id: payload.id || payload._id,
            username: payload.username || payload.name,
            email: payload.email,
            platforms: {}
          };
          localStorage.setItem('user', JSON.stringify(user));
          updateUserData(user);
          setDecoded(payload);
          setStatus('success');
          setTimeout(() => navigate('/dashboard'), 800);
        } catch (decodeError) {
          console.error('Token decode failed:', decodeError);
          setStatus('error');
          setErrorMsg('Failed to fetch account after authentication. Please try logging in.');
        }
      }
    };

    // Start fetch but also guard in case it stalls
    fetchUserData();
    const guard = setTimeout(() => {
      if (status === 'processing') {
        // show a helpful message and allow manual continue
        setErrorMsg('Taking longer than expected. If the page stays here, click Continue.');
        setStatus('error');
      }
    }, 8000);

    return () => clearTimeout(guard);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleContinue = () => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      updateUserData(savedUser);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d0d14] px-4 transition-colors">
      <div className="max-w-xl w-full text-center">
        {status === 'processing' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white text-lg">Completing login...</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">If this takes too long, use the Continue button below.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Login successful</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Redirecting you to your dashboard...</p>
            <button onClick={handleContinue} className="px-4 py-2 bg-amber-500 rounded text-black font-medium">Go to Dashboard</button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMsg || 'Something went wrong during authentication.'}</p>
            {decoded && (
              <div className="text-left bg-white dark:bg-[#0d0d14] p-3 rounded mb-3 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors">
                <strong>Decoded token:</strong>
                <pre className="whitespace-pre-wrap mt-2">{JSON.stringify(decoded, null, 2)}</pre>
              </div>
            )}
            <div className="flex justify-center gap-3">
              <button onClick={handleContinue} className="px-4 py-2 bg-amber-500 rounded text-black font-medium">Continue</button>
              <button onClick={() => navigate('/login')} className="px-4 py-2 border border-gray-700 rounded text-gray-300">Back to Login</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthSuccess;
