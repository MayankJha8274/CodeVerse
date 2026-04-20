import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthSuccess from './pages/OAuthSuccess';
import DashboardLayout from './layouts/DashboardLayout';
import { Analytics } from "@vercel/analytics/react";

// Lazy loading all massive views
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const PlatformDetailPage = lazy(() => import('./pages/PlatformDetailPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SheetsPage = lazy(() => import('./pages/SheetsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const DailyChallengePage = lazy(() => import('./pages/DailyChallengePage'));
const ContestsPage = lazy(() => import('./pages/ContestsPage'));

// Society Pages
const SocietiesPage = lazy(() => import('./pages/SocietiesPage'));
const SocietyDetailPage = lazy(() => import('./pages/SocietyDetailPage'));

// Contest Hosting Pages
const ContestLandingPage = lazy(() => import('./pages/ContestLandingPage'));
const ContestParticipationPage = lazy(() => import('./pages/ContestParticipationPage'));
const ContestLeaderboardPage = lazy(() => import('./pages/ContestLeaderboardPage'));

// Problem Set Pages (Coming Soon)
const ProblemSetComingSoon = lazy(() => import('./pages/ComingSoonPage').then(module => ({ default: module.ProblemSetComingSoon })));
const HostContestComingSoon = lazy(() => import('./pages/ComingSoonPage').then(module => ({ default: module.HostContestComingSoon })));

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <SocketProvider>
      <Router>
        <Analytics />
        <Suspense fallback={<LoadingSpinner />}>
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
            <Route path="dashboard/profile/:userId" element={<Dashboard />} />
            <Route path="platforms" element={<PlatformDetailPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/:societyId" element={<SocietyDetailPage />} />
            <Route path="rooms/:societyId/:tab" element={<SocietyDetailPage />} />
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
        </Suspense>
      </Router>
      </SocketProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
