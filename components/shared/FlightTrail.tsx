"use client";

/** SVG 客机航迹虚线：从左下向右上掠过，增强「启航」意象 */
export function FlightTrail() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible opacity-70"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="trailGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(240,180,41,0)" />
          <stop offset="35%" stopColor="rgba(240,180,41,0.55)" />
          <stop offset="100%" stopColor="rgba(255,236,180,0.9)" />
        </linearGradient>
        <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        className="flight-trail-path"
        d="M 4 82 C 22 70, 38 58, 52 48 S 78 28, 96 14"
        fill="none"
        stroke="url(#trailGrad)"
        strokeWidth="0.35"
        strokeDasharray="1.2 1.6"
        filter="url(#trailGlow)"
        pathLength={100}
      />
      <g className="flight-dot">
        <circle r="0.9" fill="#ffe6a0">
          <animateMotion
            dur="7s"
            repeatCount="indefinite"
            path="M 4 82 C 22 70, 38 58, 52 48 S 78 28, 96 14"
          />
        </circle>
        <circle r="2.2" fill="rgba(240,180,41,0.25)">
          <animateMotion
            dur="7s"
            repeatCount="indefinite"
            path="M 4 82 C 22 70, 38 58, 52 48 S 78 28, 96 14"
          />
        </circle>
      </g>
    </svg>
  );
}
