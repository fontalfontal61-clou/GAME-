const CLOUDS = [
  { top: "6%", size: 110, dur: 110, delay: -20, opacity: 0.95 },
  { top: "16%", size: 70, dur: 80, delay: -55, opacity: 0.8 },
  { top: "28%", size: 140, dur: 140, delay: -90, opacity: 0.85 },
  { top: "46%", size: 80, dur: 100, delay: -35, opacity: 0.7 },
];

function Cloud({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 66" aria-hidden="true">
      <g fill="#fff">
        <ellipse cx="38" cy="44" rx="30" ry="20" />
        <ellipse cx="68" cy="34" rx="30" ry="26" />
        <ellipse cx="92" cy="46" rx="24" ry="17" />
        <rect x="20" y="42" width="84" height="21" rx="10" />
      </g>
    </svg>
  );
}

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Soleil */}
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-yellow-200/70 blur-sm" />
      <div className="absolute right-2 top-2 h-24 w-24 rounded-full bg-yellow-300 shadow-[0_0_60px_20px_rgba(253,224,71,0.6)]" />

      {/* Nuages */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="cloud"
          style={
            {
              top: c.top,
              opacity: c.opacity,
              "--cloud-dur": `${c.dur}s`,
              "--cloud-delay": `${c.delay}s`,
            } as React.CSSProperties
          }
        >
          <Cloud size={c.size} />
        </div>
      ))}

      {/* Collines */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        style={{ height: "22vh", minHeight: 110, maxHeight: 220 }}
      >
        <path
          d="M0 120 C 200 40, 380 40, 560 110 C 740 180, 900 60, 1100 70 C 1250 78, 1360 120, 1440 100 L1440 220 L0 220 Z"
          fill="#86efac"
        />
        <path
          d="M0 170 C 180 110, 360 120, 540 160 C 760 205, 980 120, 1200 150 C 1320 166, 1400 160, 1440 150 L1440 220 L0 220 Z"
          fill="#4ade80"
        />
        <g>
          <circle cx="220" cy="175" r="7" fill="#fde047" />
          <circle cx="260" cy="190" r="6" fill="#f9a8d4" />
          <circle cx="640" cy="185" r="7" fill="#fff" />
          <circle cx="990" cy="172" r="6" fill="#f9a8d4" />
          <circle cx="1220" cy="188" r="7" fill="#fde047" />
        </g>
      </svg>
    </div>
  );
}
