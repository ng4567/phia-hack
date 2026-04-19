// Brand-accurate service logos — Gmail, Google Calendar, Outlook.
// Inline SVGs with trademark colors. All three accept a `size` prop
// (defaults to 20). The Gmail and Outlook marks use their native
// non-square aspect (4:3); the Google Calendar mark is square.

export function GmailLogo({ size = 20 }: { size?: number }) {
  const h = Math.round((size * 3) / 4);
  return (
    <svg
      viewBox="0 0 48 36"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Blue left sleeve (Google blue) */}
      <path d="M0 6a2 2 0 0 1 2-2h4v28H2a2 2 0 0 1-2-2V6z" fill="#4285F4" />
      {/* Green right sleeve (Google green) */}
      <path d="M48 6v22a2 2 0 0 1-2 2h-4V4h4a2 2 0 0 1 2 2z" fill="#34A853" />
      {/* Yellow right flap */}
      <path d="M42 4v7.5L48 6a2 2 0 0 0-2-2h-4z" fill="#FBBC04" />
      {/* Red M body */}
      <path d="M6 11.5L24 24l18-12.5V32H6V11.5z" fill="#EA4335" />
      {/* Dark red left flap */}
      <path d="M6 4H2a2 2 0 0 0-2 2l6 5.5V4z" fill="#C5221F" />
    </svg>
  );
}

export function GoogleCalendarLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* White body with soft border */}
      <rect
        x="7"
        y="9"
        width="34"
        height="34"
        rx="2.5"
        fill="#FFFFFF"
        stroke="#E0E0E0"
        strokeWidth="1"
      />
      {/* Google color frame accents (top strip of each side) */}
      <path d="M41 9v4H7V11a2 2 0 0 1 2-2h32z" fill="#FFFFFF" />
      <rect x="7" y="9" width="34" height="1.5" fill="#F1F1F1" />
      {/* Hanger tabs */}
      <rect x="13" y="4" width="3" height="9" rx="1.5" fill="#5F6368" />
      <rect x="32" y="4" width="3" height="9" rx="1.5" fill="#5F6368" />
      {/* Four corner color accents (subtle Google-brand look) */}
      <path d="M7 40v1.5A2.5 2.5 0 0 0 9.5 44H13V40z" fill="#EA4335" />
      <path d="M41 40H35v4h3.5A2.5 2.5 0 0 0 41 41.5V40z" fill="#34A853" />
      {/* "31" numerals */}
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontFamily="'Google Sans', 'Inter', Arial, sans-serif"
        fontWeight={500}
        fontSize="16"
        fill="#4285F4"
        letterSpacing="-0.02em"
      >
        31
      </text>
    </svg>
  );
}

export function OutlookLogo({ size = 20 }: { size?: number }) {
  const h = Math.round((size * 3) / 4);
  return (
    <svg
      viewBox="0 0 48 36"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Deep blue square (Outlook primary) */}
      <rect x="1" y="6" width="28" height="24" rx="2" fill="#0078D4" />
      {/* White O */}
      <ellipse
        cx="15"
        cy="18"
        rx="5"
        ry="6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
      />
      {/* Light-blue envelope flap on right */}
      <path d="M29 12l18-6v24l-18-6z" fill="#50D9FF" />
      {/* Soft shadow seam between square and flap */}
      <rect x="28.5" y="6" width="1" height="24" fill="#0A78BC" opacity="0.25" />
    </svg>
  );
}
