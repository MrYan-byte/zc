import type { PetState } from "../../shared/types";

interface ChibiPetProps {
  state: PetState;
  paused: boolean;
}

export function ChibiPet({ state, paused }: ChibiPetProps) {
  return (
    <div
      className={`pet-avatar model-pet state-${state} ${paused ? "is-paused" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 330" role="presentation">
        <defs>
          <radialGradient id="skin3d" cx="44%" cy="30%" r="76%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="58%" stopColor="#f5f3ef" />
            <stop offset="100%" stopColor="#d9d6d1" />
          </radialGradient>
          <radialGradient id="hair3d" cx="38%" cy="22%" r="88%">
            <stop offset="0%" stopColor="#252a34" />
            <stop offset="42%" stopColor="#080b12" />
            <stop offset="100%" stopColor="#02040a" />
          </radialGradient>
          <linearGradient id="robeLeft3d" x1="24%" x2="89%" y1="8%" y2="96%">
            <stop offset="0%" stopColor="#f5f7fb" />
            <stop offset="44%" stopColor="#cbd2dc" />
            <stop offset="100%" stopColor="#8b94a2" />
          </linearGradient>
          <linearGradient id="robeRight3d" x1="23%" x2="88%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#d8dde6" />
            <stop offset="52%" stopColor="#8b94a2" />
            <stop offset="100%" stopColor="#4f5867" />
          </linearGradient>
          <linearGradient id="innerRobe3d" x1="42%" x2="56%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
          <linearGradient id="blade3d" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="42%" stopColor="#d9dee7" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="7" />
            <feOffset dx="0" dy="7" result="offset" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.28" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="gloss" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#020617" floodOpacity="0.32" />
          </filter>
        </defs>

        <ellipse
          className="ground-shadow"
          cx="130"
          cy="298"
          rx="70"
          ry="17"
          fill="rgba(15,23,42,0.24)"
        />

        <g className="model-bob" filter="url(#softShadow)">
          <g className="model-sword">
            <path
              d="M177 98l42-60 13 10-43 63z"
              fill="url(#blade3d)"
              stroke="#111827"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              d="M217 40l22-24"
              stroke="#dc2626"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M195 78l-18 20"
              stroke="#ef4444"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect
              x="165"
              y="94"
              width="20"
              height="48"
              rx="9"
              fill="#111827"
              transform="rotate(34 175 118)"
            />
          </g>

          <g className="model-body">
            <path
              className="outer-sleeve sleeve-left"
              d="M91 142c-31 11-53 42-61 83-3 17 6 30 23 31h55l17-95c-8-11-20-18-34-19z"
              fill="url(#robeLeft3d)"
              stroke="#111827"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              className="outer-sleeve sleeve-right"
              d="M169 142c31 11 53 42 61 83 3 17-6 30-23 31h-55l-17-95c8-11 20-18 34-19z"
              fill="url(#robeRight3d)"
              stroke="#111827"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              d="M88 143c12-18 26-27 42-27 17 0 31 10 43 29l12 112H75z"
              fill="#aab2bf"
              stroke="#111827"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              d="M111 127c9-8 15-12 20-12s11 4 19 12l-3 130h-35z"
              fill="url(#innerRobe3d)"
              stroke="#111827"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              d="M91 153l36 104"
              stroke="#111827"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.82"
            />
            <path
              d="M169 153l-36 104"
              stroke="#111827"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.82"
            />
            <path
              d="M82 254h96"
              stroke="#111827"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>

          <g className="model-arm arm-left">
            <path
              d="M91 158c-21 10-38 30-48 58"
              stroke="#18204a"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <circle
              cx="42"
              cy="220"
              r="22"
              fill="url(#skin3d)"
              stroke="#111827"
              strokeWidth="6"
            />
          </g>

          <g className="model-arm arm-right">
            <path
              d="M168 158c21 10 38 30 48 58"
              stroke="#101827"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <circle
              cx="218"
              cy="220"
              r="22"
              fill="url(#skin3d)"
              stroke="#111827"
              strokeWidth="6"
            />
          </g>

          <g className="model-head" filter="url(#gloss)">
            <circle
              cx="130"
              cy="92"
              r="48"
              fill="url(#skin3d)"
              stroke="#111827"
              strokeWidth="6"
            />
            <path
              d="M81 89c-2-35 25-67 64-65 32 2 53 23 56 52-23-13-49-9-76 13-18 15-32 17-44 0z"
              fill="url(#hair3d)"
            />
            <path
              d="M76 101c6-37 26-63 63-69 35-5 65 11 73 38-20-12-48-10-76 8-24 15-41 24-60 23z"
              fill="url(#hair3d)"
              stroke="#111827"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M106 39c-21 18-31 38-33 61 19-3 38-17 56-41z"
              fill="#05070d"
            />
            <path
              d="M132 32c-12 27-24 48-45 65 24 1 46-11 65-36z"
              fill="#070a12"
            />
            <path
              d="M169 42l18-29 28 28-25 3 18 20-35-7z"
              fill="#05070d"
              stroke="#111827"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M102 50c17-18 38-23 65-14"
              stroke="#f8fafc"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.92"
            />
            <path
              d="M148 43c13 1 24 6 33 15"
              stroke="#ef4db2"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M112 98c-7-1-13 1-17 6"
              stroke="#111827"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M151 98c7-1 13 1 17 6"
              stroke="#111827"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M122 120c5 3 12 3 17 0"
              stroke="#111827"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M98 113l-8 13"
              stroke="#111827"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M164 119l9 13"
              stroke="#dc2626"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M172 123l6 8"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          <g className="model-highlights" opacity="0.32">
            <path
              d="M61 219c12-27 26-45 43-54"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M159 156c23 18 36 42 41 74"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
