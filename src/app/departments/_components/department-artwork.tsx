/**
 * Hand-drawn SVG artwork for the departments page.
 *
 * Every illustration is recreated here as vector line art in the
 * navy-and-gold palette — no screenshot reuse, no external images.
 */

export function HeroCommunityIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 420 280"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Cross */}
      <path
        d="M202 26h16v34h34v16h-34v56h-16V76h-34V60h34V26Z"
        stroke="#D9B66D"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Rays around the cross */}
      <g stroke="#D9B66D" strokeWidth="5" strokeLinecap="round">
        <path d="M210 4v12" />
        <path d="M166 40l-9-9" />
        <path d="M254 40l9-9" />
        <path d="M148 68h-13" />
        <path d="M272 68h13" />
      </g>
      {/* Community of five */}
      <g stroke="#D9B66D" strokeWidth="5" strokeLinecap="round">
        <circle cx="70" cy="170" r="16" />
        <path d="M40 254v-24a30 30 0 0 1 60 0v24" />
        <path d="M44 222l-12-12" />
        <circle cx="140" cy="170" r="16" />
        <path d="M110 254v-24a30 30 0 0 1 60 0v24" />
        <circle cx="210" cy="170" r="16" />
        <path d="M180 254v-24a30 30 0 0 1 60 0v24" />
        <circle cx="280" cy="170" r="16" />
        <path d="M250 254v-24a30 30 0 0 1 60 0v24" />
        <circle cx="350" cy="170" r="16" />
        <path d="M320 254v-24a30 30 0 0 1 60 0v24" />
        <path d="M376 222l12-12" />
      </g>
    </svg>
  );
}

export function DepartmentIcon({
  slug,
  className = "size-12",
}: {
  slug: string;
  className?: string;
}) {
  const props = {
    viewBox: "0 0 64 64",
    fill: "none",
    "aria-hidden": true,
    className,
    stroke: "currentColor",
    strokeWidth: 3,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  switch (slug) {
    case "choir":
      return (
        <svg {...props}>
          <ellipse cx="24" cy="31" rx="6" ry="5" />
          <path d="M30 31V8" />
          <path d="M30 8c8 1 10 7 9 13" />
          <circle cx="16" cy="45" r="4.5" />
          <path d="M7 60v-5a9 9 0 0 1 18 0v5" />
          <circle cx="32" cy="45" r="4.5" />
          <path d="M23 60v-5a9 9 0 0 1 18 0v5" />
          <circle cx="48" cy="45" r="4.5" />
          <path d="M39 60v-5a9 9 0 0 1 18 0v5" />
        </svg>
      );
    case "media":
      return (
        <svg {...props}>
          <circle cx="22" cy="14" r="6" />
          <circle cx="22" cy="14" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="38" cy="14" r="6" />
          <circle cx="38" cy="14" r="1.4" fill="currentColor" stroke="none" />
          <rect x="10" y="24" width="32" height="22" rx="4" />
          <path d="M42 30l12-7v18l-12-7" />
          <path d="M23 32.5l7 3.5-7 3.5v-7Z" />
        </svg>
      );
    case "pastors":
      return (
        <svg {...props}>
          <circle cx="32" cy="15" r="8" />
          <path d="M16 41v-3a16 16 0 0 1 32 0v3" />
          <path d="M14 44c6-3 12-3 18 0 6-3 12-3 18 0v9c-6-3-12-3-18 0-6-3-12-3-18 0v-9Z" />
          <path d="M32 44v9" />
        </svg>
      );
    case "ushering":
      return (
        <svg {...props}>
          <rect x="5" y="24" width="9" height="14" rx="2" />
          <rect x="50" y="24" width="9" height="14" rx="2" />
          <path d="M14 27h12l9 6-8 10H18l-4-5V27Z" />
          <path d="M50 27H38l-9 6 8 10h9l4-5v-11Z" />
          <path d="M29 36l6 2.5M28 40.5l5 2" />
        </svg>
      );
    case "intercessory":
      return (
        <svg {...props}>
          <path d="M32 8v44" />
          <path d="M32 13c-6 8-10 18-10 28 0 6 4 9 8 9" />
          <path d="M32 13c6 8 10 18 10 28 0 6-4 9-8 9" />
          <path d="M26 29c-2 6-3.5 11-3.5 16M38 29c2 6 3.5 11 3.5 16" />
          <path d="M22 52h20" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M32 6v52M14 22h36" />
        </svg>
      );
  }
}

type CrowdFigure = { cx: number; hy: number; s: number };

const CHOIR_CROWD: CrowdFigure[] = [
  { cx: 55, hy: 322, s: 0.95 },
  { cx: 125, hy: 300, s: 1.1 },
  { cx: 195, hy: 318, s: 0.95 },
  { cx: 262, hy: 290, s: 1.2 },
  { cx: 335, hy: 310, s: 1.0 },
  { cx: 405, hy: 296, s: 1.15 },
  { cx: 475, hy: 312, s: 1.0 },
  { cx: 545, hy: 292, s: 1.18 },
  { cx: 618, hy: 314, s: 0.98 },
  { cx: 688, hy: 298, s: 1.1 },
  { cx: 752, hy: 320, s: 0.92 },
];

export function ChoirSceneIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 800 450"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id="choir-bg" x1="0" y1="0" x2="800" y2="450">
          <stop offset="0" stopColor="#12244A" />
          <stop offset="0.5" stopColor="#0B1B3D" />
          <stop offset="1" stopColor="#060D1F" />
        </linearGradient>
        <radialGradient id="choir-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#D9B66D" stopOpacity="0.28" />
          <stop offset="1" stopColor="#D9B66D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="choir-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.5" />
          <stop offset="1" stopColor="#E8CC8B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="choir-cross" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A6A2F" />
          <stop offset="0.5" stopColor="#E8CC8B" />
          <stop offset="1" stopColor="#8A6A2F" />
        </linearGradient>
      </defs>

      <rect width="800" height="450" fill="url(#choir-bg)" />

      {/* Light beams fanning down from the cross */}
      <polygon points="400,-20 180,450 300,450" fill="url(#choir-beam)" opacity="0.35" />
      <polygon points="400,-20 500,450 620,450" fill="url(#choir-beam)" opacity="0.35" />
      <polygon points="400,-20 340,450 460,450" fill="url(#choir-beam)" opacity="0.5" />
      <polygon points="400,-20 60,450 180,450" fill="url(#choir-beam)" opacity="0.2" />
      <polygon points="400,-20 620,450 740,450" fill="url(#choir-beam)" opacity="0.2" />

      {/* Glow + cross */}
      <ellipse cx="400" cy="150" rx="170" ry="120" fill="url(#choir-glow)" />
      <rect x="391" y="48" width="18" height="185" rx="3" fill="url(#choir-cross)" />
      <rect x="336" y="103" width="128" height="18" rx="3" fill="url(#choir-cross)" />

      {/* Worshipping crowd silhouettes */}
      <g fill="#050B1A">
        {CHOIR_CROWD.map((figure) => (
          <g key={figure.cx}>
            <circle cx={figure.cx} cy={figure.hy} r={17 * figure.s} />
            <path
              d={`M ${figure.cx - 36 * figure.s} 450 L ${figure.cx - 36 * figure.s} ${figure.hy + 46 * figure.s} Q ${figure.cx} ${figure.hy + 18 * figure.s} ${figure.cx + 36 * figure.s} ${figure.hy + 46 * figure.s} L ${figure.cx + 36 * figure.s} 450 Z`}
            />
          </g>
        ))}
        {/* Raised arm holding a microphone */}
        <path
          d="M545 300 L572 262"
          stroke="#050B1A"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="576" cy="256" r="7" />
        <path
          d="M255 298 L232 264"
          stroke="#050B1A"
          strokeWidth="13"
          strokeLinecap="round"
        />
      </g>

      {/* Floor blend */}
      <rect y="380" width="800" height="70" fill="#050B1A" opacity="0.55" />
    </svg>
  );
}

