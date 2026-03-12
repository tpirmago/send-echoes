import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SphereData {
  id: string;
  color: string;
}

interface GlassBottleProps {
  spheres: SphereData[];
  droppingSphere?: SphereData | null;
  onDropComplete?: () => void;
  /** ID of the sphere that just landed — skip its enter animation for a seamless swap */
  skipEnterAnimId?: string | null;
}

const SPHERE_R = 14;
const MAX_SPHERES = 67;

// Grid positions inside the bottle body — 7 cols × 10 rows = 70 slots, filled bottom-up
const GRID: Array<{ x: number; y: number }> = (() => {
  const positions: Array<{ x: number; y: number }> = [];
  const evenCols = [40, 60, 80, 100, 120, 140, 160];
  const oddCols  = [50, 70, 90, 110, 130, 150, 170];
  const rowY     = [393, 371, 349, 327, 305, 283, 261, 239, 217, 195];
  rowY.forEach((y, row) => {
    (row % 2 === 0 ? evenCols : oddCols).forEach((x) => positions.push({ x, y }));
  });
  return positions;
})();

// Four gentle float patterns — each sphere gets a slightly different drift
const FLOAT_PATTERNS = [
  { x: [-2,  3, -1,  2, -2], y: [0, -4, -7, -3, 0] },
  { x: [ 3, -2,  4, -1,  3], y: [0, -6, -3, -8, 0] },
  { x: [-1,  2, -3,  1, -1], y: [0, -3, -6, -4, 0] },
  { x: [ 2, -3,  1, -2,  2], y: [0, -5, -8, -2, 0] },
];

type DropPhase = 'falling' | 'sliding' | 'overflow-exit' | null;

