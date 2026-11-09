import React from 'react';
import { HeroId, HeroClassId } from '../types/game';

interface CharacterPortraitProps {
  heroId: HeroId;
  size?: number;
  classId?: HeroClassId;
  muscleLevel?: number;
  className?: string;
}

export const Hero3DPortrait: React.FC<CharacterPortraitProps> = ({
  heroId,
  size = 120,
  classId = 'rey-fuego',
  muscleLevel = 1,
  className = '',
}) => {
  const isRichard = heroId === 'richard';
  const primaryColor = isRichard ? '#f97316' : '#10b981';
  const secondaryColor = isRichard ? '#ea580c' : '#059669';
  const glowColor = isRichard ? '#fdba74' : '#6ee7b7';
  const suitText = isRichard ? 'Vestido Naranja' : 'Vestido Verde';

  // Muscle bulk expansion factor
  const bulk = Math.min(24, (muscleLevel - 1) * 1.6);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-950 shadow-xl flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`bg-glow-${heroId}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id={`suit-grad-${heroId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="50%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
          <linearGradient id={`skin-grad-${heroId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fba76a" />
          </linearGradient>
          <linearGradient id={`hair-grad-${heroId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isRichard ? '#78350f' : '#1f2937'} />
            <stop offset="100%" stopColor={isRichard ? '#451a03' : '#111827'} />
          </linearGradient>
          <filter id={`bloom-${heroId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Halo */}
        <circle cx="100" cy="100" r="95" fill={`url(#bg-glow-${heroId})`} />

        {/* Cyber Grid Lines */}
        <line x1="20" y1="100" x2="180" y2="100" stroke={primaryColor} strokeOpacity="0.15" strokeDasharray="4 4" />
        <line x1="100" y1="20" x2="100" y2="180" stroke={primaryColor} strokeOpacity="0.15" strokeDasharray="4 4" />

        {/* Muscular Shoulders & Traps (Broadens with bulk!) */}
        <path
          d={`M ${30 - bulk} 200 C ${35 - bulk} 145, ${70 - bulk / 2} 130, 100 130 C ${130 + bulk / 2} 130, ${165 + bulk} 145, ${170 + bulk} 200 Z`}
          fill={`url(#suit-grad-${heroId})`}
          stroke="#0f172a"
          strokeWidth="3"
        />

        {/* Chest Armor Plates & Reactor */}
        <path
          d={`M 75 145 L 100 160 L 125 145 L 120 185 L 100 195 L 80 185 Z`}
          fill="#1e293b"
          stroke={glowColor}
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="165"
          r="8"
          fill="#38bdf8"
          stroke="#e0f2fe"
          strokeWidth="2"
          filter={`url(#bloom-${heroId})`}
        />

        {/* Muscular Neck */}
        <rect
          x={88 - bulk / 4}
          y="105"
          width={24 + bulk / 2}
          height="32"
          rx="6"
          fill={`url(#skin-grad-${heroId})`}
        />

        {/* Hero Head (Jawline & Friendly Smile) */}
        <path
          d="M 68 85 C 68 50, 132 50, 132 85 C 132 118, 100 128, 100 128 C 100 128, 68 118, 68 85 Z"
          fill={`url(#skin-grad-${heroId})`}
          stroke="#d97706"
          strokeWidth="1.5"
        />

        {/* Ears */}
        <circle cx="66" cy="85" r="7" fill="#fba76a" />
        <circle cx="134" cy="85" r="7" fill="#fba76a" />

        {/* Dynamic 3D Hair */}
        {isRichard ? (
          // Richard: Athletic sweep styled hair
          <path
            d="M 64 70 C 60 40, 90 25, 105 28 C 125 22, 142 42, 136 72 C 128 55, 115 50, 98 52 C 85 54, 75 58, 64 70 Z"
            fill="url(#hair-grad-richard)"
          />
        ) : (
          // Juan: Confident textured short crop
          <path
            d="M 65 72 C 62 42, 85 28, 100 30 C 118 26, 138 38, 135 72 C 125 56, 110 52, 98 52 C 82 52, 72 58, 65 72 Z"
            fill="url(#hair-grad-juan)"
          />
        )}

        {/* Eyes & Brows */}
        <ellipse cx="86" cy="80" rx="5" ry="4" fill="#0f172a" />
        <circle cx="88" cy="78" r="1.5" fill="#ffffff" />
        <ellipse cx="114" cy="80" rx="5" ry="4" fill="#0f172a" />
        <circle cx="116" cy="78" r="1.5" fill="#ffffff" />

        {/* Heroic Eyebrows */}
        <path d="M 78 72 Q 86 68 94 72" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 106 72 Q 114 68 122 72" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nose */}
        <path d="M 98 84 L 100 92 L 104 92" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Confident Smile */}
        <path d="M 88 102 Q 100 112 112 102" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Suit High-Collar Trim */}
        <path
          d="M 75 130 Q 100 142 125 130"
          stroke={glowColor}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Hero Badge Tag */}
        <rect x="55" y="176" width="90" height="18" rx="9" fill="#090d16" stroke={primaryColor} strokeWidth="1.5" />
        <text
          x="100"
          y="188"
          fill="#ffffff"
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          {isRichard ? 'RICHARD (Naranja)' : 'JUAN (Verde)'}
        </text>
      </svg>
    </div>
  );
};

interface VillainPortraitProps {
  name: string;
  title: string;
  color: string;
  size?: number;
  className?: string;
}

