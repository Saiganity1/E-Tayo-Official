import React from 'react';

interface LogoProps {
  className?: string;
  height?: number | string;
  textColor?: string;
}

export default function Logo({
  className = '',
  height = '100%',
  textColor = 'text-[#0038A8]'
}: LogoProps) {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`flex items-center justify-start max-w-full ${className}`} 
      id="etayo-logo-container"
      style={{ height: heightStyle, aspectRatio: '440/90' }}
    >
      <svg
        viewBox="0 0 440 90"
        className={`w-full h-full max-w-full ${textColor}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="etayo-logo-svg"
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Yellow/Gold Building Badge Icon */}
        <rect
          x="10"
          y="10"
          width="70"
          height="70"
          rx="16"
          ry="16"
          stroke="#FCD116"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Left flanking pillar */}
        <path
          d="M 25,70 L 25,43 A 5.5,5.5 0 0 1 36,43"
          stroke="#FCD116"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right flanking pillar */}
        <path
          d="M 54,43 A 5.5,5.5 0 0 1 65,43 L 65,70"
          stroke="#FCD116"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Central tower */}
        <path
          d="M 36,70 L 36,28 A 9,9 0 0 1 54,28 L 54,70"
          stroke="#FCD116"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Central arched door */}
        <path
          d="M 41,70 L 41,60 A 4,4 0 0 1 49,60 L 49,70"
          stroke="#FCD116"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Horizontal Window Lines */}
        <line
          x1="41"
          y1="38"
          x2="49"
          y2="38"
          stroke="#FCD116"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="41"
          y1="45"
          x2="49"
          y2="45"
          stroke="#FCD116"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="41"
          y1="52"
          x2="49"
          y2="52"
          stroke="#FCD116"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* eTAYO Tomasino Text */}
        <text
          x="100"
          y="58"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="44"
          fontWeight="800"
          letterSpacing="-1.5"
          fill="currentColor"
        >
          <tspan fontWeight="900">eTAYO</tspan>
          <tspan fontWeight="500" dx="10">Tomasino</tspan>
        </text>
      </svg>
    </div>
  );
}
