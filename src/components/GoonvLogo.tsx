interface GoonvLogoProps {
  size?: number;
  className?: string;
}

export function GoonvLogo({ size = 120, className = '' }: GoonvLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Goonv logo"
    >
      <defs>
        <linearGradient id="goonv-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4520" />
          <stop offset="50%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#FF8F5A" />
        </linearGradient>
        <linearGradient id="goonv-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E83A18" />
          <stop offset="100%" stopColor="#FF5E3A" />
        </linearGradient>
        <filter id="goonv-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Short bottom bar */}
      <rect
        x="18"
        y="62"
        width="32"
        height="10"
        rx="5"
        fill="url(#goonv-grad-main)"
        transform="rotate(-42 34 67)"
        filter="url(#goonv-glow)"
      />

      {/* Medium top bar */}
      <rect
        x="14"
        y="48"
        width="44"
        height="10"
        rx="5"
        fill="url(#goonv-grad-main)"
        transform="rotate(-42 36 53)"
        filter="url(#goonv-glow)"
      />

      {/* Long center bar */}
      <rect
        x="10"
        y="34"
        width="58"
        height="11"
        rx="5.5"
        fill="url(#goonv-grad-main)"
        transform="rotate(-42 39 39.5)"
        filter="url(#goonv-glow)"
      />

      {/* Pointing accent — bigger & longer, opposite angle */}
      <rect
        x="58"
        y="14"
        width="46"
        height="11"
        rx="5.5"
        fill="url(#goonv-grad-accent)"
        transform="rotate(38 81 19.5)"
        filter="url(#goonv-glow)"
      />
    </svg>
  );
}
