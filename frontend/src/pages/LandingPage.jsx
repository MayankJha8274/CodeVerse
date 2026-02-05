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

const LandingPage = () => {
  const platforms = [
    { name: 'LeetCode', logo: 'https://leetcode.com/favicon.ico' },
    { name: 'Codeforces', logo: 'https://codeforces.org/favicon.ico' },
    { name: 'CodeChef', logo: 'https://www.codechef.com/favicon.ico' },
    { name: 'GitHub', logo: 'https://github.com/favicon.ico' },
    { name: 'GeeksforGeeks', logo: 'https://www.geeksforgeeks.org/favicon.ico' },
    { name: 'HackerRank', logo: 'https://www.hackerrank.com/favicon.ico' }
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
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header */}
      <header className="border-b border-gray-700 bg-[#16161f]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              CodeVerse
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white">
              Features
            </a>
            <a href="#platforms" className="text-gray-400 hover:text-white">
              Platforms
            </a>
            <a href="#demo" className="text-gray-400 hover:text-white">
              Demo
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-300 hover:text-white font-medium">
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
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            One Dashboard.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600">
              Every Coding Platform.
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
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
              <div className="text-gray-400">Platforms</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 mb-2">1M+</div>
              <div className="text-gray-400">Problems Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 mb-2">50K+</div>
              <div className="text-gray-400">Developers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 px-6 bg-[#16161f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Integrates with your favorite platforms
            </h2>
            <p className="text-lg text-gray-400">
              Connect all your coding profiles and see everything in one place
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border border-gray-700 hover:border-amber-500 transition-colors"
              >
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="w-12 h-12"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <span className="text-sm font-medium text-gray-300">
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Level Up
            </h2>
            <p className="text-lg text-gray-400">
              Powerful analytics, personalized challenges, and team competitions ΓÇö all in one place
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#16161f] rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6 bg-[#16161f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See CodeVerse in Action
            </h2>
            <p className="text-lg text-gray-400 mb-8">
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
          <div className="bg-[#16161f] rounded-xl p-12 bg-gradient-to-r from-amber-500 to-purple-600">
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
            <p className="text-white/80 text-sm mt-6">
              Free forever ΓÇó No credit card required ΓÇó Privacy-focused
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-[#16161f] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  CodeVerse
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Unify your competitive programming progress across all platforms.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#platforms" className="hover:text-white">Platforms</a></li>
                <li><a href="#demo" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              ┬⌐ 2026 CodeVerse. All rights reserved. Built with Γ¥ñ∩╕Å for developers worldwide.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
