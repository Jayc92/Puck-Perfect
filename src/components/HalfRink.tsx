export function HalfRink() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 1180"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ice-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f9fcff" />
          <stop offset="55%" stopColor="#eff6fb" />
          <stop offset="100%" stopColor="#f8fbff" />
        </linearGradient>
        <radialGradient id="ice-glow" cx="50%" cy="26%" r="62%">
          <stop offset="0%" stopColor="rgba(101, 177, 255, 0.12)" />
          <stop offset="100%" stopColor="rgba(101, 177, 255, 0)" />
        </radialGradient>
        <linearGradient id="board-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <rect x="22" y="22" width="956" height="1136" rx="72" fill="#162233" />
      <rect x="46" y="46" width="908" height="1088" rx="60" fill="url(#ice-sheen)" />
      <rect x="46" y="46" width="908" height="1088" rx="60" fill="url(#ice-glow)" />
      <rect
        x="46"
        y="46"
        width="908"
        height="1088"
        rx="60"
        fill="none"
        stroke="#182130"
        strokeWidth="18"
      />
      <rect x="46" y="46" width="908" height="1088" rx="60" fill="none" stroke="url(#board-shadow)" strokeWidth="6" />

      <line x1="130" y1="250" x2="870" y2="250" stroke="#2f87d6" strokeWidth="12" />
      <line x1="130" y1="984" x2="870" y2="984" stroke="#d45b67" strokeWidth="10" />

      <circle cx="500" cy="440" r="82" fill="none" stroke="#d7727c" strokeWidth="6" />
      <line x1="462" y1="440" x2="538" y2="440" stroke="#d7727c" strokeWidth="6" />
      <circle cx="500" cy="440" r="5" fill="#d7727c" />
      <line x1="500" y1="396" x2="500" y2="484" stroke="#d7727c" strokeWidth="4" />

      <circle cx="278" cy="520" r="96" fill="none" stroke="#d7727c" strokeWidth="6" />
      <circle cx="722" cy="520" r="96" fill="none" stroke="#d7727c" strokeWidth="6" />
      <circle cx="278" cy="520" r="5" fill="#d7727c" />
      <circle cx="722" cy="520" r="5" fill="#d7727c" />
      <line x1="242" y1="520" x2="314" y2="520" stroke="#d7727c" strokeWidth="4" />
      <line x1="278" y1="484" x2="278" y2="556" stroke="#d7727c" strokeWidth="4" />
      <line x1="686" y1="520" x2="758" y2="520" stroke="#d7727c" strokeWidth="4" />
      <line x1="722" y1="484" x2="722" y2="556" stroke="#d7727c" strokeWidth="4" />
      <line x1="204" y1="486" x2="222" y2="486" stroke="#d7727c" strokeWidth="4" />
      <line x1="204" y1="554" x2="222" y2="554" stroke="#d7727c" strokeWidth="4" />
      <line x1="334" y1="486" x2="352" y2="486" stroke="#d7727c" strokeWidth="4" />
      <line x1="334" y1="554" x2="352" y2="554" stroke="#d7727c" strokeWidth="4" />
      <line x1="648" y1="486" x2="666" y2="486" stroke="#d7727c" strokeWidth="4" />
      <line x1="648" y1="554" x2="666" y2="554" stroke="#d7727c" strokeWidth="4" />
      <line x1="778" y1="486" x2="796" y2="486" stroke="#d7727c" strokeWidth="4" />
      <line x1="778" y1="554" x2="796" y2="554" stroke="#d7727c" strokeWidth="4" />

      <circle cx="214" cy="330" r="5" fill="#d7727c" />
      <circle cx="786" cy="330" r="5" fill="#d7727c" />
      <circle cx="214" cy="694" r="5" fill="#d7727c" />
      <circle cx="786" cy="694" r="5" fill="#d7727c" />

      <path
        d="M420 1140v-82c0-46 36-84 80-84s80 38 80 84v82"
        fill="rgba(137, 217, 246, 0.18)"
        stroke="#7acced"
        strokeWidth="8"
      />
      <path
        d="M456 1140v-40c0-25 20-45 44-45s44 20 44 45v40"
        fill="none"
        stroke="#7acced"
        strokeWidth="8"
      />
      <rect x="460" y="994" width="80" height="24" rx="7" fill="#182130" />
      <path
        d="M472 1018v-24h56v24"
        fill="none"
        stroke="#182130"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M472 1018l8 18m8-18l8 18m8-18l8 18m8-18l8 18m8-18l8 18"
        stroke="#182130"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M130 250v64m740-64v64"
        stroke="#2f87d6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line x1="500" y1="250" x2="500" y2="1088" stroke="rgba(24, 33, 48, 0.08)" strokeWidth="3" />
    </svg>
  );
}
