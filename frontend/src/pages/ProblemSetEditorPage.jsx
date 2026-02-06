import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  LightBulbIcon,
  DocumentTextIcon,
  BeakerIcon,
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const TABS = [
  { id: 'details', label: 'Problem Details', icon: DocumentTextIcon },
  { id: 'testcases', label: 'Test Cases', icon: BeakerIcon },
  { id: 'moderators', label: 'Moderators', icon: UserGroupIcon },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
];

const LANGUAGES = [
  { value: 'cpp20', label: 'C++ 20' },
  { value: 'java', label: 'Java' },
  { value: 'python3', label: 'Python 3' },
  { value: 'pypy3', label: 'PyPy 3' },
  { value: 'c', label: 'C' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' }
];

const ProblemSetEditorPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!slug;

  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState({
    title: '',
    problemCode: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    explanation: '',
    difficulty: 'medium',
    tags: [],
    maxScore: 100,
    timeLimit: 2,
    memoryLimit: 256,
    allowedLanguages: ['cpp20', 'java', 'python3', 'pypy3', 'c'],
    checkerType: 'exact',
    hints: [],
    editorial: '',
    visibility: 'private'
  });
  const [testCases, setTestCases] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newModerator, setNewModerator] = useState({ identifier: '', role: 'editor' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchProblem();
    }
  }, [slug]);

  const fetchProblem = async () => {
    try {
      const response = await api.getProblem(slug);
      const data = response.data;
      setProblem({
        title: data.title || '',
        problemCode: data.problemCode || '',
        description: data.description || '',
        inputFormat: data.inputFormat || '',
        outputFormat: data.outputFormat || '',
        constraints: data.constraints || '',
        sampleInput: data.sampleInput || '',
        sampleOutput: data.sampleOutput || '',
        explanation: data.explanation || '',
        difficulty: data.difficulty || 'medium',
        tags: data.tags || [],
        maxScore: data.maxScore || 100,
        timeLimit: data.timeLimit || 2,
        memoryLimit: data.memoryLimit || 256,
        allowedLanguages: data.allowedLanguages || ['cpp20', 'java', 'python3', 'pypy3', 'c'],
        checkerType: data.checkerType || 'exact',
        hints: data.hints || [],
        editorial: data.editorial || '',
        visibility: data.visibility || 'private'
      });
      setTestCases(data.testCases || []);
      setModerators(data.moderators || []);
    } catch (error) {
      console.error('Error fetching problem:', error);
      navigate('/problem-set');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!problem.title.trim()) newErrors.title = 'Title is required';
    if (!problem.description.trim()) newErrors.description = 'Description is required';
    if (problem.maxScore < 1) newErrors.maxScore = 'Max score must be at least 1';
    if (problem.timeLimit < 0.5) newErrors.timeLimit = 'Time limit must be at least 0.5s';
    if (problem.memoryLimit < 16) newErrors.memoryLimit = 'Memory limit must be at least 16MB';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (isEdit) {
        await api.updateProblem(slug, problem);
      } else {
        const response = await api.createProblem(problem);
        const createdSlug = response.data?.slug || response.slug;
        if (createdSlug) {
          navigate(`/problem-set/${createdSlug}/edit`);
          return;
        }
      }
      
      // Show success message
      alert('Problem saved successfully!');
    } catch (error) {
      console.error('Error saving problem:', error);
      alert(error.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !problem.tags.includes(newTag.trim())) {
      setProblem(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setProblem(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddHint = () => {
    if (newHint.trim()) {
      setProblem(prev => ({ ...prev, hints: [...prev.hints, newHint.trim()] }));
      setNewHint('');
    }
  };

  const handleRemoveHint = (index) => {
    setProblem(prev => ({ ...prev, hints: prev.hints.filter((_, i) => i !== index) }));
  };

  const handleAddTestCase = async () => {
    if (!isEdit) {
      alert('Please save the problem first to add test cases');
      return;
    }

    try {
      await api.addProblemTestCase(slug, {
        input: '',
        expectedOutput: '',
        isSample: false,
        isHidden: true,
        points: 10
      });
      fetchProblem();
    } catch (error) {
      alert(error.message || 'Failed to add test case');
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!confirm('Delete this test case?')) return;

    try {
      await api.deleteProblemTestCase(slug, testCaseId);
      setTestCases(prev => prev.filter(tc => tc._id !== testCaseId));
    } catch (error) {
      alert(error.message || 'Failed to delete test case');
    }
  };

  const handleAddModerator = async () => {
    if (!newModerator.identifier.trim()) return;
    if (!isEdit) {
      alert('Please save the problem first to add moderators');
      return;
    }

    try {
      await api.addProblemModerator(slug, newModerator.identifier, newModerator.role);
      fetchProblem();
      setNewModerator({ identifier: '', role: 'editor' });
    } catch (error) {
      alert(error.message || 'Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (userId) => {
    if (!confirm('Remove this moderator?')) return;

    try {
      await api.removeProblemModerator(slug, userId);
      setModerators(prev => prev.filter(m => m.user._id !== userId));
    } catch (error) {
      alert(error.message || 'Failed to remove moderator');
    }
  };

  const handleLanguageToggle = (lang) => {
    setProblem(prev => ({
      ...prev,
      allowedLanguages: prev.allowedLanguages.includes(lang)
        ? prev.allowedLanguages.filter(l => l !== lang)
        : [...prev.allowedLanguages, lang]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/problem-set')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEdit ? 'Edit Problem' : 'Create Problem'}
                </h1>
                {isEdit && problem.title && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{problem.title}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Save
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!isEdit && tab.id !== 'details'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={problem.title}
                      onChange={(e) => setProblem(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="e.g., Two Sum"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Problem Code
                      </label>
                      <input
                        type="text"
                        value={problem.problemCode}
                        onChange={(e) => setProblem(prev => ({ ...prev, problemCode: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., TWOSUM"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={problem.difficulty}
                        onChange={(e) => setProblem(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={problem.description}
                      onChange={(e) => setProblem(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm`}
                      placeholder="Problem description (supports markdown)..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Input Format
                      </label>
                      <textarea
                        value={problem.inputFormat}
                        onChange={(e) => setProblem(prev => ({ ...prev, inputFormat: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="Describe input format..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Output Format
                      </label>
                      <textarea
                        value={problem.outputFormat}
                        onChange={(e) => setProblem(prev => ({ ...prev, outputFormat: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="Describe output format..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Constraints
                    </label>
                    <textarea
                      value={problem.constraints}
                      onChange={(e) => setProblem(prev => ({ ...prev, constraints: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="e.g., 1 ≤ n ≤ 10^5"
                    />
                  </div>
                </div>
              </div>

              {/* Sample I/O */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sample Input/Output</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sample Input
                    </label>
                    <textarea
                      value={problem.sampleInput}
                      onChange={(e) => setProblem(prev => ({ ...prev, sampleInput: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sample Output
                    </label>
                    <textarea
                      value={problem.sampleOutput}
                      onChange={(e) => setProblem(prev => ({ ...prev, sampleOutput: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={problem.explanation}
                    onChange={(e) => setProblem(prev => ({ ...prev, explanation: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Explain the sample output..."
                  />
                </div>
              </div>

              {/* Hints */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hints</h2>
                </div>
                
                <div className="space-y-2 mb-4">
                  {problem.hints.map((hint, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{index + 1}.</span>
                      <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{hint}</p>
                      <button
                        onClick={() => handleRemoveHint(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHint()}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add a hint..."
                  />
                  <button
                    onClick={handleAddHint}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Editorial */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editorial</h2>
                <textarea
                  value={problem.editorial}
                  onChange={(e) => setProblem(prev => ({ ...prev, editorial: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Write the solution explanation (supports markdown)..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tags */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="Add tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Score & Limits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score & Limits</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      value={problem.maxScore}
                      onChange={(e) => setProblem(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={problem.timeLimit}
                      onChange={(e) => setProblem(prev => ({ ...prev, timeLimit: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Memory Limit (MB)
                    </label>
                    <input
                      type="number"
                      value={problem.memoryLimit}
                      onChange={(e) => setProblem(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Allowed Languages</h2>
                
                <div className="space-y-2">
                  {LANGUAGES.map((lang) => (
                    <label key={lang.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={problem.allowedLanguages.includes(lang.value)}
                        onChange={() => handleLanguageToggle(lang.value)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === 'testcases' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Cases</h2>
              <button
                onClick={handleAddTestCase}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                <PlusIcon className="w-5 h-5" />
                Add Test Case
              </button>
            </div>

            {testCases.length === 0 ? (
              <div className="text-center py-12">
                <BeakerIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No test cases yet. Add some to judge submissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testCases.map((tc, index) => (
                  <div key={tc._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-white">Test Case #{index + 1}</span>
                        {tc.isSample && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                            Sample
                          </span>
                        )}
                        {tc.isHidden ? (
                          <EyeSlashIcon className="w-4 h-4 text-gray-400" title="Hidden" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" title="Visible" />
                        )}
                        <span className="text-sm text-gray-500">{tc.points} pts</span>
                      </div>
                      <button
                        onClick={() => handleDeleteTestCase(tc._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input</label>
                        <pre className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white overflow-x-auto max-h-32">
                          {tc.input || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output</label>
                        <pre className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white overflow-x-auto max-h-32">
                          {tc.expectedOutput || '(empty)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Moderators Tab */}
        {activeTab === 'moderators' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Moderators</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add users who can help manage this problem. Editors can edit the problem; viewers can only view.
            </p>

            {/* Add Moderator */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newModerator.identifier}
                onChange={(e) => setNewModerator(prev => ({ ...prev, identifier: e.target.value }))}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Username or email"
              />
              <select
                value={newModerator.role}
                onChange={(e) => setNewModerator(prev => ({ ...prev, role: e.target.value }))}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={handleAddModerator}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Add
              </button>
            </div>

            {/* Moderators List */}
            {moderators.length === 0 ? (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">No moderators added yet.</p>
            ) : (
              <div className="space-y-3">
                {moderators.map((mod) => (
                  <div key={mod.user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {(mod.user.name || mod.user.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{mod.user.name || mod.user.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{mod.user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        mod.role === 'editor'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {mod.role}
                      </span>
                      <button
                        onClick={() => handleRemoveModerator(mod.user._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Problem Settings</h2>

              {/* Visibility */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Visibility
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'private', label: 'Private', desc: 'Only you and moderators can view', icon: EyeSlashIcon },
                    { value: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link can view', icon: EyeIcon },
                    { value: 'public', label: 'Public', desc: 'Visible to everyone in the problem set', icon: EyeIcon }
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        problem.visibility === opt.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={opt.value}
                        checked={problem.visibility === opt.value}
                        onChange={(e) => setProblem(prev => ({ ...prev, visibility: e.target.value }))}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">{opt.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Checker Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Checker Type
                </label>
                <select
                  value={problem.checkerType}
                  onChange={(e) => setProblem(prev => ({ ...prev, checkerType: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="exact">Exact Match</option>
                  <option value="ignore_whitespace">Ignore Trailing Whitespace</option>
                  <option value="ignore_case">Ignore Case</option>
                  <option value="float_tolerance">Float Tolerance (1e-6)</option>
                  <option value="custom">Custom Checker</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemSetEditorPage;
