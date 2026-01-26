import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUserData } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Decode token to get user info (simple JWT decode without verification - backend already verified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.id,
          username: payload.username,
          email: payload.email
        };
        localStorage.setItem('user', JSON.stringify(user));
        updateUserData(user);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
      
      // Redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 500);
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
