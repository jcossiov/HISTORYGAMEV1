import React, { useId } from 'react';
import { HeroId, HeroClassId, VillainArchetype } from '../types/game';

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
  muscleLevel = 1,
  className = '',
}) => {
  const isRichard = heroId === 'richard';
  const primaryColor = isRichard ? '#f97316' : '#10b981';
  const secondaryColor = isRichard ? '#ea580c' : '#059669';
  const glowColor = isRichard ? '#fdba74' : '#6ee7b7';
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const bulk = Math.min(20, (muscleLevel - 1) * 1.3);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-sky-200 bg-gradient-to-b from-sky-100 via-white to-emerald-50 shadow-md flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`bg-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id={`suit-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="50%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
          <linearGradient id={`skin-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fba76a" />
          </linearGradient>
          <linearGradient id={`hair-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isRichard ? '#78350f' : '#1f2937'} />
            <stop offset="100%" stopColor={isRichard ? '#451a03' : '#111827'} />
          </linearGradient>
        </defs>

        {/* Ambient Halo */}
        <circle cx="100" cy="100" r="95" fill={`url(#bg-${uid})`} />

        {/* Hydro Backpack Straps & Water Tank Hint */}
        <rect x="44" y="112" width="18" height="46" rx="8" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
        <rect x="138" y="112" width="18" height="46" rx="8" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />

        {/* Friendly shoulders */}
        <path
          d={`M ${30 - bulk} 200 C ${35 - bulk} 145, ${70 - bulk / 2} 132, 100 132 C ${130 + bulk / 2} 132, ${165 + bulk} 145, ${170 + bulk} 200 Z`}
          fill={`url(#suit-${uid})`}
          stroke="#0f172a"
          strokeWidth="2.5"
        />

        {/* Chest emblem (Water Drop + Nature Star) */}
        <path
          d="M 76 146 L 100 158 L 124 146 L 120 184 L 100 193 L 80 184 Z"
          fill="#ffffff"
          stroke={glowColor}
          strokeWidth="2"
        />
        <circle cx="100" cy="164" r="9" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />

        {/* Neck */}
        <rect x={89 - bulk / 4} y="106" width={22 + bulk / 2} height="28" rx="6" fill={`url(#skin-${uid})`} />

        {/* Head */}
        <path
          d="M 70 88 C 70 52, 130 52, 130 88 C 130 120, 100 128, 100 128 C 100 128, 70 120, 70 88 Z"
          fill={`url(#skin-${uid})`}
          stroke="#d97706"
          strokeWidth="1.5"
        />

        {/* Ears */}
        <circle cx="68" cy="88" r="7" fill="#fba76a" />
        <circle cx="132" cy="88" r="7" fill="#fba76a" />

        {/* Hair */}
        {isRichard ? (
          <path
            d="M 66 72 C 62 42, 90 27, 104 30 C 124 24, 140 44, 134 74 C 127 57, 114 52, 98 54 C 85 56, 76 60, 66 72 Z"
            fill={`url(#hair-${uid})`}
          />
        ) : (
          <path
            d="M 67 74 C 64 44, 86 30, 100 32 C 118 28, 136 40, 133 74 C 124 58, 110 54, 98 54 C 83 54, 74 60, 67 74 Z"
            fill={`url(#hair-${uid})`}
          />
        )}

        {/* Hero Headband */}
        <path
          d="M 69 66 Q 100 72 131 66"
          stroke="#06b6d4"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Big friendly eyes */}
        <ellipse cx="87" cy="83" rx="5.5" ry="5" fill="#0f172a" />
        <circle cx="89" cy="80" r="2" fill="#ffffff" />
        <ellipse cx="113" cy="83" rx="5.5" ry="5" fill="#0f172a" />
        <circle cx="115" cy="80" r="2" fill="#ffffff" />

        {/* Eyebrows */}
        <path d="M 79 73 Q 87 69 95 73" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 105 73 Q 113 69 121 73" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nose */}
        <path d="M 98 86 L 100 93 L 104 93" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Big smile */}
        <path d="M 88 104 Q 100 114 112 104" stroke="#b45309" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Name badge */}
        <rect x="46" y="176" width="108" height="19" rx="9.5" fill="#ffffff" stroke={primaryColor} strokeWidth="1.8" />
        <text x="100" y="189" fill={secondaryColor} fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">
          {isRichard ? '💧 RICHARD' : '🌳 JUAN'}
        </text>
      </svg>
    </div>
  );
};

interface VillainPortraitProps {
  name: string;
  title: string;
  color: string;
  archetype?: VillainArchetype;
  size?: number;
  className?: string;
}

