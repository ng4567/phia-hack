// Editorial line-art silhouette.
// Coordinates on a 360×720 viewBox. Slot anchor points documented inline
// so DropZone can position absolutely over them.
//
//   head     : cx 180, cy 100,  r ~54
//   top      : cx 180, cy 250,  w 180, h 140  (shoulders → waist)
//   bottom   : cx 180, cy 430,  w 150, h 160  (waist → knee)
//   feet     : cx 180, cy 620,  w 160, h 90   (shin → floor)
//   accessory: cx 280, cy 330,  r 45         (held at right hand)

export function SilhouetteSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 720"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* head */}
      <ellipse cx="180" cy="100" rx="44" ry="54" />
      {/* neck */}
      <path d="M165 150 L160 168 M195 150 L200 168" />
      {/* shoulders & torso outline */}
      <path d="M160 168 C 130 178, 108 210, 106 240 L 114 320 C 118 340, 128 348, 140 354 L 145 400 L 150 500" />
      <path d="M200 168 C 230 178, 252 210, 254 240 L 246 320 C 242 340, 232 348, 220 354 L 215 400 L 210 500" />
      {/* waist & hips join */}
      <path d="M140 354 L 220 354" opacity="0.4" />
      {/* legs — outer */}
      <path d="M150 500 C 148 560, 146 610, 150 660" />
      <path d="M210 500 C 212 560, 214 610, 210 660" />
      {/* legs — inner */}
      <path d="M178 500 C 178 560, 175 610, 168 660" />
      <path d="M182 500 C 182 560, 185 610, 192 660" />
      {/* ground */}
      <path d="M130 670 L 230 670" opacity="0.35" />
      {/* arms */}
      <path d="M108 240 C 92 280, 88 320, 96 360 L 118 390" />
      <path d="M252 240 C 268 280, 272 320, 264 360 L 242 390" />
      {/* hand hints */}
      <circle cx="110" cy="400" r="5" opacity="0.5" />
      <circle cx="250" cy="400" r="5" opacity="0.5" />
    </svg>
  );
}

// Slot anchor positions as percentages of the 360×720 viewBox, for absolute DropZone overlays.
export const slotAnchors = {
  head: { leftPct: 50, topPct: 14, widthPct: 30, heightPct: 16 },
  top: { leftPct: 50, topPct: 38, widthPct: 50, heightPct: 26 },
  bottom: { leftPct: 50, topPct: 65, widthPct: 42, heightPct: 22 },
  feet: { leftPct: 50, topPct: 88, widthPct: 45, heightPct: 12 },
  accessory: { leftPct: 76, topPct: 55, widthPct: 25, heightPct: 16 },
} as const;