export function GlassBottle({ spheres, droppingSphere, onDropComplete, skipEnterAnimId }: GlassBottleProps) {
  const dropTarget = GRID[Math.min(spheres.length, GRID.length - 1)];
  const corkLifted = !!droppingSphere;
  const isOverflow = spheres.length >= MAX_SPHERES;

  const [dropPhase, setDropPhase] = useState<DropPhase>(null);

  // Start phase when a new sphere arrives; reset when cleared
  useEffect(() => {
    if (droppingSphere) {
      setDropPhase('falling');
    } else {
      setDropPhase(null);
    }
  }, [droppingSphere?.id, !!droppingSphere]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAnimComplete() {
    if (dropPhase === 'falling') {
      setDropPhase(isOverflow ? 'overflow-exit' : 'sliding');
    } else if (dropPhase === 'sliding' || dropPhase === 'overflow-exit') {
      onDropComplete?.();
    }
  }

  return (
    <svg
      viewBox="0 0 200 440"
      style={{
        width: '100%',
        maxWidth: 180,
        overflow: 'visible',
        filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.14))',
      }}
      aria-label="Glass bottle containing your Echoes"
    >
      <defs>
        {/* Interior clip: shoulders + body + rounded bottom */}
        <clipPath id="bottle-body-clip">
          <path d="M 83 120 C 68 140 30 165 26 188 L 20 385 Q 20 412 100 414 Q 180 412 180 385 L 174 188 C 170 165 132 140 117 120 Z" />
        </clipPath>

        {/* Clip for the neck+shoulder overlay drawn on top of the dropping sphere */}
        <clipPath id="neck-overlay-clip">
          <rect x="0" y="0" width="200" height="200" />
        </clipPath>

        {/* Clip for the dropping sphere — allows above-SVG travel but hard-stops at bottle bottom */}
        <clipPath id="drop-sphere-clip">
          <rect x="-50" y="-600" width="300" height="1013" />
        </clipPath>

        {/* Soft blue glass fill */}
        <linearGradient id="glass-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(180,220,255,0.28)" />
          <stop offset="42%"  stopColor="rgba(180,220,255,0.09)" />
          <stop offset="100%" stopColor="rgba(160,210,255,0.22)" />
        </linearGradient>

        {/* Left edge highlight */}
        <linearGradient id="left-highlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.52)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Shoulder bump ring */}
        <linearGradient id="bump-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(210,235,255,0.72)" />
          <stop offset="40%"  stopColor="rgba(185,220,255,0.45)" />
          <stop offset="100%" stopColor="rgba(160,205,255,0.12)" />
        </linearGradient>

        {/* Cork warm wood */}
        <linearGradient id="cork-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#C8952E" />
          <stop offset="100%" stopColor="#7A5412" />
        </linearGradient>

        {/* Glow for resting spheres */}
        <filter id="sphere-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Brighter glow for the falling sphere */}
        <filter id="drop-glow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── BOTTLE GLASS (back layer) ── */}
      <path
        d="M 83 48 L 83 120
           C 68 140 30 165 26 188
           L 20 385
           Q 20 412 100 414
           Q 180 412 180 385
           L 174 188
           C 170 165 132 140 117 120
           L 117 48 Z"
        fill="url(#glass-fill)"
        stroke="#1F2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ── FLOATING SPHERES (clipped to bottle interior) ── */}
      <g clipPath="url(#bottle-body-clip)">
        <AnimatePresence>
          {spheres.map((sphere, i) => {
            const pos = GRID[i];
            if (!pos) return null;
            const pat = FLOAT_PATTERNS[i % 4];
            const isNew = sphere.id === skipEnterAnimId;
            return (
              <motion.circle
                key={sphere.id}
                cx={pos.x}
                cy={pos.y}
                r={SPHERE_R}
                fill={sphere.color}
                fillOpacity={0.45}
                filter="url(#sphere-glow)"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={isNew ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: [...pat.x],
                  y: [...pat.y],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  opacity: { duration: isNew ? 0 : 0.4 },
                  scale: { type: 'spring', stiffness: 200, duration: isNew ? 0 : 0.4 },
                  x: {
                    duration: 5 + (i % 4) * 0.7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.28,
                  },
                  y: {
                    duration: 6 + (i % 3) * 1.0,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.22,
                  },
                }}
              />
            );
          })}
        </AnimatePresence>
      </g>

      {/* ── DROPPING SPHERE ── */}
      {/* Phase 1 (falling): y spring from above; Phase 2 (sliding): x spring to grid column */}
      {/* Phase 3 (overflow-exit): fade out if bottle is full */}
      <g clipPath="url(#drop-sphere-clip)">
        <AnimatePresence>
          {droppingSphere && dropPhase && (
            <motion.circle
              key="dropping"
              cx={100}
              cy={dropTarget.y}
              r={SPHERE_R}
              fill={droppingSphere.color}
              fillOpacity={0.45}
              filter="url(#drop-glow)"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              initial={{ y: -SPHERE_R - 12 - dropTarget.y, opacity: 0 }}
              animate={
                dropPhase === 'falling'
                  ? { y: 0, opacity: 1 }
                  : dropPhase === 'sliding'
                  // cx is a SVG user-unit value — no CSS-px vs SVG-unit mismatch
                  ? { cx: dropTarget.x }
                  : { opacity: 0 } // overflow-exit
              }
              transition={
                dropPhase === 'falling'
                  ? {
                      y: { type: 'spring', stiffness: 85, damping: 12, mass: 1.5, delay: 0.52 },
                      opacity: { duration: 0, delay: 0.52 },
                    }
                  : dropPhase === 'sliding'
                  ? { type: 'spring', stiffness: 260, damping: 22 }
                  : { duration: 0.3 }
              }
              exit={{ opacity: 0, transition: { duration: 0 } }}
              onAnimationComplete={handleAnimComplete}
            />
          )}
        </AnimatePresence>
      </g>

      {/* ── NECK + SHOULDER OVERLAY (drawn after sphere so glass walls appear in front) ── */}
      <g clipPath="url(#neck-overlay-clip)">
        {/* Fill — closed path so the glass color covers neck/shoulders */}
        <path
          d="M 83 48 L 83 120
             C 68 140 30 165 26 188
             L 174 188
             C 170 165 132 140 117 120
             L 117 48 Z"
          fill="url(#glass-fill)"
          stroke="none"
        />
        {/* Left neck + shoulder outline (no bottom segment) */}
        <path
          d="M 83 48 L 83 120 C 68 140 30 165 26 188"
          fill="none"
          stroke="#1F2937"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Right neck + shoulder outline (no bottom segment) */}
        <path
          d="M 117 48 L 117 120 C 132 140 170 165 174 188"
          fill="none"
          stroke="#1F2937"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Left neck highlight (re-applied on top) */}
        <path d="M 84 50 L 84 118 L 91 118 L 92 50 Z" fill="rgba(255,255,255,0.36)" />
        {/* Shoulder glint (re-applied on top) */}
        <path
          d="M 34 192 C 42 180 60 168 83 155 C 59 172 40 186 34 196 Z"
          fill="rgba(255,255,255,0.20)"
        />
      </g>

      {/* ── SHOULDER BUMP RING (replaces horizontal line) ── */}
      <ellipse cx="100" cy="188" rx="74" ry="6.5" fill="url(#bump-grad)" />
      <ellipse cx="100" cy="186" rx="68" ry="3.5" fill="rgba(235,248,255,0.38)" />

      {/* ── GLASS HIGHLIGHTS ── */}
      {/* Left body edge */}
      <path
        d="M 22 192 C 26 198 33 218 35 264 L 35 378 C 32 390 24 403 22 409 L 22 192 Z"
        fill="url(#left-highlight)"
        opacity="0.72"
      />
      {/* Left neck strip and shoulder glint are rendered in the neck overlay above */}
      {/* Right inner body shine */}
      <path
        d="M 156 202 C 158 208 159 274 158 377 C 161 377 162 208 160 202 Z"
        fill="rgba(255,255,255,0.11)"
      />

      {/* ── INNER WHITE EDGE (depth illusion) ── */}
      <path
        d="M 83 48 L 83 120
           C 68 140 30 165 26 188
           L 20 385
           Q 20 412 100 414
           Q 180 412 180 385
           L 174 188
           C 170 165 132 140 117 120
           L 117 48 Z"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.8"
      />

      {/* ── CORK (drawn last — occludes sphere as it passes through neck) ── */}
      {/* Arc trajectory: shoots up first, then swings to the left */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={
          corkLifted
            ? { x: [0, -8, -52], y: [0, -38, -16], rotate: [0, -8, -28] }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          corkLifted
            ? { duration: 0.52, ease: [0.22, 1, 0.36, 1], times: [0, 0.42, 1] }
            : { type: 'spring', stiffness: 220, damping: 20 }
        }
      >
        <rect x="79" y="8" width="42" height="42" rx="6" fill="url(#cork-grad)" />
        {/* Wood grain */}
        <line x1="79" y1="21" x2="121" y2="21" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
        <line x1="79" y1="30" x2="121" y2="30" stroke="rgba(0,0,0,0.10)" strokeWidth="0.8" />
        <line x1="79" y1="38" x2="121" y2="38" stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />
        {/* Cork top highlight */}
        <rect x="83" y="11" width="16" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
      </motion.g>
    </svg>
  );
}
