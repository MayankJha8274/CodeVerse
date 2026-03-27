import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
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
import Logo from '../components/common/Logo';

const LandingPage = () => {
  const [globalStats, setGlobalStats] = useState({
    platforms: 7,
    totalProblems: 1200,
    totalActivities: 16260
  });

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/analytics/global`);
        const data = await res.json();
        
        if (data.success) {
          setGlobalStats({
            platforms: data.data.platforms ?? 7,
            totalProblems: data.data.totalProblems ?? 1200,
            totalActivities: data.data.totalActivities ?? 10000
          });
        }
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      }
    };
    fetchGlobalStats();
  }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] transition-colors relative overflow-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-white/10' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <Logo className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CodeVerse
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#platforms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Platforms
            </a>
            <a href="#demo" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Demo
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm sm:text-base transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium rounded-lg transition-all text-sm sm:text-base shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 py-[100px] px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glow-badge inline-flex items-center px-4 py-2 rounded-full bg-orange-500/10 border border-orange-400/20 text-orange-300 font-medium text-sm mb-8 transition duration-300 hover:scale-105"
          >
            ⚡ Track coding across {globalStats.platforms}+ platforms
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
          >
            One Dashboard.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-500">
              <TypeAnimation
                sequence={[
                  'Every Coding Platform.',
                  2000,
                  'Seamless Integration.',
                  2000,
                  'Unified Analytics.',
                  2000,
                ]}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
              />
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Aggregate stats from LeetCode, Codeforces, CodeChef, GitHub, and more.
            Get personalized analytics, daily challenges, and compete with your team.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-1 text-lg flex items-center gap-2 w-full sm:w-auto justify-center">
              Connect Your Profiles
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/dashboard" className="px-8 py-3.5 bg-white/5 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-medium rounded-xl transition-all text-lg w-full sm:w-auto justify-center flex items-center">
              View Demo
            </Link>
          </motion.div>

          {/* Stats Glassmorphic Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 sm:mt-24 p-8 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 shadow-xl"
          >
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-amber-500 mb-2">
                <CountUp end={globalStats.platforms} duration={2.5} />+
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Platforms</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-amber-500 mb-2">
                <CountUp end={globalStats.totalProblems} duration={2.5} separator="," />+
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Problems Solved</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-amber-500 mb-2">
                <CountUp end={globalStats.totalActivities} duration={2.5} separator="," />+
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Activities</div>
            </div>
          </motion.div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            *Includes problems, submissions, contests & contributions
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Integrates with your favorite platforms
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Connect all your coding profiles and see everything in one place with our seamless integrations.
            </p>
          </motion.div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6 justify-center"
          >
            {platforms.map((platform) => (
              <motion.div
                key={platform.name}
                variants={itemVariants}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 dark:bg-[#111827]/80 backdrop-blur-md border border-gray-200 dark:border-white/10 hover:border-amber-400/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer transform hover:-translate-y-1 shadow-lg"
              >
                <PlatformIcon platform={platform.key} className="w-12 h-12" color={platform.color} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center px-2">
                  {platform.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Level Up
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful analytics, personalized challenges, and team competitions all in one premium dashboard.
            </p>
          </motion.div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white/5 dark:bg-[#111827]/80 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-8 hover:border-amber-400/30 transition-all transform hover:-translate-y-1 group shadow-lg"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 relative z-10 bg-gray-50 dark:bg-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See CodeVerse in Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Experience the power of unified analytics
            </p>
            <Link to="/dashboard" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 text-lg inline-flex items-center gap-2">
              Explore Demo Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="rounded-3xl p-10 sm:p-16 bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to Track Your Progress?
              </h2>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
                Start aggregating your coding stats today. Connect your platforms, join societies, and compete with developers worldwide.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto bg-white text-gray-900 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg shadow-black/10 text-lg">
                  Create Free Account
                </Link>
                <Link to="/login" className="w-full sm:w-auto text-white font-bold px-8 py-4 rounded-xl border border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all text-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;
