import Image from "next/image";

/**
 * Central homepage artwork registry.
 *
 * Every decorative homepage image goes through here so placeholders can be
 * swapped for final photography without touching layout code.
 *
 * HOW TO REPLACE A PLACEHOLDER
 * 1. Save the final file under `public/images/` using the suggested name
 *    in the `replacement` field below.
 * 2. Set that slot's `src` to the new path (e.g. "/images/hero-worship.jpg").
 * 3. Keep `alt` accurate: describe what the photo actually shows, or keep
 *    it empty (`""`) for purely decorative crops — the component already
 *    marks placeholders as decorative.
 *
 * Rules: only point `src` at files that exist in this repo's `public/`
 * folder. Never hotlink, never use the design screenshot as artwork, and
 * never invent a church photograph.
 */
export type HomeArtworkSlot =
  | "hero"
  | "welcome"
  | "visit"
  | "sermon"
  | "department";

type ArtworkEntry = {
  /** File in `public/` — `null` means the branded placeholder renders. */
  src: string | null;
  /** Suggested filename when the final photo arrives. */
  replacement: string;
  /** Spec for the final photo. */
  spec: string;
  /** Alt text to use once the real photo lands. */
  alt: string;
};

export const HOME_ARTWORK: Record<HomeArtworkSlot, ArtworkEntry> = {
  hero: {
    src: "/images/homepage-hero.png",
    replacement: "public/images/hero-worship.jpg",
    spec: "Wide 16:9 worship congregation, min 2400x1350, JPG under ~400KB, no overlaid text.",
    alt: "VictoryCity congregation worshipping with raised hands under warm stage light",
  },
  welcome: {
    src: null,
    replacement: "public/images/welcome-community.jpg",
    spec: "Portrait/landscape church family moment, min 1200x1400, JPG under ~300KB, no overlaid text.",
    alt: "Members of the VictoryCity church family worshipping together",
  },
  visit: {
    src: null,
    replacement: "public/images/church-auditorium.jpg",
    spec: "Wide church auditorium and stage, min 1600x1200, JPG under ~350KB, no overlaid text.",
    alt: "Inside the VictoryCity church auditorium",
  },
  sermon: {
    src: null,
    replacement: "public/images/sermon-cover-fallback.jpg",
    spec: "Optional generic sermon cover, 1280x720, JPG under ~200KB. Video sermons already use their real YouTube thumbnails.",
    alt: "Sermon message artwork",
  },
  department: {
    src: null,
    replacement: "public/images/departments/<slug>.jpg",
    spec: "Optional per-department photo named by slug (e.g. choir.jpg), 800x600, JPG under ~150KB.",
    alt: "Department team photo",
  },
};

function CrossMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10 2h4v14h8v4h-8v26h-4V20H2v-4h8V2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LightRays({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <g fill="url(#artwork-ray)" opacity="0.55">
        <path d="M200 0 120 300h25L200 0Z" />
        <path d="M200 0h6L260 300h-30L200 0Z" />
        <path d="M200 0 60 300H30l170-300Z" />
        <path d="M200 0l140 300h30L200 0Z" />
      </g>
      <defs>
        <linearGradient
          id="artwork-ray"
          x1="200"
          y1="0"
          x2="200"
          y2="300"
        >
          <stop stopColor="#E8CC8B" />
          <stop offset="1" stopColor="#E8CC8B" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CrowdSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 90"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <g fill="#060D1F">
        <ellipse cx="30" cy="62" rx="16" ry="18" />
        <ellipse cx="75" cy="55" rx="18" ry="22" />
        <ellipse cx="125" cy="63" rx="15" ry="17" />
        <ellipse cx="170" cy="52" rx="19" ry="24" />
        <ellipse cx="220" cy="60" rx="16" ry="19" />
        <ellipse cx="268" cy="54" rx="18" ry="22" />
        <ellipse cx="318" cy="62" rx="16" ry="18" />
        <ellipse cx="362" cy="56" rx="18" ry="21" />
        <rect x="0" y="72" width="400" height="18" />
      </g>
    </svg>
  );
}

/**
 * Branded placeholder rendered while a slot has no real photo.
 * Navy-and-gold line art that matches the site palette — never a broken
 * image icon, stock photo, or invented church photograph.
 */
function ArtworkPlaceholder({ slot }: { slot: HomeArtworkSlot }) {
  if (slot === "sermon") {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(150deg,#0B1428_0%,#101B33_55%,#27406E_100%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,182,109,0.4),transparent_55%)]" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full border border-white/40 bg-white/10 text-[#E6C77D]">
            <svg viewBox="0 0 24 24" fill="none" className="size-6">
              <path
                d="M8 5.8c0-.78.85-1.26 1.52-.86l9.52 5.7a1.6 1.6 0 0 1 0 2.74l-9.52 5.7A1 1 0 0 1 8 18.22V5.8Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>
      </div>
    );
  }

  if (slot === "department") {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(160deg,#0B1428_0%,#1D3158_60%,#2B4A80_100%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(217,182,109,0.45),transparent_45%)]" />
        <LightRays className="absolute inset-0 h-full w-full opacity-40" />
        <CrossMark className="absolute left-1/2 top-1/2 h-24 w-12 -translate-x-1/2 -translate-y-1/2 text-[#D9B66D]/80" />
      </div>
    );
  }

  if (slot === "visit") {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#0B1428_0%,#101B33_55%,#1D3158_100%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(217,182,109,0.35),transparent_50%)]" />
        <LightRays className="absolute inset-x-0 top-0 h-3/4 w-full opacity-50" />
        <CrossMark className="absolute left-1/2 top-[16%] h-28 w-14 -translate-x-1/2 text-[#E6C77D]" />
        {/* Auditorium seat rows */}
        <div className="absolute inset-x-6 bottom-6 space-y-2 opacity-70">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex justify-center gap-1.5">
              {Array.from({ length: 12 }).map((_, seat) => (
                <span
                  key={seat}
                  className="h-2.5 w-4 rounded-t-md bg-white/[0.07]"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // hero + welcome: cinematic congregation artwork
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[linear-gradient(115deg,#0B1428_0%,#101B33_55%,#27406E_100%)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_20%,rgba(217,182,109,0.35),transparent_42%),radial-gradient(ellipse_at_10%_100%,rgba(62,91,145,0.35),transparent_45%)]" />
      <LightRays className="absolute inset-0 h-full w-full" />
      <CrossMark className="absolute right-[18%] top-[8%] h-40 w-20 text-[#E6C77D]/90" />
      <CrowdSilhouette className="absolute inset-x-0 bottom-0 h-24 w-full" />
    </div>
  );
}

export function HomeArtwork({
  slot,
  className = "",
  eager = false,
}: {
  slot: HomeArtworkSlot;
  className?: string;
  eager?: boolean;
}) {
  const entry = HOME_ARTWORK[slot];

  return (
    <div
      aria-hidden={entry.src ? undefined : true}
      role={entry.src ? "img" : undefined}
      aria-label={entry.src ? entry.alt : undefined}
      className={`relative overflow-hidden bg-[#101B33] ${className}`}
    >
      {entry.src ? (
        <Image
          src={entry.src}
          alt={entry.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={eager}
          className="object-cover object-center"
        />
      ) : (
        <ArtworkPlaceholder slot={slot} />
      )}
    </div>
  );
}
