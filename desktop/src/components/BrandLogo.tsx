interface BrandLogoProps {
  size?: number;
  running?: boolean;
  showText?: boolean;
  className?: string;
}

export default function BrandLogo({
  size = 28,
  running = false,
  showText = true,
  className = "",
}: BrandLogoProps) {
  const accentColor = running ? "#10b981" : "#ef4444";
  const glowColor = running ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.35)";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-200 active:scale-95"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            <filter id={`glow-${running ? "on" : "off"}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="shieldGrad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="cyberBorder" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={running ? "#059669" : "#b91c1c"} />
            </linearGradient>
          </defs>

          {/* Dış Siber Daire & Glow */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
            className={running ? "animate-spin-slow origin-center" : ""}
          />

          {/* Arka Kalkan Katmanı */}
          <path
            d="M24 7L38 12.5V23.5C38 32.5 32 39 24 42C16 39 10 32.5 10 23.5V12.5L24 7Z"
            fill="url(#shieldGrad)"
            stroke="url(#cyberBorder)"
            strokeWidth="2"
            filter={`url(#glow-${running ? "on" : "off"})`}
          />

          {/* İç Plazma Çekirdeği */}
          <path
            d="M24 13L32 17V24C32 29.5 28.5 33.5 24 35.5C19.5 33.5 16 29.5 16 24V17L24 13Z"
            fill={glowColor}
            stroke={accentColor}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Kalkan İçi Onay / Kilit İmzası */}
          <path
            d="M20 24L23 27L28 21"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-paper-bright font-mono text-sm uppercase">
              ANTICORE
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border transition-colors"
              style={{
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              {running ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <span className="text-[10px] text-paper-muted font-mono tracking-tight mt-0.5">
            Sovereign DPI Bypass
          </span>
        </div>
      )}
    </div>
  );
}
