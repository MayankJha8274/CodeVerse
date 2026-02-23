import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, ArrowLeft, Code2, Trophy } from 'lucide-react';

const featureInfo = {
  'problem-set': {
    icon: Code2,
    title: 'Problem Set',
    description: 'Create, manage, and share your own coding problems with the community.',
    color: 'from-violet-500 to-indigo-500',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-500',
  },
  'host-contest': {
    icon: Trophy,
    title: 'Host Contest',
    description: 'Host and manage competitive programming contests for your community.',
    color: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
  },
};

const ComingSoonPage = ({ feature = 'problem-set' }) => {
  const navigate = useNavigate();
  const info = featureInfo[feature] || featureInfo['problem-set'];
  const Icon = info.icon;

  return (
    <div className="min-h-full bg-white dark:bg-[#0d0d14] flex items-center justify-center transition-colors">
      <div className="max-w-lg w-full mx-auto px-6 py-16 text-center">

        {/* Animated icon */}
        <div className="relative inline-flex mb-8">
          <div className={`w-24 h-24 rounded-2xl ${info.iconBg} flex items-center justify-center`}>
            <Icon className={`w-12 h-12 ${info.iconColor}`} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
            <Rocket className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          Coming Soon
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {info.title}
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-3 leading-relaxed">
          {info.description}
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-base mb-10">
          This feature is currently under development and will be available soon. Stay tuned!
        </p>

        {/* Decorative progress bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-10">
          <div
            className={`h-full bg-gradient-to-r ${info.color} rounded-full`}
            style={{ width: '35%' }}
          ></div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#16161f] hover:bg-gray-200 dark:hover:bg-[#1e1e2e] text-gray-900 dark:text-white font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export const ProblemSetComingSoon = () => <ComingSoonPage feature="problem-set" />;
export const HostContestComingSoon = () => <ComingSoonPage feature="host-contest" />;

export default ComingSoonPage;