export const Villain3DPortrait: React.FC<VillainPortraitProps> = ({
  name,
  title,
  color,
  size = 120,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-rose-900/60 bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950 shadow-2xl flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="v-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#05070c" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="v-armor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="95" fill="url(#v-glow)" />

        {/* Ruthless Muscular Spiked Shoulders */}
        <path
          d="M 15 200 C 20 130, 60 115, 100 115 C 140 115, 180 130, 185 200 Z"
          fill="url(#v-armor)"
          stroke="#000000"
          strokeWidth="3.5"
        />

        {/* Spikes on Pauldrons */}
        <polygon points="35,140 20,110 45,130" fill="#991b1b" stroke="#000" strokeWidth="1.5" />
        <polygon points="165,140 180,110 155,130" fill="#991b1b" stroke="#000" strokeWidth="1.5" />

        {/* Toxic Barrel Harness */}
        <rect x="85" y="130" width="30" height="45" rx="5" fill="#4d7c0f" stroke="#84cc16" strokeWidth="2" />
        <line x1="85" y1="145" x2="115" y2="145" stroke="#14532d" strokeWidth="2" />
        <line x1="85" y1="160" x2="115" y2="160" stroke="#14532d" strokeWidth="2" />

        {/* Rugged Villain Head & Mask */}
        <path
          d="M 65 75 C 65 40, 135 40, 135 75 C 135 110, 100 120, 100 120 C 100 120, 65 110, 65 75 Z"
          fill="#1f2937"
          stroke="#450a0a"
          strokeWidth="2"
        />

        {/* Brow Shadow & Furrow */}
        <path d="M 72 65 L 98 75 L 128 65" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

        {/* Menacing Glowing Eyes */}
        <polygon points="76,78 92,82 86,86 74,82" fill="#ef4444" />
        <polygon points="124,78 108,82 114,86 126,82" fill="#ef4444" />
        <circle cx="84" cy="82" r="2.5" fill="#fef08a" />
        <circle cx="116" cy="82" r="2.5" fill="#fef08a" />

        {/* Respirator / Toxic Mask Grill */}
        <path d="M 85 96 L 115 96 L 110 115 L 90 115 Z" fill="#111827" stroke="#dc2626" strokeWidth="1.5" />
        <line x1="92" y1="102" x2="108" y2="102" stroke="#84cc16" strokeWidth="2" />
        <line x1="94" y1="108" x2="106" y2="108" stroke="#84cc16" strokeWidth="2" />

        {/* Villain Title Tag */}
        <rect x="35" y="176" width="130" height="18" rx="9" fill="#000000" stroke="#dc2626" strokeWidth="1.5" />
        <text
          x="100"
          y="188"
          fill="#fca5a5"
          fontSize="8.5"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          {name.toUpperCase()}
        </text>
      </svg>
    </div>
  );
};

interface RefereePortraitProps {
  size?: number;
  className?: string;
}

export const Referee3DPortrait: React.FC<RefereePortraitProps> = ({
  size = 90,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="ref-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0.95" />
          </radialGradient>
          <pattern id="ref-stripes" width="24" height="200" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="12" height="200" fill="#0f172a" />
            <rect x="12" y="0" width="12" height="200" fill="#f8fafc" />
          </pattern>
        </defs>

        <circle cx="100" cy="100" r="95" fill="url(#ref-glow)" />

        {/* Referee Striped Jersey Torso */}
        <path
          d="M 25 200 C 30 140, 65 126, 100 126 C 135 126, 170 140, 175 200 Z"
          fill="url(#ref-stripes)"
          stroke="#facc15"
          strokeWidth="3"
        />

        {/* Golden Whistle Lanyard & Whistle */}
        <path
          d="M 80 128 Q 100 165 120 128"
          stroke="#eab308"
          strokeWidth="3.5"
          fill="none"
        />
        <circle cx="100" cy="155" r="9" fill="#facc15" stroke="#854d0e" strokeWidth="2" />

        {/* Green Fair-Play Card in Pocket */}
        <rect
          x="126"
          y="142"
          width="18"
          height="24"
          rx="3"
          transform="rotate(8 126 142)"
          fill="#10b981"
          stroke="#ecfdf5"
          strokeWidth="1.5"
        />

        {/* Neck */}
        <rect x="88" y="104" width="24" height="26" rx="6" fill="#fed7aa" />

        {/* Friendly Face */}
        <path
          d="M 68 84 C 68 52, 132 52, 132 84 C 132 116, 100 125, 100 125 C 100 125, 68 116, 68 84 Z"
          fill="#fed7aa"
          stroke="#d97706"
          strokeWidth="1.5"
        />

        {/* Referee Cap (Black & White visor) */}
        <path
          d="M 64 68 C 64 38, 136 38, 136 68 Z"
          fill="#0f172a"
          stroke="#f8fafc"
          strokeWidth="2"
        />
        <path
          d="M 60 66 Q 100 58 140 66 Q 100 74 60 66 Z"
          fill="#facc15"
        />

        {/* Eyes & Friendly Smile */}
        <circle cx="86" cy="82" r="4.5" fill="#0f172a" />
        <circle cx="88" cy="80" r="1.5" fill="#ffffff" />
        <circle cx="114" cy="82" r="4.5" fill="#0f172a" />
        <circle cx="116" cy="80" r="1.5" fill="#ffffff" />

        <path d="M 88 102 Q 100 112 112 102" stroke="#15803d" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <rect x="38" y="175" width="124" height="19" rx="9.5" fill="#0f172a" stroke="#facc15" strokeWidth="1.5" />
        <text
          x="100"
          y="188"
          fill="#fef08a"
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          ÁRBITRO OFICIAL 3D
        </text>
      </svg>
    </div>
  );
};