export const Villain3DPortrait: React.FC<VillainPortraitProps> = ({
  name,
  title,
  color,
  archetype,
  size = 120,
  className = '',
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const lower = `${name} ${title}`.toLowerCase();
  const resolvedArchetype: VillainArchetype =
    archetype ||
    (lower.includes('basurote') || lower.includes('basura')
      ? 'basurote'
      : lower.includes('talador') ||
        lower.includes('motosierra') ||
        lower.includes('demoledor') ||
        lower.includes('devastador') ||
        lower.includes('coloso')
      ? 'talador'
      : lower.includes('hambre') || lower.includes('desperdicio') || lower.includes('acaparador')
      ? 'acaparador'
      : 'maton');

  const badgeIcon =
    resolvedArchetype === 'basurote'
      ? '🗑️'
      : resolvedArchetype === 'talador'
      ? '🪓'
      : resolvedArchetype === 'acaparador'
      ? '🥖'
      : '💢';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-rose-200 bg-gradient-to-b from-rose-50 via-white to-amber-50 shadow-md flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`vg-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id={`va-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="95" fill={`url(#vg-${uid})`} />

        {/* Grumpy rounded shoulders */}
        <path
          d="M 18 200 C 24 136, 62 118, 100 118 C 138 118, 176 136, 182 200 Z"
          fill={`url(#va-${uid})`}
          stroke="#1e293b"
          strokeWidth="2.5"
        />

        {/* Chest emblem based on Villain Archetype */}
        <rect x="82" y="132" width="36" height="42" rx="8" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
        <text x="100" y="160" fontSize="20" textAnchor="middle">
          {badgeIcon}
        </text>

        {/* Grumpy head */}
        <path
          d="M 68 78 C 68 46, 132 46, 132 78 C 132 110, 100 120, 100 120 C 100 120, 68 110, 68 78 Z"
          fill={resolvedArchetype === 'basurote' ? '#bef264' : '#e2e8f0'}
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Special Hat/Lid per Villain Type */}
        {resolvedArchetype === 'basurote' && (
          <g>
            {/* Trash Can Lid on Head */}
            <ellipse cx="100" cy="50" rx="38" ry="9" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
            <rect x="90" y="38" width="20" height="8" rx="3" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5" />
          </g>
        )}
        {resolvedArchetype === 'talador' && (
          <g>
            {/* Logger Helmet */}
            <path d="M 64 60 C 66 34, 134 34, 136 60 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
            <rect x="58" y="57" width="84" height="6" rx="3" fill="#d97706" />
          </g>
        )}

        {/* Angry-but-funny eyebrows */}
        <path d="M 74 68 L 96 76 L 74 80" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 126 68 L 104 76 L 126 80" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Eyes */}
        <circle cx="84" cy="84" r="4.5" fill="#dc2626" />
        <circle cx="116" cy="84" r="4.5" fill="#dc2626" />

        {/* Grumpy mouth */}
        <path d="M 85 105 Q 100 95 115 105" stroke="#1e293b" strokeWidth="3.2" strokeLinecap="round" fill="none" />

        {/* Name badge */}
        <rect x="30" y="176" width="140" height="19" rx="9.5" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
        <text x="100" y="189" fill="#be123c" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">
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
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-md flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`rg-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </radialGradient>
          <pattern id={`rs-${uid}`} width="24" height="200" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="12" height="200" fill="#0f172a" />
            <rect x="12" y="0" width="12" height="200" fill="#f8fafc" />
          </pattern>
        </defs>

        <circle cx="100" cy="100" r="95" fill={`url(#rg-${uid})`} />

        {/* Striped jersey */}
        <path
          d="M 25 200 C 30 140, 65 126, 100 126 C 135 126, 170 140, 175 200 Z"
          fill={`url(#rs-${uid})`}
          stroke="#f59e0b"
          strokeWidth="2.5"
        />

        {/* Whistle */}
        <path d="M 80 128 Q 100 165 120 128" stroke="#eab308" strokeWidth="3.5" fill="none" />
        <circle cx="100" cy="155" r="8" fill="#facc15" stroke="#854d0e" strokeWidth="2" />

        {/* Green fair-play card */}
        <rect x="126" y="142" width="17" height="23" rx="3" transform="rotate(8 126 142)" fill="#10b981" stroke="#ecfdf5" strokeWidth="1.5" />

        {/* Neck */}
        <rect x="88" y="104" width="24" height="26" rx="6" fill="#fed7aa" />

        {/* Friendly face */}
        <path
          d="M 68 84 C 68 52, 132 52, 132 84 C 132 116, 100 125, 100 125 C 100 125, 68 116, 68 84 Z"
          fill="#fed7aa"
          stroke="#d97706"
          strokeWidth="1.5"
        />

        {/* Cap */}
        <path d="M 64 68 C 64 38, 136 38, 136 68 Z" fill="#0f172a" stroke="#f8fafc" strokeWidth="2" />
        <path d="M 60 66 Q 100 58 140 66 Q 100 74 60 66 Z" fill="#facc15" />

        {/* Eyes & smile */}
        <circle cx="86" cy="82" r="4.5" fill="#0f172a" />
        <circle cx="88" cy="80" r="1.5" fill="#ffffff" />
        <circle cx="114" cy="82" r="4.5" fill="#0f172a" />
        <circle cx="116" cy="80" r="1.5" fill="#ffffff" />

        <path d="M 88 102 Q 100 112 112 102" stroke="#15803d" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Badge */}
        <rect x="38" y="175" width="124" height="19" rx="9.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="100" y="188" fill="#b45309" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">
          ÁRBITRO DON JUSTO
        </text>
      </svg>
    </div>
  );
};
