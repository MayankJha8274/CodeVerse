import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Play, Send, Clock, ChevronRight, ChevronDown, Check, X,
  AlertCircle, Loader2, Code, FileText, Trophy, List, Settings,
  Maximize, Minimize, AlertTriangle, Eye, EyeOff, Timer
} from 'lucide-react';
import api from '../services/api';

const LANGUAGE_CONFIG = {
  cpp20: { name: 'C++ 20', extension: 'cpp', mode: 'text/x-c++src' },
  c: { name: 'C', extension: 'c', mode: 'text/x-csrc' },
  java: { name: 'Java', extension: 'java', mode: 'text/x-java' },
  python3: { name: 'Python 3', extension: 'py', mode: 'python' },
  pypy3: { name: 'PyPy 3', extension: 'py', mode: 'python' }
};

const DEFAULT_CODE = {
  cpp20: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your code here
    
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    // Your code here
    
    return 0;
}`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Your code here
        
    }
}`,
  python3: `# Your code here
`,
  pypy3: `# Your code here (PyPy3)
`
};

const ContestParticipationPage = () => {
  const { contestSlug, problemSlug } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [showProblems, setShowProblems] = useState(false);
  
  // Code Editor State
  const [language, setLanguage] = useState('cpp20');
  const [code, setCode] = useState(DEFAULT_CODE.cpp20);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Execution State
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  // Screen Lock State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Timer
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    fetchContestData();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [contestSlug]);

  useEffect(() => {
    if (problemSlug && problems.length > 0) {
      const problem = problems.find(p => p.slug === problemSlug);
      if (problem) setCurrentProblem(problem);
    } else if (problems.length > 0 && !problemSlug) {
      setCurrentProblem(problems[0]);
    }
  }, [problemSlug, problems]);

  useEffect(() => {
    // Reset code when changing problem
    setCode(DEFAULT_CODE[language]);
    setOutput(null);
    fetchMySubmissions();
  }, [currentProblem?._id]);

  useEffect(() => {
    // Timer countdown
    if (!contest || !timeRemaining) return;
    
    const timer = setInterval(() => {
      const end = new Date(contest.endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [contest]);

  const fetchContestData = async () => {
    try {
      setLoading(true);
      const [contestData, problemsData] = await Promise.all([
        api.getHostedContest(contestSlug),
        api.getContestProblems(contestSlug)
      ]);
      
      setContest(contestData.data);
      setProblems(problemsData.data || []);
      
      // Calculate time remaining
      const end = new Date(contestData.data.endTime).getTime();
      setTimeRemaining(Math.max(0, end - Date.now()));
      
      // Check if screen lock is enabled
      if (contestData.data.securitySettings?.screenLockEnabled) {
        enterFullscreen();
      }
    } catch (error) {
      console.error('Failed to fetch contest:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    if (!currentProblem) return;
    try {
      const data = await api.getMySubmissions(contestSlug, currentProblem.slug);
      setSubmissions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden && contest?.securitySettings?.screenLockEnabled) {
      setTabSwitches(prev => {
        const newCount = prev + 1;
        const limit = contest?.securitySettings?.tabSwitchLimit || 3;
        
        if (newCount >= limit) {
          setWarningMessage(`You have switched tabs ${newCount} times. Further violations may lead to disqualification.`);
        } else {
          setWarningMessage(`Tab switch detected! You have ${limit - newCount} warnings left.`);
        }
        setShowWarning(true);
        
        return newCount;
      });
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
    
    if (!document.fullscreenElement && contest?.securitySettings?.fullscreenRequired) {
      setWarningMessage('Please stay in fullscreen mode during the contest.');
      setShowWarning(true);
    }
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;
    
    try {
      setRunning(true);
      setOutput({ status: 'running', message: 'Running your code...' });
      
      const result = await api.runCode({
        contestSlug,
        problemSlug: currentProblem.slug,
        language,
        code,
        customInput: showCustomInput ? customInput : undefined
      });
      
      setOutput(result);
    } catch (error) {
      setOutput({
        status: 'error',
        error: error.message || 'Failed to run code'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) return;
    
    try {
      setSubmitting(true);
      setOutput({ status: 'running', message: 'Submitting...' });
      
      const result = await api.submitSolution(contestSlug, currentProblem.slug, {
        language,
        code
      });
      
      setOutput({
        status: result.data.status,
        verdict: result.data.verdict,
        score: result.data.score,
        testCaseResults: result.data.testCaseResults,
        executionTime: result.data.executionTime
      });
      
      fetchMySubmissions();
    } catch (error) {
      setOutput({
        status: 'error',
        error: error.message || 'Failed to submit'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '00:00:00';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1a1a24] rounded-xl p-8 max-w-md text-center border border-amber-500">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">Warning!</h2>
            <p className="text-gray-300 mb-6">{warningMessage}</p>
            <button
              onClick={() => {
                setShowWarning(false);
                if (contest?.securitySettings?.fullscreenRequired) {
                  enterFullscreen();
                }
              }}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0d0d14] border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/contest/${contestSlug}`} className="p-2 hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{contest?.name}</h1>
              <span className="text-sm text-gray-400">{problems.length} Problems</span>
            </div>
          </div>
          
          {/* Timer */}
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Timer className="w-5 h-5 text-amber-500" />
            <span className={`font-mono text-lg ${timeRemaining && timeRemaining < 300000 ? 'text-red-500' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to={`/contest/${contestSlug}/leaderboard`}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
            
            {contest?.securitySettings?.fullscreenRequired && (
              <button
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem List Sidebar */}
        <div className={`bg-[#0d0d14] border-r border-gray-800 transition-all ${showProblems ? 'w-64' : 'w-12'}`}>
          <button
            onClick={() => setShowProblems(!showProblems)}
            className="w-full p-3 flex items-center justify-center hover:bg-gray-800"
          >
            <List className="w-5 h-5" />
          </button>
          
          {showProblems && (
            <div className="p-2 space-y-1">
              {problems.map((problem, i) => (
                <button
                  key={problem._id}
                  onClick={() => {
                    setCurrentProblem(problem);
                    navigate(`/contest/${contestSlug}/problem/${problem.slug}`);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-left ${
                    currentProblem?.slug === problem.slug
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <span className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-xs font-bold">
                    {problem.problemCode}
                  </span>
                  <span className="flex-1 truncate text-sm">{problem.title}</span>
                  {submissions.some(s => s.problem === problem._id && s.status === 'accepted') && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Problem Statement */}
        <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-6">
          {currentProblem ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded font-bold">
                  {currentProblem.problemCode}
                </span>
                <h2 className="text-2xl font-bold">{currentProblem.title}</h2>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  currentProblem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  currentProblem.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  currentProblem.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {currentProblem.difficulty}
                </span>
              </div>

              <div className="flex gap-4 mb-6 text-sm text-gray-400">
                <span>Score: {currentProblem.maxScore}</span>
                <span>Time: {currentProblem.timeLimit}s</span>
                <span>Memory: {currentProblem.memoryLimit}MB</span>
              </div>

              {/* Problem Description */}
              <div className="prose prose-invert max-w-none mb-6">
                <div className="whitespace-pre-wrap">{currentProblem.description}</div>
              </div>

              {/* Input Format */}
              {currentProblem.inputFormat && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Input Format</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{currentProblem.inputFormat}</div>
                </div>
              )}

              {/* Output Format */}
              {currentProblem.outputFormat && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Output Format</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{currentProblem.outputFormat}</div>
                </div>
              )}

              {/* Constraints */}
              {currentProblem.constraints && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Constraints</h3>
                  <pre className="bg-[#1a1a24] rounded-lg p-4 text-gray-300 text-sm overflow-x-auto">
                    {currentProblem.constraints}
                  </pre>
                </div>
              )}

              {/* Sample I/O */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Sample</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Input</p>
                    <pre className="bg-[#1a1a24] rounded-lg p-4 text-gray-300 text-sm overflow-x-auto">
                      {currentProblem.sampleInput}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Output</p>
                    <pre className="bg-[#1a1a24] rounded-lg p-4 text-gray-300 text-sm overflow-x-auto">
                      {currentProblem.sampleOutput}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              {currentProblem.explanation && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Explanation</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{currentProblem.explanation}</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a problem to view
            </div>
          )}
        </div>

        {/* Code Editor Panel */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-[#0d0d14] border-b border-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setCode(DEFAULT_CODE[e.target.value]);
                }}
                className="bg-[#1a1a24] border border-gray-700 rounded px-3 py-1 text-sm"
              >
                {(currentProblem?.allowedLanguages || Object.keys(LANGUAGE_CONFIG)).map(lang => (
                  <option key={lang} value={lang}>{LANGUAGE_CONFIG[lang]?.name || lang}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={running || submitting}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run
              </button>
              <button
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-black font-medium rounded flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onPaste={(e) => {
                if (contest?.securitySettings?.copyPasteDisabled) {
                  e.preventDefault();
                  setWarningMessage('Copy/Paste is disabled for this contest.');
                  setShowWarning(true);
                }
              }}
              className="flex-1 bg-[#0a0a0f] p-4 font-mono text-sm text-white resize-none focus:outline-none"
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </div>

          {/* Custom Input Toggle */}
          <div className="border-t border-gray-800">
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-800/50"
            >
              <span className="flex items-center gap-2 text-sm">
                <Code className="w-4 h-4" />
                Custom Input
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCustomInput ? 'rotate-180' : ''}`} />
            </button>
            
            {showCustomInput && (
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0a0f] px-4 py-2 font-mono text-sm text-white resize-none focus:outline-none border-t border-gray-700"
                placeholder="Enter custom input here..."
              />
            )}
          </div>

          {/* Output Panel */}
          {output && (
            <div className="border-t border-gray-800 bg-[#0d0d14] max-h-64 overflow-y-auto">
              <div className="p-4">
                {output.status === 'running' ? (
                  <div className="flex items-center gap-2 text-amber-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {output.message}
                  </div>
                ) : output.status === 'error' ? (
                  <div className="text-red-400">
                    <p className="font-medium mb-2">Error</p>
                    <pre className="text-sm">{output.error}</pre>
                  </div>
                ) : output.verdict ? (
                  // Submission result
                  <div>
                    <div className={`flex items-center gap-2 mb-3 ${
                      output.verdict === 'Accepted' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {output.verdict === 'Accepted' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      <span className="font-bold text-lg">{output.verdict}</span>
                      {output.score !== undefined && (
                        <span className="ml-2 text-gray-400">Score: {output.score}</span>
                      )}
                    </div>
                    
                    {output.testCaseResults && (
                      <div className="flex flex-wrap gap-2">
                        {output.testCaseResults.map((tc, i) => (
                          <div
                            key={i}
                            className={`px-3 py-1 rounded text-sm ${
                              tc.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            Test {i + 1}: {tc.passed ? 'Passed' : tc.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Run output
                  <div>
                    <p className="font-medium mb-2">Output</p>
                    <pre className="bg-[#0a0a0f] rounded p-3 text-sm text-gray-300 overflow-x-auto">
                      {output.stdout || output.output || '(no output)'}
                    </pre>
                    {output.stderr && (
                      <>
                        <p className="font-medium mt-3 mb-2 text-red-400">Stderr</p>
                        <pre className="bg-[#0a0a0f] rounded p-3 text-sm text-red-300 overflow-x-auto">
                          {output.stderr}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          {submissions.length > 0 && (
            <div className="border-t border-gray-800 bg-[#0d0d14] p-4">
              <h3 className="text-sm font-medium mb-2">Recent Submissions</h3>
              <div className="space-y-1">
                {submissions.slice(0, 3).map((sub, i) => (
                  <div key={sub._id || i} className="flex items-center justify-between text-sm bg-[#1a1a24] rounded px-3 py-2">
                    <span className={`font-medium ${
                      sub.status === 'accepted' ? 'text-green-500' :
                      sub.status === 'wrong_answer' ? 'text-red-500' :
                      'text-amber-500'
                    }`}>
                      {sub.verdict || sub.status}
                    </span>
                    <span className="text-gray-400">{sub.language}</span>
                    <span className="text-gray-500">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestParticipationPage;
