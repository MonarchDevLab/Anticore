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

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-200 active:scale-95"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-3d.png"
          alt="Anticore 3D Shield"
          width={size}
          height={size}
          draggable={false}
          className="w-full h-full object-contain transition-all duration-300"
          style={{
            filter: running
              ? "drop-shadow(0 0 6px rgba(16, 185, 129, 0.65))"
              : "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.7))",
          }}
        />
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
