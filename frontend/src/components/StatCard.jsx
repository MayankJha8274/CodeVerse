import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    indigo: 'text-indigo-500'
  };

  return (
    <div className="bg-[#16161f] rounded-xl p-6 hover:bg-[#1a1a2e] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 font-medium mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-[#1a1a2e] ${colorClasses[color]}`}>
            <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trendValue}
          </span>
          <span className="text-sm text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
