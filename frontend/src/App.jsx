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
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
