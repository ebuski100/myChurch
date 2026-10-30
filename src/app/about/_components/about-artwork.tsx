/**
 * Hand-drawn SVG artwork for the About page.
 *
 * All lighting, crosses, icons, and illustrations are recreated here as
 * vector line art in the navy-and-gold palette — no screenshot reuse,
 * no external images, no stock photography.
 */

export function AboutHeroArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 420"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id="about-hero-glow" cx="0.78" cy="0.28" r="0.45">
          <stop offset="0" stopColor="#F1D99A" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#D9B66D" stopOpacity="0.4" />
          <stop offset="1" stopColor="#D9B66D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="about-hero-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.55" />
          <stop offset="1" stopColor="#E8CC8B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="about-hero-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A6A2F" />
          <stop offset="0.5" stopColor="#F1D99A" />
          <stop offset="1" stopColor="#8A6A2F" />
        </linearGradient>
      </defs>

      {/* Light beams fanning from the cross */}
      <polygon points="624,-10 480,420 600,420" fill="url(#about-hero-beam)" opacity="0.4" />
      <polygon points="624,-10 600,420 720,420" fill="url(#about-hero-beam)" opacity="0.5" />
      <polygon points="624,-10 360,420 480,420" fill="url(#about-hero-beam)" opacity="0.25" />
      <polygon points="624,-10 720,420 800,420" fill="url(#about-hero-beam)" opacity="0.25" />

      <ellipse cx="624" cy="118" rx="190" ry="140" fill="url(#about-hero-glow)" />

      {/* Cross on the hill */}
      <rect x="616" y="34" width="16" height="140" rx="2" fill="url(#about-hero-gold)" />
      <rect x="576" y="70" width="96" height="16" rx="2" fill="url(#about-hero-gold)" />

      {/* City skyline silhouette */}
      <g fill="#050B1A">
        <rect x="560" y="150" width="18" height="40" />
        <rect x="582" y="138" width="26" height="52" />
        <rect x="660" y="142" width="22" height="48" />
        <rect x="686" y="152" width="30" height="38" />
        <rect x="540" y="162" width="14" height="28" />
        <rect x="720" y="160" width="18" height="30" />
      </g>

      {/* Hills */}
      <path d="M0 330 Q 200 250 420 320 T 800 300 V420 H0 Z" fill="#060D1F" />
      <path d="M0 360 Q 240 300 480 360 T 800 350 V420 H0 Z" fill="#040814" />

      {/* Winding golden path up to the cross */}
      <path
        d="M560 420 Q 590 360 570 330 Q 550 300 600 280 Q 620 270 624 250"
        stroke="url(#about-hero-gold)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M560 420 Q 590 360 570 330 Q 550 300 600 280 Q 620 270 624 250"
        stroke="#F1D99A"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Diagonal gold geometry line */}
      <path
        d="M420 0 L 720 420"
        stroke="#D9B66D"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

export function MissionIcon({ name }: { name: "mission" | "vision" | "values" }) {
  const props = {
    viewBox: "0 0 48 48",
    fill: "none",
    "aria-hidden": true,
    className: "size-10",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  if (name === "mission") {
    return (
      <svg {...props}>
        <circle cx="20" cy="26" r="12" />
        <circle cx="20" cy="26" r="7" />
        <circle cx="20" cy="26" r="2" fill="currentColor" stroke="none" />
        <path d="M29 17L40 6" />
        <path d="M33 6h7v7" />
      </svg>
    );
  }

  if (name === "vision") {
    return (
      <svg {...props}>
        <path d="M4 24s7-11 20-11 20 11 20 11-7 11-20 11S4 24 4 24Z" />
        <circle cx="24" cy="24" r="5.5" />
        <circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M24 40S8 30 8 17.5A8.5 8.5 0 0 1 24 12a8.5 8.5 0 0 1 16 5.5C40 30 24 40 24 40Z" />
    </svg>
  );
}

export function StoryChurchIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 640 360"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id="story-bg" x1="0" y1="0" x2="640" y2="360">
          <stop offset="0" stopColor="#12244A" />
          <stop offset="0.55" stopColor="#0B1B3D" />
          <stop offset="1" stopColor="#060D1F" />
        </linearGradient>
        <radialGradient id="story-glow" cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#D9B66D" stopOpacity="0.3" />
          <stop offset="1" stopColor="#D9B66D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="story-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.45" />
          <stop offset="1" stopColor="#E8CC8B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="story-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A6A2F" />
          <stop offset="0.5" stopColor="#E8CC8B" />
          <stop offset="1" stopColor="#8A6A2F" />
        </linearGradient>
      </defs>

      <rect width="640" height="360" fill="url(#story-bg)" />

      {/* Sanctuary arches */}
      <g stroke="#D9B66D" strokeWidth="4" opacity="0.55">
        <path d="M120 360V150 Q120 60 220 60" />
        <path d="M520 360V150 Q520 60 420 60" />
        <path d="M180 360V170 Q180 100 260 100" opacity="0.6" />
        <path d="M460 360V170 Q460 100 380 100" opacity="0.6" />
      </g>

      {/* Altar glow + cross */}
      <ellipse cx="320" cy="180" rx="130" ry="110" fill="url(#story-glow)" />
      <rect x="313" y="110" width="14" height="100" rx="2" fill="url(#story-gold)" />
      <rect x="283" y="136" width="74" height="13" rx="2" fill="url(#story-gold)" />
      <rect x="250" y="236" width="140" height="44" rx="3" fill="#0B1B3D" stroke="#D9B66D" strokeWidth="2" opacity="0.9" />

      {/* Light beams */}
      <polygon points="320,60 180,360 280,360" fill="url(#story-beam)" opacity="0.3" />
      <polygon points="320,60 360,360 460,360" fill="url(#story-beam)" opacity="0.3" />

      {/* Congregation silhouettes */}
      <g fill="#050B1A">
        <circle cx="80" cy="292" r="14" />
        <path d="M52 360v-30q28-22 56 0v30Z" />
        <circle cx="150" cy="282" r="16" />
        <path d="M118 360v-34q32-24 64 0v34Z" />
        <circle cx="225" cy="292" r="14" />
        <path d="M197 360v-30q28-22 56 0v30Z" />
        <circle cx="295" cy="280" r="16" />
        <path d="M263 360v-34q32-24 64 0v34Z" />
        <circle cx="365" cy="282" r="15" />
        <path d="M335 360v-32q30-23 60 0v32Z" />
        <circle cx="435" cy="292" r="14" />
        <path d="M407 360v-30q28-22 56 0v30Z" />
        <circle cx="505" cy="280" r="16" />
        <path d="M473 360v-34q32-24 64 0v34Z" />
        <circle cx="575" cy="290" r="14" />
        <path d="M547 360v-30q28-22 56 0v30Z" />
      </g>
      <rect y="330" width="640" height="30" fill="#050B1A" opacity="0.6" />
    </svg>
  );
}

