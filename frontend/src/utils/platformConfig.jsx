import React from 'react';

// ─── SVG Icon Components for all 7 platforms ───────────────────────────────
// Each icon is a faithful reproduction of the official brand logo.

// LeetCode — black/orange angle bracket code logo (official newer logo)
export const LeetCodeIcon = ({ className = 'w-5 h-5', color }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    {/* Top-left black angular bracket */}
    <path d="M18 4L6 16" stroke="#263238" strokeWidth="4.5" strokeLinecap="round"/>
    {/* Bottom-left orange angular bracket */}
    <path d="M6 16L18 28" stroke={color || '#FFA116'} strokeWidth="4.5" strokeLinecap="round"/>
    {/* Middle gray dash */}
    <path d="M16 16H28" stroke="#B0BEC5" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

// Codeforces — three vertical bars: yellow, blue, red
export const CodeforcesIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="1" y="9" width="5" height="12" rx="1" fill="#F9A825"/>
    <rect x="9.5" y="3" width="5" height="18" rx="1" fill="#1976D2"/>
    <rect x="18" y="6" width="5" height="15" rx="1" fill="#D32F2F"/>
  </svg>
);

// CodeChef — Chef hat with smiling face and mustache
export const CodeChefIcon = ({ className = 'w-5 h-5', color }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none">
    {/* Chef hat */}
    <ellipse cx="20" cy="10" rx="11" ry="8" fill="#F5F0E8" stroke="#D5C8B0" strokeWidth="0.5"/>
    <rect x="12" y="10" width="16" height="8" rx="1" fill="#F5F0E8"/>
    <path d="M12 14 Q11 6 16 4 Q20 2 24 4 Q29 6 28 14" fill="#F5F0E8" stroke="#D5C8B0" strokeWidth="0.5"/>
    <line x1="16" y1="4" x2="16" y2="12" stroke="#D5C8B0" strokeWidth="0.3"/>
    <line x1="20" y1="3" x2="20" y2="12" stroke="#D5C8B0" strokeWidth="0.3"/>
    <line x1="24" y1="4" x2="24" y2="12" stroke="#D5C8B0" strokeWidth="0.3"/>
    {/* Face */}
    <ellipse cx="20" cy="24" rx="9" ry="9" fill="#F5F0E8"/>
    {/* Eyes */}
    <path d="M15 22 Q16 20 17.5 22" stroke="#5B4638" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M22.5 22 Q24 20 25.5 22" stroke="#5B4638" strokeWidth="1" fill="none" strokeLinecap="round"/>
    {/* Mustache */}
    <path d="M14 27 Q17 29 20 27 Q23 29 26 27" stroke="#5B4638" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {/* Mouth */}
    <path d="M17 29 Q20 31 23 29" stroke="#5B4638" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    {/* Angle brackets on cheeks */}
    <text x="11" y="27" fontSize="7" fill="#5B4638" fontWeight="bold" fontFamily="monospace">&lt;</text>
    <text x="26" y="27" fontSize="7" fill="#5B4638" fontWeight="bold" fontFamily="monospace">&gt;</text>
  </svg>
);

