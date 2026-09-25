import React from 'react';

/*
 * ANX Notes
 * Modern app logo:
 * - Stylized note
 * - Folded corner
 * - Integrated writing/pen mark
 * - Blue → indigo → violet identity
 */

function NoteIcon() {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ANX Notes"
    >
      <defs>

        {/* Main brand gradient */}
        <linearGradient
          id="anx-note-main"
          x1="52"
          y1="38"
          x2="268"
          y2="282"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="0.38" stopColor="#3B82F6" />
          <stop offset="0.72" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>

        {/* Light surface gradient */}
        <linearGradient
          id="anx-note-surface"
          x1="86"
          y1="48"
          x2="231"
          y2="266"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.02" />
        </linearGradient>

        {/* Fold gradient */}
        <linearGradient
          id="anx-note-fold"
          x1="190"
          y1="45"
          x2="258"
          y2="113"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>

        {/* Writing stroke */}
        <linearGradient
          id="anx-note-writing"
          x1="87"
          y1="199"
          x2="231"
          y2="235"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="0.5" stopColor="#6366F1" />
          <stop offset="1" stopColor="#C084FC" />
        </linearGradient>

        {/* Soft logo shadow */}
        <filter
          id="anx-note-shadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="190%"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="13"
            floodColor="#4F46E5"
            floodOpacity="0.20"
          />
        </filter>

        {/* Small glow */}
        <filter
          id="anx-note-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="5" />
        </filter>

      </defs>


      {/* =====================================================
          SOFT GLOW
         ===================================================== */}

      <path
        d="
          M82 34
          H194
          L270 110
          V260
          C270 278 256 292 238 292
          H82
          C58 292 42 276 42 252
          V74
          C42 50 58 34 82 34
          Z
        "
        fill="#6366F1"
        opacity="0.12"
        filter="url(#anx-note-glow)"
      />


      {/* =====================================================
          MAIN NOTE BODY
         ===================================================== */}

      <path
        d="
          M82 34
          H194
          L270 110
          V260
          C270 278 256 292 238 292
          H82
          C58 292 42 276 42 252
          V74
          C42 50 58 34 82 34
          Z
        "
        fill="url(#anx-note-main)"
        filter="url(#anx-note-shadow)"
      />


      {/* =====================================================
          INNER NOTE SURFACE
         ===================================================== */}

      <path
        d="
          M84 53
          H186
          L250 117
          V252
          C250 263 241 272 230 272
          H84
          C70 272 62 264 62 250
          V75
          C62 62 70 53 84 53
          Z
        "
        fill="url(#anx-note-surface)"
      />


      {/* =====================================================
          FOLDED CORNER
         ===================================================== */}

      <path
        d="
          M194 35
          V96
          C194 105 201 112 210 112
          H269
        "
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="
          M194 35
          L269 110
          H211
          C201.6 110 194 102.4 194 93
          Z
        "
        fill="url(#anx-note-fold)"
      />

      {/* Fold highlight */}
      <path
        d="
          M202 50
          L251 99
          H215
          C207.8 99 202 93.2 202 86
          Z
        "
        fill="#FFFFFF"
        opacity="0.10"
      />


      {/* =====================================================
          NOTE CONTENT
         ===================================================== */}

      {/* Heading line */}
      <path
        d="M83 145 H178"
        stroke="#FFFFFF"
        strokeOpacity="0.72"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Secondary line */}
      <path
        d="M83 169 H216"
        stroke="#FFFFFF"
        strokeOpacity="0.34"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Short line */}
      <path
        d="M83 191 H151"
        stroke="#FFFFFF"
        strokeOpacity="0.22"
        strokeWidth="7"
        strokeLinecap="round"
      />


      {/* =====================================================
          SIGNATURE / WRITING STROKE
         ===================================================== */}

      <path
        d="
          M82 231
          C96 214 109 249 124 231
          C139 213 151 246 166 230
          C181 214 194 238 207 222
          C214 214 220 211 228 211
        "
        stroke="url(#anx-note-writing)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      {/* =====================================================
          PEN / WRITING TIP
         ===================================================== */}

      <path
        d="
          M221 210
          L239 192
          C242 189 247 189 250 192
          L253 195
          C256 198 256 203 253 206
          L235 224
          Z
        "
        fill="#FFFFFF"
        fillOpacity="0.92"
      />

      <path
        d="M221 210 L235 224"
        stroke="#6366F1"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Pen tip */}
      <path
        d="M221 210 L219 228 L235 224 Z"
        fill="#FFFFFF"
        fillOpacity="0.96"
      />

    </svg>
  );
}


export function AppBrand() {
  return (
    <div className="app-brand">

      <div
        className="app-logo"
        aria-label="ANX Notes"
      >
        <NoteIcon />
      </div>

      <div className="app-brand-text">
        <span className="app-brand-title">
          ANX{' '}
          <span className="app-brand-accent">
            Notes
          </span>
        </span>
      </div>

    </div>
  );
}

export default AppBrand;