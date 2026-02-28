import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthSuccess from './pages/OAuthSuccess';
import Dashboard from './pages/Dashboard';
import PlatformDetailPage from './pages/PlatformDetailPage';
import RoomsPage from './pages/RoomsPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import SheetsPage from './pages/SheetsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DailyChallengePage from './pages/DailyChallengePage';
import ContestsPage from './pages/ContestsPage';
import DashboardLayout from './layouts/DashboardLayout';

// Society Pages
import SocietiesPage from './pages/SocietiesPage';
import SocietyDetailPage from './pages/SocietyDetailPage';

// Contest Hosting Pages (admin routes show Coming Soon)
import ContestLandingPage from './pages/ContestLandingPage';
import ContestParticipationPage from './pages/ContestParticipationPage';
import ContestLeaderboardPage from './pages/ContestLeaderboardPage';

// Problem Set Pages (Coming Soon)
import { ProblemSetComingSoon, HostContestComingSoon } from './pages/ComingSoonPage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />

          {/* Public Contest Pages */}
          <Route path="/contest/:contestSlug" element={<ContestLandingPage />} />
          <Route path="/contest/:contestSlug/leaderboard" element={<ContestLeaderboardPage />} />

          {/* Contest Participation (requires auth) */}
          <Route path="/contest/:contestSlug/problems" element={
            <PrivateRoute><ContestParticipationPage /></PrivateRoute>
          } />
          <Route path="/contest/:contestSlug/problem/:problemSlug" element={
            <PrivateRoute><ContestParticipationPage /></PrivateRoute>
          } />

          {/* Protected Routes with Dashboard Layout */}
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="platforms" element={<PlatformDetailPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="societies" element={<SocietiesPage />} />
            <Route path="societies/:societyId" element={<SocietyDetailPage />} />
            <Route path="societies/:societyId/:tab" element={<SocietyDetailPage />} />
            <Route path="compare" element={<ComparisonPage />} />
            <Route path="sheets" element={<SheetsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="daily-challenge" element={<DailyChallengePage />} />
            <Route path="contests" element={<ContestsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Contest Admin Routes — Coming Soon */}
            <Route path="contests/admin" element={<HostContestComingSoon />} />
            <Route path="contests/create" element={<HostContestComingSoon />} />
            <Route path="contests/:slug/edit" element={<HostContestComingSoon />} />
            <Route path="contests/:contestSlug/problems/create" element={<HostContestComingSoon />} />
            <Route path="contests/:contestSlug/problems/:problemSlug/edit" element={<HostContestComingSoon />} />
            
            {/* Problem Set Routes — Coming Soon */}
            <Route path="problem-set" element={<ProblemSetComingSoon />} />
            <Route path="problem-set/create" element={<ProblemSetComingSoon />} />
            <Route path="problem-set/:slug" element={<ProblemSetComingSoon />} />
            <Route path="problem-set/:slug/edit" element={<ProblemSetComingSoon />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