export function PastorPulpitIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id="pastor-glow" cx="0.5" cy="0.42" r="0.55">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.8" />
          <stop offset="0.55" stopColor="#D9B66D" stopOpacity="0.28" />
          <stop offset="1" stopColor="#D9B66D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pastor-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8CC8B" stopOpacity="0.4" />
          <stop offset="1" stopColor="#E8CC8B" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="320" fill="#0B1B3D" />
      <ellipse cx="200" cy="130" rx="150" ry="120" fill="url(#pastor-glow)" />
      <polygon points="200,20 110,320 180,320" fill="url(#pastor-beam)" opacity="0.35" />
      <polygon points="200,20 220,320 290,320" fill="url(#pastor-beam)" opacity="0.35" />

      {/* Pastor silhouette */}
      <g fill="#050B1A">
        <circle cx="200" cy="105" r="26" />
        <path d="M158 200 Q160 150 200 146 Q240 150 242 200 L242 210 H158 Z" />
        <path d="M158 205 L120 230 L160 222 Z" />
        <path d="M242 205 L280 230 L240 222 Z" />
      </g>

      {/* Pulpit with cross */}
      <rect x="150" y="208" width="100" height="80" rx="4" fill="#0A1730" stroke="#D9B66D" strokeWidth="2" />
      <path
        d="M196 236h8v14h14v8h-14v26h-8v-26h-14v-8h14v-14Z"
        fill="none"
        stroke="#D9B66D"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Congregation heads */}
      <g fill="#050B1A">
        <circle cx="60" cy="286" r="15" />
        <path d="M32 320v-18q28-20 56 0v18Z" />
        <circle cx="130" cy="292" r="14" />
        <path d="M104 320v-16q26-18 52 0v16Z" />
        <circle cx="270" cy="292" r="14" />
        <path d="M244 320v-16q26-18 52 0v16Z" />
        <circle cx="340" cy="286" r="15" />
        <path d="M312 320v-18q28-20 56 0v18Z" />
      </g>
    </svg>
  );
}

export function FamilyCtaArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 700 260"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id="cta-glow" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#F1D99A" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#D9B66D" stopOpacity="0.35" />
          <stop offset="1" stopColor="#D9B66D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cta-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A6A2F" />
          <stop offset="0.5" stopColor="#F1D99A" />
          <stop offset="1" stopColor="#8A6A2F" />
        </linearGradient>
      </defs>

      <ellipse cx="350" cy="105" rx="170" ry="100" fill="url(#cta-glow)" />
      <rect x="343" y="18" width="14" height="130" rx="2" fill="url(#cta-gold)" />
      <rect x="309" y="50" width="82" height="13" rx="2" fill="url(#cta-gold)" />

      {/* Light beams */}
      <polygon points="350,30 220,260 300,260" fill="#E8CC8B" opacity="0.14" />
      <polygon points="350,30 400,260 480,260" fill="#E8CC8B" opacity="0.14" />
      <polygon points="350,30 290,260 410,260" fill="#E8CC8B" opacity="0.18" />

      {/* Rolling hills + winding path */}
      <path d="M0 220 Q 180 170 350 215 T 700 205 V260 H0 Z" fill="#050B1A" />
      <path
        d="M300 260 Q 330 230 320 215 Q 315 200 350 190"
        stroke="url(#cta-gold)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M180 210 Q 260 190 350 210"
        stroke="#D9B66D"
        strokeWidth="2.5"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M400 215 Q 500 195 620 210"
        stroke="#D9B66D"
        strokeWidth="2.5"
        opacity="0.4"
        fill="none"
      />
    </svg>
  );
}