// GitHub — Octocat silhouette (official)
export const GitHubIcon = ({ className = 'w-5 h-5', color }) => (
  <svg className={className} viewBox="0 0 24 24" fill={color || '#24292f'}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// GeeksForGeeks — two mirrored G shapes (official green logo)
export const GeeksForGeeksIcon = ({ className = 'w-5 h-5', color }) => (
  <svg className={className} viewBox="0 0 24 24" fill={color || '#2F8D46'}>
    <path d="M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.695 4.51 4.51 0 0 1-3.116-.016 3.79 3.79 0 0 1-2.135-2.078 3.571 3.571 0 0 1-.282-.908h4.05a.8.8 0 0 0 .803-.8.8.8 0 0 0-.803-.8H14.2c.012-.202.038-.402.077-.598.098-.465.27-.908.508-1.313.36-.595.862-1.09 1.473-1.42.478-.265 1.011-.414 1.557-.436a4.035 4.035 0 0 1 1.653.26c.379.15.723.374 1.013.662.283.266.51.583.67.935a.75.75 0 0 0 1.005.385.755.755 0 0 0 .356-1.006 4.43 4.43 0 0 0-.958-1.347 4.784 4.784 0 0 0-1.478-.971 5.534 5.534 0 0 0-2.276-.436 5.533 5.533 0 0 0-2.128.558A5.462 5.462 0 0 0 13.7 8.11c-.359.555-.622 1.165-.776 1.807a7.063 7.063 0 0 0-.14 1.037H12a.8.8 0 0 0-.803.8.8.8 0 0 0 .803.8h.784c.024.28.068.557.13.83.187.789.53 1.53 1.007 2.17a5.472 5.472 0 0 0 2.763 2.066 5.558 5.558 0 0 0 2.15.373 5.44 5.44 0 0 0 2.182-.526 4.855 4.855 0 0 0 1.428-1.072 4.396 4.396 0 0 0 .88-1.39.754.754 0 0 0-.389-.989.749.749 0 0 0-.99.389l.003.001zM2.552 14.315c.143.28.334.532.565.745.321.291.697.512 1.104.695a4.51 4.51 0 0 0 3.116-.016 3.79 3.79 0 0 0 2.135-2.078c.126-.294.22-.602.282-.908H5.704a.8.8 0 0 1-.803-.8.8.8 0 0 1 .803-.8H9.8a5.514 5.514 0 0 0-.077-.598 4.647 4.647 0 0 0-.508-1.313 4.349 4.349 0 0 0-1.473-1.42A3.737 3.737 0 0 0 6.185 7.4a4.035 4.035 0 0 0-1.653.26 3.809 3.809 0 0 0-1.013.662 3.578 3.578 0 0 0-.67.935.75.75 0 0 1-1.005.385.755.755 0 0 1-.356-1.006 4.43 4.43 0 0 1 .958-1.347 4.784 4.784 0 0 1 1.478-.971 5.534 5.534 0 0 1 2.276-.436c.744.01 1.478.193 2.128.558.698.37 1.296.894 1.778 1.501.359.555.622 1.165.776 1.807.082.37.13.748.14 1.037H12a.8.8 0 0 1 .803.8.8.8 0 0 1-.803.8h-.784a5.514 5.514 0 0 1-.13.83 5.174 5.174 0 0 1-1.007 2.17 5.472 5.472 0 0 1-2.763 2.066 5.558 5.558 0 0 1-2.15.373 5.44 5.44 0 0 1-2.182-.526 4.855 4.855 0 0 1-1.428-1.072 4.396 4.396 0 0 1-.88-1.39.754.754 0 0 1 .389-.989c.44-.18.946.015 1.128.455l-.003.001z" />
  </svg>
);

// HackerRank — green hexagon with H arrows (official)
export const HackerRankIcon = ({ className = 'w-5 h-5', color }) => (
  <svg className={className} viewBox="0 0 24 24" fill={color || '#00EA64'}>
    <path d="M12 0c1.285 0 9.75 4.886 10.392 6 .645 1.115.645 10.885 0 12S13.287 24 12 24s-9.75-4.885-10.395-6c-.641-1.115-.641-10.885 0-12C2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v3.875H9.963V7.057c0-.143-.117-.258-.258-.258h-1.2c-.141 0-.258.115-.258.258v9.886c0 .143.117.258.258.258h1.2c.141 0 .258-.115.258-.258v-3.875h4.074v3.875c0 .143.117.258.258.258h1.2c.141 0 .258-.115.258-.258V7.057c0-.143-.117-.258-.258-.258h-1.2z" />
  </svg>
);

// Coding Ninjas — dark circle with orange C-bracket and ninja mask
export const CodingNinjasIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#3C3C3C"/>
    {/* Orange C bracket */}
    <path d="M15 7C15 7 10 7 8.5 9.5C7 12 8.5 14.5 8.5 14.5" stroke="#F96D00" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
    <path d="M8.5 14.5C8.5 14.5 10 17 15 17" stroke="#F96D00" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
    {/* Ninja mask / eyes */}
    <rect x="8" y="10.5" width="8" height="3" rx="1.5" fill="#fff" opacity="0.95"/>
    <circle cx="10.2" cy="12" r="1" fill="#3C3C3C"/>
    <circle cx="13.8" cy="12" r="1" fill="#3C3C3C"/>
  </svg>
);

// ─── Platform configuration with all metadata ──────────────────────────────

const PLATFORM_CONFIG = {
  leetcode: {
    name: 'LeetCode',
    key: 'leetcode',
    color: '#FFA116',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    gradient: 'from-amber-500 to-orange-500',
    icon: LeetCodeIcon,
    url: (username) => `https://leetcode.com/${username}`,
  },
  codeforces: {
    name: 'Codeforces',
    key: 'codeforces',
    color: '#1F8ACB',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    gradient: 'from-blue-500 to-indigo-600',
    icon: CodeforcesIcon,
    url: (username) => `https://codeforces.com/profile/${username}`,
  },
  codechef: {
    name: 'CodeChef',
    key: 'codechef',
    color: '#5B4638',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    gradient: 'from-amber-600 to-amber-700',
    icon: CodeChefIcon,
    url: (username) => `https://www.codechef.com/users/${username}`,
  },
  github: {
    name: 'GitHub',
    key: 'github',
    color: '#FFFFFF',
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-500/30',
    gradient: 'from-gray-700 to-gray-900',
    icon: GitHubIcon,
    url: (username) => `https://github.com/${username}`,
  },
  geeksforgeeks: {
    name: 'GeeksForGeeks',
    key: 'geeksforgeeks',
    color: '#2F8D46',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    gradient: 'from-green-500 to-emerald-600',
    icon: GeeksForGeeksIcon,
    url: (username) => `https://www.geeksforgeeks.org/user/${username}`,
  },
  hackerrank: {
    name: 'HackerRank',
    key: 'hackerrank',
    color: '#00EA64',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    gradient: 'from-green-600 to-teal-600',
    icon: HackerRankIcon,
    url: (username) => `https://www.hackerrank.com/profile/${username}`,
  },
  codingninjas: {
    name: 'Coding Ninjas',
    key: 'codingninjas',
    color: '#F96D00',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    gradient: 'from-orange-500 to-red-500',
    icon: CodingNinjasIcon,
    url: (username) => `https://www.naukri.com/code360/profile/${username}`,
  },
};

// ─── Helper: Render a platform icon by key ──────────────────────────────────

export const PlatformIcon = ({ platform, className = 'w-5 h-5', color }) => {
  const config = PLATFORM_CONFIG[platform?.toLowerCase()];
  if (!config) return null;
  const IconComponent = config.icon;
  return <IconComponent className={className} color={color} />;
};

// ─── Helper: Get config for a platform ──────────────────────────────────────

export const getPlatformConfig = (platform) => {
  return PLATFORM_CONFIG[platform?.toLowerCase()] || null;
};

// ─── Helper: Get platform name ──────────────────────────────────────────────

export const getPlatformName = (platform) => {
  return PLATFORM_CONFIG[platform?.toLowerCase()]?.name || platform;
};

// ─── Helper: Get platform color ─────────────────────────────────────────────

export const getPlatformColor = (platform) => {
  return PLATFORM_CONFIG[platform?.toLowerCase()]?.color || '#888';
};

export default PLATFORM_CONFIG;