export function CtaCrossArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 240"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id="cta-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#D9B66D" stopOpacity="0.3" />
          <stop offset="1" stopColor="#D9B66D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cta-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A6A2F" />
          <stop offset="0.5" stopColor="#F1D99A" />
          <stop offset="1" stopColor="#8A6A2F" />
        </linearGradient>
      </defs>

      <ellipse cx="90" cy="120" rx="95" ry="105" fill="url(#cta-glow)" />
      <rect x="83" y="28" width="14" height="172" rx="2" fill="url(#cta-gold)" />
      <rect x="45" y="72" width="90" height="14" rx="2" fill="url(#cta-gold)" />

      {/* Flowing light streaks */}
      <path
        d="M150 205 Q 225 155 355 165"
        stroke="#D9B66D"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M150 185 Q 235 120 360 112"
        stroke="#E8CC8B"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M150 220 Q 240 195 360 205"
        stroke="#D9B66D"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M170 60 Q 240 80 330 60"
        stroke="#E8CC8B"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Hill silhouette */}
      <path
        d="M0 222 Q 90 192 180 216 T 360 210 V240 H0 Z"
        fill="#050B1A"
      />
    </svg>
  );
}

export function InfoIcon({ name }: { name: "people" | "calendar" | "pin" | "user" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    className: "size-7",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  switch (name) {
    case "people":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
          <circle cx="16.5" cy="9" r="2.4" />
          <path d="M16 14.6c2.3.2 3.9 1.6 4.4 4" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
          <path d="M7.5 13.5h3M7.5 16.5h6" />
        </svg>
      );
    case "pin":
      return (
        <svg {...props}>
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5.5 19.5c.8-3.4 3.3-5 6.5-5s5.7 1.6 6.5 5" />
        </svg>
      );
  }
}
