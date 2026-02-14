import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Code2, 
  TrendingUp, 
  Users, 
  GitCompare, 
  BarChart3, 
  Calendar,
  Shield,
  Zap,
  ArrowRight,
  Github,
  Twitter
} from 'lucide-react';

import { PlatformIcon } from '../utils/platformConfig';
import { useTheme } from '../hooks/useCustomHooks';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const platforms = [
    { name: 'LeetCode', key: 'leetcode', color: '#FFA116' },
    { name: 'Codeforces', key: 'codeforces', color: '#1F8ACB' },
    { name: 'CodeChef', key: 'codechef', color: '#5B4638' },
    { name: 'GitHub', key: 'github', color: '#24292f' },
    { name: 'GeeksforGeeks', key: 'geeksforgeeks', color: '#2F8D46' },
    { name: 'HackerRank', key: 'hackerrank', color: '#00EA64' },
    { name: 'Coding Ninjas', key: 'codingninjas', color: '#F96D00' }
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'Unified Analytics',
      description: 'View all your stats from every platform in one beautiful dashboard with visual breakdowns.'
    },
    {
      icon: Calendar,
      title: 'Daily Challenges',
      description: 'Get personalized challenges based on your weak areas and skill gaps to improve faster.'
    },
    {
      icon: Users,
      title: 'Societies & Rooms',
      description: 'Create or join coding societies to compete, compare, and grow with your peers.'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Track rating changes, consistency scores, and improvement trends over time.'
    },
    {
      icon: GitCompare,
      title: 'User Comparison',
      description: 'Compare your progress with friends and competitors across all platforms.'
    },
    {
      icon: Shield,
      title: 'Privacy Controls',
      description: 'Choose what\'s public, private, or visible only to your room members.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0d14] transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#16161f] transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CodeVerse
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Features
            </a>
            <a href="#platforms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Platforms
            </a>
            <a href="#demo" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Demo
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a.75.75 0 01.743.648L10.75 2.75V4a.75.75 0 01-1.493.102L9.25 4V2.75A.75.75 0 0110 2zM10 16a.75.75 0 01.743.648L10.75 16.75V18a.75.75 0 01-1.493.102L9.25 18v-1.25A.75.75 0 0110 16zM4.222 4.222a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zM14.834 14.834a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zM2 10a.75.75 0 01.648-.743L2.75 9.25H4a.75.75 0 01.102 1.493L4 10.75H2.75A.75.75 0 012 10zM16 10a.75.75 0 01.648-.743L16.75 9.25H18a.75.75 0 01.102 1.493L18 10.75h-1.25A.75.75 0 0116 10zM4.222 15.778a.75.75 0 010 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 011.06 0zM15.778 5.166a.75.75 0 010 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 011.06 0z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707 8 8 0 1017.293 13.293z"/></svg>
              )}
            </button>

            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Join 50,000+ developers
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            One Dashboard.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600">
              Every Coding Platform.
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Aggregate stats from LeetCode, Codeforces, CodeChef, GitHub, and more.
            Get personalized analytics, daily challenges, and compete with your team.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors text-lg flex items-center gap-2">
              Connect Your Profiles
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/dashboard" className="btn-secondary text-lg px-8 py-3">
              View Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-amber-500 mb-2">7+</div>
              <div className="text-gray-600 dark:text-gray-400">Platforms</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 mb-2">1M+</div>
              <div className="text-gray-600 dark:text-gray-400">Problems Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400">Developers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 px-6 bg-gray-50 dark:bg-[#16161f] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Integrates with your favorite platforms
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Connect all your coding profiles and see everything in one place
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-500 transition-colors bg-white dark:bg-transparent"
              >
                <PlatformIcon platform={platform.key} className="w-12 h-12" color={platform.color} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Level Up
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful analytics, personalized challenges, and team competitions ΓÇö all in one place
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#16161f] rounded-xl p-6 hover:shadow-lg transition-shadow transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6 bg-gray-100 dark:bg-[#16161f] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See CodeVerse in Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Experience the power of unified analytics
            </p>
            <Link to="/dashboard" className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors text-lg inline-flex items-center gap-2">
              Explore Demo Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-xl p-12 bg-gradient-to-r from-amber-500 to-purple-600">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Track Your Progress?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Start aggregating your coding stats today. Connect your platforms, join societies, and compete with developers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="bg-white text-amber-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Create Free Account
              </Link>
              <Link to="/login" className="text-white font-semibold px-8 py-3 rounded-lg border-2 border-white hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
