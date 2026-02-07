// contest edit page - allows creating and editing contests with multiple tabs for different settings
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Eye, Settings, Users, Bell, BarChart3, Trophy,
  AlertCircle, Check, Loader2, Trash2, Plus, GripVertical, X
} from 'lucide-react';
import api from '../services/api';

// Tabs
const TABS = [
  { id: 'details', label: 'Details', icon: Settings },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'advanced', label: 'Advanced Settings', icon: Settings },
  { id: 'moderators', label: 'Moderators', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'signups', label: 'Signups', icon: Users },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 }
];

const ContestEditPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNewContest = !slug;
  
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(!isNewContest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Contest Data
  const [contest, setContest] = useState({
    name: '',
    description: '',
    tagline: '',
    startTime: '',
    startTimeTime: '00:00',
    endTime: '',
    endTimeTime: '00:00',
    hasNoEndTime: false,
    timezone: 'IST',
    organizationType: 'personal',
    organizationName: '',
    backgroundImage: '',
    useAsOpenGraphImage: false,
    rules: '',
    prizes: '',
    scoring: `- Each challenge has a pre-determined score.
- A participant's score depends on the number of test cases a participant's code submission successfully passes.
- If a participant submits more than one solution per challenge, then the participant's score will reflect the highest score achieved.`,
    contestFormat: 'normal',
    icpcSettings: {
      penalty: 1200,
      penalizeCompilationError: false,
      freezeLeaderboardAt: 0
    },
    cfSettings: {
      scoreDecayEnabled: true,
      decayRate: 0.004,
      minScorePercentage: 30,
      hackEnabled: false
    },
    normalSettings: {
      partialScoring: true,
      showTestCasesOnWrong: false,
      allowMultipleSubmissions: true
    },
    leaderboardType: 'acm',
    showLeaderboardDuringContest: true,
    forumEnabled: true,
    restrictedForum: false,
    isPublic: true,
    accessCode: '',
    allowedLanguages: ['cpp20', 'java', 'python3', 'pypy3', 'c'],
    screenLockEnabled: false,
    tabSwitchLimit: 3,
    fullscreenRequired: false,
    copyPasteDisabled: false,
    maxParticipants: 0
  });
  
  const [problems, setProblems] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [signups, setSignups] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newModerator, setNewModerator] = useState('');
  const [newNotification, setNewNotification] = useState({ message: '', type: 'info' });

  useEffect(() => {
    if (!isNewContest) {
      fetchContest();
    }
  }, [slug]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const data = await api.getHostedContest(slug);
      const c = data.data;
      
      // Parse dates for form
      const startDate = new Date(c.startTime);
      const endDate = new Date(c.endTime);
      
      setContest({
        ...c,
        startTime: startDate.toISOString().split('T')[0],
        startTimeTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toISOString().split('T')[0],
        endTimeTime: endDate.toTimeString().slice(0, 5)
      });
      
      setModerators(c.moderators || []);
      setNotifications(c.notifications || []);
      
      // Fetch problems
      try {
        const problemsData = await api.getContestProblems(slug);
        setProblems(problemsData.data || []);
      } catch (e) {
        console.log('Problems not available yet');
      }
      
    } catch (error) {
      console.error('Failed to fetch contest:', error);
      setError('Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate
      if (!contest.name?.trim()) {
        setError('Contest name is required');
        return;
      }
      if (!contest.startTime) {
        setError('Start time is required');
        return;
      }
      if (!contest.hasNoEndTime && !contest.endTime) {
        setError('End time is required');
        return;
      }

      // Build datetime strings
      const startDateTime = new Date(`${contest.startTime}T${contest.startTimeTime || '00:00'}`);
      const endDateTime = contest.hasNoEndTime 
        ? new Date(startDateTime.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(`${contest.endTime}T${contest.endTimeTime || '00:00'}`);

      const contestData = {
        ...contest,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      };

      if (isNewContest) {
        const response = await api.createHostedContest(contestData);
        const createdSlug = response.slug || response.data?.slug;
        setSuccess('Contest created successfully!');
        if (createdSlug) {
          setTimeout(() => window.location.href = `/contests/${createdSlug}/edit`, 1000);
        }
      } else {
        await api.updateHostedContest(slug, contestData);
        setSuccess('Contest saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save contest');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModerator = async () => {
    if (!newModerator.trim()) return;
    
    try {
      await api.addContestModerator(slug, newModerator);
      fetchContest();
      setNewModerator('');
      setSuccess('Moderator added');
    } catch (error) {
      setError(error.message || 'Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (userId) => {
    try {
      await api.removeContestModerator(slug, userId);
      fetchContest();
    } catch (error) {
      setError(error.message || 'Failed to remove moderator');
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.message.trim()) return;
    
    try {
      await api.sendContestNotification(slug, newNotification.message, newNotification.type);
      fetchContest();
      setNewNotification({ message: '', type: 'info' });
      setSuccess('Notification sent');
    } catch (error) {
      setError(error.message || 'Failed to send notification');
    }
  };

  const fetchSignups = async () => {
    if (!slug) return;
    try {
      const data = await api.getContestSignups(slug);
      setSignups(data.data || []);
    } catch (error) {
      console.error('Failed to fetch signups:', error);
    }
  };

  const fetchStatistics = async () => {
    if (!slug) return;
    try {
      const data = await api.getContestStatistics(slug);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'signups') fetchSignups();
    if (activeTab === 'statistics') fetchStatistics();
  }, [activeTab, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="bg-[#0d0d14] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/contests/admin')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">
                Manage Contests &gt; {isNewContest ? 'Create Contest' : contest.name}
              </div>
              <h1 className="text-2xl font-bold">
                {isNewContest ? 'Create Contest' : contest.name}
              </h1>
              {!isNewContest && (
                <a 
                  href={`/contest/${slug}`}
                  target="_blank"
                  className="text-amber-500 hover:underline text-sm"
                >
                  www.codeverse.com/{slug}
                </a>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => {
              const isDisabled = isNewContest && tab.id !== 'details';
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#1a1a24] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isDisabled ? 'Save the contest first to access this tab' : ''}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
              <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#0d0d14] rounded-xl border border-gray-800 p-6">
          
          {/* Details Tab */}
          {activeTab === 'details' && (
            <DetailsTab contest={contest} setContest={setContest} isNew={isNewContest} />
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <ChallengesTab 
              problems={problems} 
              slug={slug} 
              onRefresh={fetchContest}
            />
          )}

          {/* Advanced Settings Tab */}
          {activeTab === 'advanced' && (
            <AdvancedSettingsTab contest={contest} setContest={setContest} />
          )}

          {/* Moderators Tab */}
          {activeTab === 'moderators' && (
            <ModeratorsTab 
              moderators={moderators}
              newModerator={newModerator}
              setNewModerator={setNewModerator}
              onAdd={handleAddModerator}
              onRemove={handleRemoveModerator}
              owner={contest.owner}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationsTab 
              notifications={notifications}
              newNotification={newNotification}
              setNewNotification={setNewNotification}
              onSend={handleSendNotification}
            />
          )}

          {/* Signups Tab */}
          {activeTab === 'signups' && (
            <SignupsTab signups={signups} />
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <StatisticsTab statistics={statistics} />
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d14] border-t border-gray-800 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-4">
            {!isNewContest && (
              <>
                <button
                  onClick={() => window.open(`/contest/${slug}`, '_blank')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Landing Page
                </button>
                <button
                  onClick={() => window.open(`/contest/${slug}/problems`, '_blank')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Challenges Page
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== DETAILS TAB ==============
const DetailsTab = ({ contest, setContest, isNew }) => {
  const updateField = (field, value) => {
    setContest(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Contest Details */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Contest Details</h2>
        <p className="text-gray-400 text-sm mb-6">
          {isNew ? 'Get started by providing the initial details for your contest.' : 'Customize your contest by providing more information needed to create your landing page.'}
        </p>

        <div className="space-y-6">
          {/* Contest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contest.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              placeholder="Enter contest name"
            />
          </div>

          {/* Start Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={contest.startTime}
                  onChange={(e) => updateField('startTime', e.target.value)}
                  className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                />
                <span className="flex items-center text-gray-400">at</span>
                <input
                  type="time"
                  value={contest.startTimeTime}
                  onChange={(e) => updateField('startTimeTime', e.target.value)}
                  className="bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                />
                <span className="flex items-center text-gray-400">{contest.timezone}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={contest.endTime}
                  onChange={(e) => updateField('endTime', e.target.value)}
                  disabled={contest.hasNoEndTime}
                  className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <span className="flex items-center text-gray-400">at</span>
                <input
                  type="time"
                  value={contest.endTimeTime}
                  onChange={(e) => updateField('endTimeTime', e.target.value)}
                  disabled={contest.hasNoEndTime}
                  className="bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <span className="flex items-center text-gray-400">{contest.timezone}</span>
              </div>
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={contest.hasNoEndTime}
                  onChange={(e) => updateField('hasNoEndTime', e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                This contest has no end time.
              </label>
            </div>
          </div>

          {/* Organization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Type <span className="text-red-500">*</span>
              </label>
              <select
                value={contest.organizationType}
                onChange={(e) => updateField('organizationType', e.target.value)}
                className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="personal">Personal</option>
                <option value="college">College/University</option>
                <option value="company">Company</option>
                <option value="non-profit">Non Profit</option>
                <option value="community">Community</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contest.organizationName}
                onChange={(e) => updateField('organizationName', e.target.value)}
                className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="Enter organization name"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Landing Page Customization */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Landing Page Customization</h2>
        <p className="text-gray-400 text-sm mb-6">
          Fill out this information to customize your contest landing page.
        </p>

        <div className="space-y-6">
          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tagline</label>
            <textarea
              value={contest.tagline}
              onChange={(e) => updateField('tagline', e.target.value.slice(0, 100))}
              maxLength={100}
              rows={2}
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="A short tagline for your contest"
            />
            <p className="text-sm text-gray-500 mt-1">Characters left: {100 - (contest.tagline?.length || 0)}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <p className="text-gray-500 text-xs mb-2">Supports Markdown</p>
            <textarea
              value={contest.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={6}
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Please provide a short description of your contest here! This will also be used as metadata."
            />
          </div>

          {/* Prizes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prizes</label>
            <p className="text-gray-500 text-xs mb-2">Supports Markdown</p>
            <textarea
              value={contest.prizes}
              onChange={(e) => updateField('prizes', e.target.value)}
              rows={4}
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
              placeholder="- Prizes are optional. You may add any prizes that you would like to offer here."
            />
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rules</label>
            <p className="text-gray-500 text-xs mb-2">Supports Markdown</p>
            <textarea
              value={contest.rules}
              onChange={(e) => updateField('rules', e.target.value)}
              rows={4}
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
              placeholder="- Please provide any rules for your contest here."
            />
          </div>

          {/* Scoring */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Scoring</label>
            <p className="text-gray-500 text-xs mb-2">Supports Markdown</p>
            <textarea
              value={contest.scoring}
              onChange={(e) => updateField('scoring', e.target.value)}
              rows={4}
              className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

// ============== CHALLENGES TAB ==============
const ChallengesTab = ({ problems, slug, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Contest Challenges</h2>
      <p className="text-gray-400 text-sm mb-6">
        Add challenges to your contest by selecting challenges from our library or create and add your own challenges. 
        To reorder your challenges, simply select the challenge and then drag and drop to the desired location.
      </p>

      <button
        onClick={() => navigate(`/contests/${slug}/problems/create`)}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 mb-6"
      >
        <Plus className="w-4 h-4" />
        Add Challenge
      </button>

      {problems.length > 0 ? (
        <div className="space-y-2">
          {problems.map((problem, index) => (
            <div
              key={problem._id}
              className="bg-[#1a1a24] rounded-lg p-4 flex items-center gap-4 border border-gray-700 hover:border-gray-600"
            >
              <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />
              <span className="w-8 h-8 bg-amber-500/20 text-amber-500 rounded flex items-center justify-center font-bold">
                {problem.problemCode}
              </span>
              <div className="flex-1">
                <h3 className="font-medium">{problem.title}</h3>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    problem.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    problem.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {problem.difficulty}
                  </span>
                  <span className="text-gray-500 text-xs">{problem.maxScore} points</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/contests/${slug}/problems/${problem.slug}/edit`)}
                className="p-2 hover:bg-gray-700 rounded"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          No challenges have been added yet.
        </div>
      )}
    </div>
  );
};

// ============== ADVANCED SETTINGS TAB ==============
const AdvancedSettingsTab = ({ contest, setContest }) => {
  const updateField = (field, value) => setContest(prev => ({ ...prev, [field]: value }));
  const updateNested = (parent, field, value) => {
    setContest(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Contest Format */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Contest Format</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { id: 'normal', label: 'Normal', desc: 'Standard scoring with partial marks' },
            { id: 'icpc', label: 'ICPC Style', desc: 'ACM style with penalty for wrong submissions' },
            { id: 'codeforces-div2', label: 'CF Div2 Style', desc: 'Score decay over time' },
            { id: 'custom', label: 'Custom', desc: 'Fully customizable settings' }
          ].map(format => (
            <button
              key={format.id}
              onClick={() => updateField('contestFormat', format.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                contest.contestFormat === format.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="font-medium">{format.label}</h3>
              <p className="text-xs text-gray-400 mt-1">{format.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ICPC Settings */}
      {contest.contestFormat === 'icpc' && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Leaderboard Configurations</h2>
          <p className="text-gray-400 text-sm mb-4">
            The ACM style leaderboard allows penalty for wrong submissions and allows freezing leaderboard at a specific time.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Leaderboard</label>
              <select
                value={contest.leaderboardType}
                onChange={(e) => updateField('leaderboardType', e.target.value)}
                className="w-64 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
              >
                <option value="acm">ACM Leaderboard</option>
                <option value="ioi">IOI Leaderboard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Penalty</label>
              <p className="text-gray-500 text-xs mb-2">Penalty (in seconds) will be applied on each wrong submission</p>
              <input
                type="number"
                value={contest.icpcSettings?.penalty || 1200}
                onChange={(e) => updateNested('icpcSettings', 'penalty', parseInt(e.target.value))}
                className="w-32 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contest.icpcSettings?.penalizeCompilationError}
                onChange={(e) => updateNested('icpcSettings', 'penalizeCompilationError', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Penalize Compilation Error</span>
            </label>
          </div>
        </section>
      )}

      {/* Security Settings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Security Settings</h2>


        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={contest.screenLockEnabled}
              onChange={(e) => updateField('screenLockEnabled', e.target.checked)}
              className="rounded w-5 h-5"
            />
            <div>
              <span className="font-medium">Enable Screen Lock</span>
              <p className="text-sm text-gray-500">Participants must stay in the contest window</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={contest.fullscreenRequired}
              onChange={(e) => updateField('fullscreenRequired', e.target.checked)}
              className="rounded w-5 h-5"
            />
            <div>
              <span className="font-medium">Require Fullscreen</span>
              <p className="text-sm text-gray-500">Contest must be taken in fullscreen mode</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={contest.copyPasteDisabled}
              onChange={(e) => updateField('copyPasteDisabled', e.target.checked)}
              className="rounded w-5 h-5"
            />
            <div>
              <span className="font-medium">Disable Copy/Paste</span>
              <p className="text-sm text-gray-500">Prevent copying code from external sources</p>
            </div>
          </label>

          {contest.screenLockEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tab Switch Limit</label>
              <input
                type="number"
                value={contest.tabSwitchLimit}
                onChange={(e) => updateField('tabSwitchLimit', parseInt(e.target.value))}
                className="w-32 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">Number of allowed tab switches before warning</p>
            </div>
          )}
        </div>
      </section>

      {/* Allowed Languages */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Allowed Languages</h2>
        <div className="flex flex-wrap gap-3">
          {['cpp20', 'c', 'java', 'python3', 'pypy3'].map(lang => (
            <label key={lang} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] rounded-lg border border-gray-700">
              <input
                type="checkbox"
                checked={contest.allowedLanguages?.includes(lang)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateField('allowedLanguages', [...(contest.allowedLanguages || []), lang]);
                  } else {
                    updateField('allowedLanguages', (contest.allowedLanguages || []).filter(l => l !== lang));
                  }
                }}
                className="rounded"
              />
              <span className="font-medium">
                {lang === 'cpp20' ? 'C++ 20' : 
                 lang === 'python3' ? 'Python 3' : 
                 lang === 'pypy3' ? 'PyPy 3' :
                 lang.charAt(0).toUpperCase() + lang.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Forum Settings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Forum</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={contest.restrictedForum}
            onChange={(e) => updateField('restrictedForum', e.target.checked)}
            className="rounded"
          />
          <div>
            <span className="font-medium">Restricted Forum</span>
            <p className="text-sm text-gray-500">
              Participants can post questions but can't post answers. Only contest moderators will have permission to post answers.
            </p>
          </div>
        </label>
      </section>
    </div>
  );
};

// ============== MODERATORS TAB ==============
const ModeratorsTab = ({ moderators, newModerator, setNewModerator, onAdd, onRemove, owner }) => (
  <div>
    <h2 className="text-xl font-semibold mb-2">Modify Existing Moderators</h2>
    <p className="text-gray-400 text-sm mb-6">Users with moderator access can edit your contest.</p>

    <div className="flex gap-2 mb-6">
      <input
        type="text"
        value={newModerator}
        onChange={(e) => setNewModerator(e.target.value)}
        placeholder="Enter email or username"
        className="flex-1 max-w-md bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
      />
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg"
      >
        Add
      </button>
    </div>

    <div className="space-y-2">
      <div className="flex items-center gap-4 p-4 bg-[#1a1a24] rounded-lg">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
          {owner?.name?.[0] || 'O'}
        </div>
        <div className="flex-1">
          <p className="font-medium">{owner?.username || owner?.email}</p>
          <p className="text-sm text-amber-500">owner</p>
        </div>
      </div>
      
      {moderators.map(mod => (
        <div key={mod.user?._id} className="flex items-center gap-4 p-4 bg-[#1a1a24] rounded-lg">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
            {mod.user?.name?.[0] || 'M'}
          </div>
          <div className="flex-1">
            <p className="font-medium">{mod.user?.username || mod.user?.email}</p>
            <p className="text-sm text-gray-500">{mod.role}</p>
          </div>
          <button
            onClick={() => onRemove(mod.user?._id)}
            className="p-2 hover:bg-red-500/20 rounded"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ============== NOTIFICATIONS TAB ==============
const NotificationsTab = ({ notifications, newNotification, setNewNotification, onSend }) => (
  <div>
    <h2 className="text-xl font-semibold mb-2">Send Notification</h2>
    <p className="text-gray-400 text-sm mb-6">Send real-time notifications to all participants.</p>

    <div className="flex gap-2 mb-6">
      <select
        value={newNotification.type}
        onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
        className="bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
      >
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="urgent">Urgent</option>
      </select>
      <input
        type="text"
        value={newNotification.message}
        onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
        placeholder="Enter notification message"
        className="flex-1 bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
      />
      <button
        onClick={onSend}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg"
      >
        Send
      </button>
    </div>

    <h3 className="font-medium mb-4">Sent Notifications</h3>
    <div className="space-y-2">
      {notifications.length > 0 ? notifications.map((notif, i) => (
        <div key={i} className={`p-4 rounded-lg border ${
          notif.type === 'urgent' ? 'border-red-500/50 bg-red-500/10' :
          notif.type === 'warning' ? 'border-amber-500/50 bg-amber-500/10' :
          'border-gray-700 bg-[#1a1a24]'
        }`}>
          <p>{notif.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notif.sentAt).toLocaleString()}
          </p>
        </div>
      )) : (
        <p className="text-gray-500">No notifications sent yet</p>
      )}
    </div>
  </div>
);

// ============== SIGNUPS TAB ==============
const SignupsTab = ({ signups }) => (
  <div>
    <h2 className="text-xl font-semibold mb-2">Registered Participants</h2>
    <p className="text-gray-400 text-sm mb-6">{signups.length} users have signed up for this contest.</p>

    {signups.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Username</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Signed Up</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((signup, i) => (
              <tr key={signup._id} className="border-b border-gray-800">
                <td className="py-3 px-4">{i + 1}</td>
                <td className="py-3 px-4">{signup.user?.name || '-'}</td>
                <td className="py-3 px-4">{signup.user?.username || '-'}</td>
                <td className="py-3 px-4">{signup.user?.email || '-'}</td>
                <td className="py-3 px-4 text-gray-400">
                  {new Date(signup.signedUpAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    signup.status === 'participated' ? 'bg-green-500/20 text-green-400' :
                    signup.status === 'disqualified' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {signup.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500 text-center py-8">No participants have signed up yet</p>
    )}
  </div>
);

// ============== STATISTICS TAB ==============
const StatisticsTab = ({ statistics }) => (
  <div>
    <h2 className="text-xl font-semibold mb-6">Contest Statistics</h2>

    {statistics ? (
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a24] rounded-lg p-6 border border-gray-700">
          <p className="text-3xl font-bold text-amber-500">{statistics.signups || 0}</p>
          <p className="text-gray-400">Total Signups</p>
        </div>
        <div className="bg-[#1a1a24] rounded-lg p-6 border border-gray-700">
          <p className="text-3xl font-bold text-green-500">{statistics.participants || 0}</p>
          <p className="text-gray-400">Participants</p>
        </div>
        <div className="bg-[#1a1a24] rounded-lg p-6 border border-gray-700">
          <p className="text-3xl font-bold text-blue-500">
            {statistics.submissionStats?.reduce((a, b) => a + b.count, 0) || 0}
          </p>
          <p className="text-gray-400">Total Submissions</p>
        </div>
        <div className="bg-[#1a1a24] rounded-lg p-6 border border-gray-700">
          <p className="text-3xl font-bold text-purple-500">
            {statistics.submissionStats?.find(s => s._id === 'accepted')?.count || 0}
          </p>
          <p className="text-gray-400">Accepted</p>
        </div>
      </div>
    ) : (
      <p className="text-gray-500">Loading statistics...</p>
    )}
  </div>
);

export default ContestEditPage;
