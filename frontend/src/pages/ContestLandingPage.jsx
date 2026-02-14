import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, Users, Trophy, BookOpen, AlertCircle,
  Loader2, Check, Play, Eye, ChevronDown, ChevronUp, Mail
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ContestLandingPage = () => {
  const { contestSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('about');
  const [expandedSections, setExpandedSections] = useState({
    rules: true,
    scoring: true,
    prizes: true
  });

  useEffect(() => {
    fetchContest();
  }, [contestSlug]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const data = await api.getHostedContest(contestSlug);
      setContest(data.data);
      
      // Check if user is signed up
      if (user && data.data.signups) {
        const signup = data.data.signups.find(s => s.user === user._id || s.user?._id === user._id);
        setIsSignedUp(!!signup);
      }
    } catch (error) {
      console.error('Failed to fetch contest:', error);
      setError('Contest not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/contest/${contestSlug}` } });
      return;
    }

    try {
      setSigningUp(true);
      await api.signUpForContest(contestSlug);
      setIsSignedUp(true);
    } catch (error) {
      setError(error.message || 'Failed to sign up');
    } finally {
      setSigningUp(false);
    }
  };

  const getContestStatus = () => {
    if (!contest) return 'unknown';
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'ended';
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getTimeUntilStart = () => {
    if (!contest) return '';
    const now = new Date();
    const start = new Date(contest.startTime);
    const diff = start - now;
    
    if (diff <= 0) return '';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex items-center justify-center transition-colors">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex flex-col items-center justify-center text-gray-900 dark:text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Contest Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The contest you're looking for doesn't exist or has been removed.</p>
        <Link to="/contests" className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg">
          Browse Contests
        </Link>
      </div>
    );
  }

  const status = getContestStatus();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-b from-amber-500/20 to-transparent"
        style={{
          backgroundImage: contest.backgroundImage ? `url(${contest.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <Link 
            to="/contests"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Contests
          </Link>

          {/* Status Badge */}
          <div className="mb-4">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              status === 'live' ? 'bg-green-500 text-black animate-pulse' :
              status === 'upcoming' ? 'bg-amber-500 text-black' :
              'bg-gray-600 text-white'
            }`}>
              {status === 'live' ? '● LIVE NOW' : status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
            </span>
          </div>

          {/* Contest Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{contest.name}</h1>
          
          {/* Tagline */}
          {contest.tagline && (
            <p className="text-xl text-gray-300 mb-6">{contest.tagline}</p>
          )}

          {/* Organization */}
          <p className="text-gray-400 mb-8">
            Hosted by <span className="text-white font-medium">{contest.organizationName || 'CodeVerse'}</span>
          </p>

          {/* Contest Info */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>{formatDateTime(contest.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>
                {Math.round((new Date(contest.endTime) - new Date(contest.startTime)) / (1000 * 60 * 60))} hours
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-5 h-5 text-amber-500" />
              <span>{contest.signups?.length || 0} registered</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {status === 'upcoming' && (
              <>
                {isSignedUp ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-lg">
                    <Check className="w-5 h-5" />
                    Registered! Starts in {getTimeUntilStart()}
                  </div>
                ) : (
                  <button
                    onClick={handleSignUp}
                    disabled={signingUp}
                    className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {signingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    Register Now
                  </button>
                )}
              </>
            )}
            
            {status === 'live' && (
              <button
                onClick={() => navigate(`/contest/${contestSlug}/problems`)}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Contest
              </button>
            )}

            {status === 'ended' && (
              <>
                <Link
                  to={`/contest/${contestSlug}/leaderboard`}
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg flex items-center gap-2"
                >
                  <Trophy className="w-5 h-5" />
                  View Leaderboard
                </Link>
                <Link
                  to={`/contest/${contestSlug}/problems`}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  View Problems
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Description */}
        {contest.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-300">{contest.description}</div>
            </div>
          </div>
        )}

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Rules */}
          {contest.rules && (
            <div className="bg-[#0d0d14] rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => toggleSection('rules')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-lg">Rules</span>
                </div>
                {expandedSections.rules ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.rules && (
                <div className="px-6 pb-6">
                  <div className="whitespace-pre-wrap text-gray-300">{contest.rules}</div>
                </div>
              )}
            </div>
          )}

          {/* Scoring */}
          {contest.scoring && (
            <div className="bg-[#0d0d14] rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => toggleSection('scoring')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-lg">Scoring</span>
                </div>
                {expandedSections.scoring ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.scoring && (
                <div className="px-6 pb-6">
                  <div className="whitespace-pre-wrap text-gray-300">{contest.scoring}</div>
                  
                  {/* Contest Format Info */}
                  <div className="mt-4 p-4 bg-[#1a1a24] rounded-lg">
                    <p className="font-medium mb-2">Contest Format: <span className="text-amber-500 capitalize">{contest.contestFormat}</span></p>
                    {contest.contestFormat === 'icpc' && (
                      <p className="text-sm text-gray-400">
                        ICPC style - {contest.icpcSettings?.penalty || 1200}s penalty per wrong submission
                      </p>
                    )}
                    {contest.contestFormat === 'codeforces-div2' && (
                      <p className="text-sm text-gray-400">
                        Score decays over time. Minimum score: {contest.cfSettings?.minScorePercentage || 30}%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prizes */}
          {contest.prizes && (
            <div className="bg-[#0d0d14] rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => toggleSection('prizes')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-lg">Prizes</span>
                </div>
                {expandedSections.prizes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.prizes && (
                <div className="px-6 pb-6">
                  <div className="whitespace-pre-wrap text-gray-300">{contest.prizes}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Languages Supported */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Supported Languages</h2>
          <div className="flex flex-wrap gap-3">
            {(contest.allowedLanguages || ['cpp20', 'java', 'python3', 'pypy3', 'c']).map(lang => (
              <span key={lang} className="px-4 py-2 bg-[#1a1a24] rounded-lg border border-gray-700 font-medium">
                {lang === 'cpp20' ? 'C++ 20' :
                 lang === 'python3' ? 'Python 3' :
                 lang === 'pypy3' ? 'PyPy 3' :
                 lang.charAt(0).toUpperCase() + lang.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Security Settings Notice */}
        {(contest.securitySettings?.screenLockEnabled || contest.securitySettings?.fullscreenRequired) && (
          <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-500">Security Notice</h3>
                <p className="text-sm text-gray-400 mt-1">
                  This contest has security measures enabled:
                  {contest.securitySettings?.fullscreenRequired && ' Fullscreen mode required.'}
                  {contest.securitySettings?.screenLockEnabled && ` Tab switch limit: ${contest.securitySettings?.tabSwitchLimit || 3}.`}
                  {contest.securitySettings?.copyPasteDisabled && ' Copy/Paste disabled.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestLandingPage;
