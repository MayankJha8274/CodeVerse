import React from 'react';

const Logo = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 1024 1024"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="codeverseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="30%" stopColor="#F97316" />
        <stop offset="70%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>

    {/* The Outer 'C' ring */}
    <path
      d="M 680 200 A 350 350 0 1 0 680 824"
      fill="none"
      stroke="url(#codeverseGradient)"
      strokeWidth="120"
      strokeLinecap="round"
    />
    
    {/* Inner sparks/stars */}
    <path d="M 300 400 L 320 450 L 370 470 L 320 490 L 300 540 L 280 490 L 230 470 L 280 450 Z" fill="#FBBF24" />
    <path d="M 400 300 L 410 330 L 440 340 L 410 350 L 400 380 L 390 350 L 360 340 L 390 330 Z" fill="#F472B6" />
    <path d="M 350 650 L 360 670 L 390 680 L 360 690 L 350 710 L 340 690 L 310 680 L 340 670 Z" fill="#A78BFA" />

    {/* Center Cursor */}
    <path
      d="M 450 400 L 780 550 L 600 630 L 450 850 Z"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="20"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;