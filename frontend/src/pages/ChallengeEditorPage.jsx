import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, Loader2, AlertCircle, Check, X,
  Eye, Code, FileText, Settings, Play
} from 'lucide-react';
import api from '../services/api';

const TABS = [
  { id: 'details', label: 'Problem Details', icon: FileText },
  { id: 'testcases', label: 'Test Cases', icon: Code },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const ChallengeEditorPage = () => {
  const { contestSlug, problemSlug } = useParams();
  const navigate = useNavigate();
  const isNew = !problemSlug;
  
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [problem, setProblem] = useState({
    title: '',
    problemCode: '',
    difficulty: 'medium',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    explanation: '',
    hints: [''],
    editorial: '',
    maxScore: 100,
    timeLimit: 2,
    memoryLimit: 256,
    cfSettings: {
      initialScore: 500,
      decayEnabled: true
    },
    allowedLanguages: ['cpp20', 'java', 'python3', 'pypy3', 'c'],
    checkerType: 'exact',
    customChecker: '',
    isVisible: true
  });

  const [testCases, setTestCases] = useState([]);
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expectedOutput: '',
    isSample: false,
    isHidden: true,
    points: 10,
    explanation: ''
  });

  useEffect(() => {
    if (!isNew) {
      fetchProblem();
    }
  }, [problemSlug]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const data = await api.getContestProblem(contestSlug, problemSlug);
      setProblem(data.data);
      setTestCases(data.data.testCases || []);
    } catch (error) {
      console.error('Failed to fetch problem:', error);
      setError('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      if (!problem.title?.trim()) {
        setError('Problem title is required');
        return;
      }
      if (!problem.problemCode?.trim()) {
        setError('Problem code is required');
        return;
      }
      if (!problem.description?.trim()) {
        setError('Problem description is required');
        return;
      }

      const problemData = { ...problem };
      
      if (isNew) {
        const created = await api.createContestProblem(contestSlug, problemData);
        setSuccess('Problem created successfully!');
        setTimeout(() => navigate(`/contests/${contestSlug}/problems/${created.data.slug}/edit`), 1000);
      } else {
        await api.updateContestProblem(contestSlug, problemSlug, problemData);
        setSuccess('Problem saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTestCase = async () => {
    if (!newTestCase.input?.trim() && !newTestCase.expectedOutput?.trim()) {
      setError('Test case input and output are required');
      return;
    }

    try {
      await api.addTestCase(contestSlug, problemSlug || problem.slug, newTestCase);
      fetchProblem();
      setNewTestCase({
        input: '',
        expectedOutput: '',
        isSample: false,
        isHidden: true,
        points: 10,
        explanation: ''
      });
      setSuccess('Test case added');
    } catch (error) {
      setError(error.message || 'Failed to add test case');
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    try {
      await api.deleteTestCase(contestSlug, problemSlug, testCaseId);
      fetchProblem();
    } catch (error) {
      setError(error.message || 'Failed to delete test case');
    }
  };

  const updateField = (field, value) => {
    setProblem(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="bg-[#0d0d14] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/contests/${contestSlug}/edit`)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">
                Challenges &gt; {isNew ? 'Create Challenge' : problem.title}
              </div>
              <h1 className="text-2xl font-bold">
                {isNew ? 'Create Challenge' : `Edit: ${problem.title}`}
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isNew && tab.id === 'testcases'}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#1a1a24] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                } ${isNew && tab.id === 'testcases' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
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
            <DetailsTab problem={problem} updateField={updateField} />
          )}

          {/* Test Cases Tab */}
          {activeTab === 'testcases' && (
            <TestCasesTab 
              testCases={testCases}
              newTestCase={newTestCase}
              setNewTestCase={setNewTestCase}
              onAdd={handleAddTestCase}
              onDelete={handleDeleteTestCase}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab problem={problem} updateField={updateField} />
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d14] border-t border-gray-800 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-4">
            {!isNew && (
              <button
                onClick={() => window.open(`/contest/${contestSlug}/problem/${problemSlug}`, '_blank')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview Problem
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Challenge' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== DETAILS TAB ==============
const DetailsTab = ({ problem, updateField }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold mb-4">Problem Details</h2>
    <p className="text-gray-400 text-sm mb-6">
      Provide the problem statement and all necessary details. Markdown is supported.
    </p>

    {/* Basic Info */}
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Problem Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={problem.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          placeholder="e.g., Two Sum"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Problem Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={problem.problemCode}
          onChange={(e) => updateField('problemCode', e.target.value.toUpperCase())}
          className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          placeholder="e.g., A, B, C1"
          maxLength={5}
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
      <div className="flex gap-2">
        {['easy', 'medium', 'hard', 'expert'].map(diff => (
          <button
            key={diff}
            onClick={() => updateField('difficulty', diff)}
            className={`px-4 py-2 rounded-lg capitalize font-medium transition-colors ${
              problem.difficulty === diff
                ? diff === 'easy' ? 'bg-green-500 text-black' :
                  diff === 'medium' ? 'bg-amber-500 text-black' :
                  diff === 'hard' ? 'bg-red-500 text-white' :
                  'bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {diff}
          </button>
        ))}
      </div>
    </div>

    {/* Problem Statement */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Problem Statement <span className="text-red-500">*</span>
      </label>
      <p className="text-gray-500 text-xs mb-2">Supports Markdown - describe the problem clearly</p>
      <textarea
        value={problem.description}
        onChange={(e) => updateField('description', e.target.value)}
        rows={10}
        className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        placeholder="Describe the problem statement here..."
      />
    </div>

    {/* Input Format */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Input Format</label>
      <textarea
        value={problem.inputFormat}
        onChange={(e) => updateField('inputFormat', e.target.value)}
        rows={4}
        className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        placeholder="Describe the input format..."
      />
    </div>

    {/* Output Format */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
      <textarea
        value={problem.outputFormat}
        onChange={(e) => updateField('outputFormat', e.target.value)}
        rows={4}
        className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        placeholder="Describe the output format..."
      />
    </div>

    {/* Constraints */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Constraints</label>
      <textarea
        value={problem.constraints}
        onChange={(e) => updateField('constraints', e.target.value)}
        rows={4}
        className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        placeholder="1 ≤ n ≤ 10^5&#10;1 ≤ a[i] ≤ 10^9"
      />
    </div>

    {/* Sample I/O */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Sample Input</label>
        <textarea
          value={problem.sampleInput}
          onChange={(e) => updateField('sampleInput', e.target.value)}
          rows={5}
          className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Sample Output</label>
        <textarea
          value={problem.sampleOutput}
          onChange={(e) => updateField('sampleOutput', e.target.value)}
          rows={5}
          className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        />
      </div>
    </div>

    {/* Explanation */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Sample Explanation</label>
      <textarea
        value={problem.explanation}
        onChange={(e) => updateField('explanation', e.target.value)}
        rows={4}
        className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        placeholder="Explain the sample test case..."
      />
    </div>

    {/* Editorial */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Editorial (Optional)</label>
      <p className="text-gray-500 text-xs mb-2">Will be shown after contest ends</p>
      <textarea
        value={problem.editorial}
        onChange={(e) => updateField('editorial', e.target.value)}
        rows={6}
        className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
        placeholder="Provide solution approach and explanation..."
      />
    </div>
  </div>
);

// ============== TEST CASES TAB ==============
const TestCasesTab = ({ testCases, newTestCase, setNewTestCase, onAdd, onDelete }) => (
  <div>
    <h2 className="text-xl font-semibold mb-2">Test Cases</h2>
    <p className="text-gray-400 text-sm mb-6">
      Add test cases to validate submissions. Hidden test cases are not shown to participants.
    </p>

    {/* Add New Test Case */}
    <div className="bg-[#1a1a24] rounded-lg p-6 border border-gray-700 mb-6">
      <h3 className="font-medium mb-4">Add New Test Case</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Input</label>
          <textarea
            value={newTestCase.input}
            onChange={(e) => setNewTestCase(prev => ({ ...prev, input: e.target.value }))}
            rows={6}
            className="w-full bg-[#0a0a0f] border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Expected Output</label>
          <textarea
            value={newTestCase.expectedOutput}
            onChange={(e) => setNewTestCase(prev => ({ ...prev, expectedOutput: e.target.value }))}
            rows={6}
            className="w-full bg-[#0a0a0f] border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
          <input
            type="number"
            value={newTestCase.points}
            onChange={(e) => setNewTestCase(prev => ({ ...prev, points: parseInt(e.target.value) }))}
            className="w-24 bg-[#0a0a0f] border border-gray-600 rounded-lg px-4 py-2"
          />
        </div>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newTestCase.isSample}
            onChange={(e) => setNewTestCase(prev => ({ ...prev, isSample: e.target.checked, isHidden: !e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Sample test case</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newTestCase.isHidden}
            onChange={(e) => setNewTestCase(prev => ({ ...prev, isHidden: e.target.checked }))}
            className="rounded"
            disabled={newTestCase.isSample}
          />
          <span className="text-sm">Hidden</span>
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Explanation (optional)</label>
        <input
          type="text"
          value={newTestCase.explanation}
          onChange={(e) => setNewTestCase(prev => ({ ...prev, explanation: e.target.value }))}
          className="w-full bg-[#0a0a0f] border border-gray-600 rounded-lg px-4 py-2"
          placeholder="Explain this test case..."
        />
      </div>

      <button
        onClick={onAdd}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Test Case
      </button>
    </div>

    {/* Existing Test Cases */}
    <h3 className="font-medium mb-4">Existing Test Cases ({testCases.length})</h3>
    
    {testCases.length > 0 ? (
      <div className="space-y-3">
        {testCases.map((tc, i) => (
          <div key={tc._id || i} className="bg-[#1a1a24] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-amber-500/20 text-amber-500 rounded flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <div className="flex gap-2">
                  {tc.isSample && (
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">Sample</span>
                  )}
                  {tc.isHidden && (
                    <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded">Hidden</span>
                  )}
                  <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">{tc.points} pts</span>
                </div>
              </div>
              <button
                onClick={() => onDelete(tc._id)}
                className="p-2 hover:bg-red-500/20 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Input:</p>
                <pre className="bg-[#0a0a0f] rounded p-2 text-sm text-gray-300 font-mono overflow-x-auto max-h-24 overflow-y-auto">
                  {tc.input}
                </pre>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Expected Output:</p>
                <pre className="bg-[#0a0a0f] rounded p-2 text-sm text-gray-300 font-mono overflow-x-auto max-h-24 overflow-y-auto">
                  {tc.expectedOutput}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 text-center py-8">No test cases added yet</p>
    )}
  </div>
);

// ============== SETTINGS TAB ==============
const SettingsTab = ({ problem, updateField }) => (
  <div className="space-y-8">
    <h2 className="text-xl font-semibold mb-4">Problem Settings</h2>

    {/* Scoring */}
    <section>
      <h3 className="font-medium mb-4">Scoring</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Score</label>
          <input
            type="number"
            value={problem.maxScore}
            onChange={(e) => updateField('maxScore', parseInt(e.target.value))}
            className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Initial Score (CF style)</label>
          <input
            type="number"
            value={problem.cfSettings?.initialScore || 500}
            onChange={(e) => updateField('cfSettings', { ...problem.cfSettings, initialScore: parseInt(e.target.value) })}
            className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
          />
        </div>
      </div>
    </section>

    {/* Time and Memory Limits */}
    <section>
      <h3 className="font-medium mb-4">Limits</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (seconds)</label>
          <input
            type="number"
            step="0.5"
            value={problem.timeLimit}
            onChange={(e) => updateField('timeLimit', parseFloat(e.target.value))}
            className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Python/Java automatically get higher limits</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Memory Limit (MB)</label>
          <input
            type="number"
            value={problem.memoryLimit}
            onChange={(e) => updateField('memoryLimit', parseInt(e.target.value))}
            className="w-full bg-[#1a1a24] border border-gray-700 rounded-lg px-4 py-2"
          />
        </div>
      </div>
    </section>

    {/* Checker Type */}
    <section>
      <h3 className="font-medium mb-4">Output Checker</h3>
      <div className="space-y-3">
        {[
          { id: 'exact', label: 'Exact Match', desc: 'Output must match exactly (ignoring trailing spaces)' },
          { id: 'token', label: 'Token Match', desc: 'Output tokens must match (ignores whitespace)' },
          { id: 'float', label: 'Float Match', desc: 'For floating point with tolerance' },
          { id: 'custom', label: 'Custom Checker', desc: 'Write your own checker program' }
        ].map(checker => (
          <label
            key={checker.id}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              problem.checkerType === checker.id
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input
              type="radio"
              name="checker"
              checked={problem.checkerType === checker.id}
              onChange={() => updateField('checkerType', checker.id)}
              className="mt-1"
            />
            <div>
              <span className="font-medium">{checker.label}</span>
              <p className="text-sm text-gray-500">{checker.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </section>

    {/* Allowed Languages */}
    <section>
      <h3 className="font-medium mb-4">Allowed Languages</h3>
      <div className="flex flex-wrap gap-3">
        {['cpp20', 'c', 'java', 'python3', 'pypy3'].map(lang => (
          <label key={lang} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] rounded-lg border border-gray-700">
            <input
              type="checkbox"
              checked={problem.allowedLanguages?.includes(lang)}
              onChange={(e) => {
                if (e.target.checked) {
                  updateField('allowedLanguages', [...(problem.allowedLanguages || []), lang]);
                } else {
                  updateField('allowedLanguages', (problem.allowedLanguages || []).filter(l => l !== lang));
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

    {/* Visibility */}
    <section>
      <h3 className="font-medium mb-4">Visibility</h3>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={problem.isVisible}
          onChange={(e) => updateField('isVisible', e.target.checked)}
          className="rounded w-5 h-5"
        />
        <div>
          <span className="font-medium">Visible to Participants</span>
          <p className="text-sm text-gray-500">Uncheck to hide this problem until contest starts</p>
        </div>
      </label>
    </section>
  </div>
);

export default ChallengeEditorPage;
