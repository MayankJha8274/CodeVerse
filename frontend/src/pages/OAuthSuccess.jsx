import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUserData } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token to localStorage first
      localStorage.setItem('token', token);
      
      // Fetch full user data from API (includes platforms)
      const fetchUserData = async () => {
        try {
          const userData = await api.getUser();
          const user = {
            id: userData._id || userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            avatar: userData.avatar,
            platforms: userData.platforms || {}
          };
          localStorage.setItem('user', JSON.stringify(user));
          updateUserData(user);
          
          // Redirect to dashboard
          setTimeout(() => navigate('/dashboard'), 500);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to token decode if API fails
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = {
              id: payload.id,
              username: payload.username,
              email: payload.email,
              platforms: {}
            };
            localStorage.setItem('user', JSON.stringify(user));
            updateUserData(user);
            setTimeout(() => navigate('/dashboard'), 500);
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            navigate('/login?error=oauth_failed');
          }
        }
      };
      
      fetchUserData();
    } else {
      // No token, redirect to login
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate, updateUserData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
        <p className="text-text-primary text-lg">Completing login...</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
