import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

// Contest Hosting Pages
import ContestAdminPage from './pages/ContestAdminPage';
import ContestEditPage from './pages/ContestEditPage';
import ChallengeEditorPage from './pages/ChallengeEditorPage';
import ContestLandingPage from './pages/ContestLandingPage';
import ContestParticipationPage from './pages/ContestParticipationPage';
import ContestLeaderboardPage from './pages/ContestLeaderboardPage';

function App() {
  return (
    <AuthProvider>
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
            <Route path="compare" element={<ComparisonPage />} />
            <Route path="sheets" element={<SheetsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="daily-challenge" element={<DailyChallengePage />} />
            <Route path="contests" element={<ContestsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Contest Admin Routes */}
            <Route path="contests/admin" element={<ContestAdminPage />} />
            <Route path="contests/create" element={<ContestEditPage />} />
            <Route path="contests/:slug/edit" element={<ContestEditPage />} />
            <Route path="contests/:contestSlug/problems/create" element={<ChallengeEditorPage />} />
            <Route path="contests/:contestSlug/problems/:problemSlug/edit" element={<ChallengeEditorPage />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
