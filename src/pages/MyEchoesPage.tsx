import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEchoes } from '../hooks/useEchoes';
import { useDeleteEcho } from '../hooks/useDeleteEcho';
import { EchoCard } from '../components/echo/EchoCard';
import { GlassBottle } from '../components/bottle/GlassBottle';
import { ECHO_CONFIG } from '../utils/echoConfig';
import { useState, useLayoutEffect, useMemo, useRef } from 'react';
import type { EchoType } from '../types/echo';

type Filter = 'all' | 'sealed' | 'unsealed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sealed', label: 'Sealed' },
  { value: 'unsealed', label: 'Unsealed' },
];

export function MyEchoesPage() {
  const { data: echoes, isLoading, isFetching, error } = useEchoes();
  const { mutate: deleteEcho } = useDeleteEcho();
  const [filter, setFilter] = useState<Filter>('all');
  const location = useLocation();

  const newEchoType = (location.state as { newEchoType?: EchoType } | null)?.newEchoType ?? null;

  // ID of the sphere currently being animated into the bottle.
  // While this is set, the sphere is excluded from the resting list and rendered as "dropping".
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  // Prevents the animation from triggering more than once per navigation
  const hasTriggeredRef = useRef(false);

  // All sealed echoes sorted oldest-first → stable GRID positions
  const sortedSpheres = useMemo(() => {
    if (!echoes) return [];
    return [...echoes]
      .filter((e) => !e.isUnlocked)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({ id: e.id, color: ECHO_CONFIG[e.type].color }));
  }, [echoes]);

  // While the sphere is dropping, exclude it from the resting list so it never
  // appears statically in the bottle before the animation plays.
  const bottleSpheres = animatingId
    ? sortedSpheres.filter((s) => s.id !== animatingId)
    : sortedSpheres;

  // Real id + color of the sphere being dropped (passed to GlassBottle).
  const droppingSphere = animatingId
    ? (sortedSpheres.find((s) => s.id === animatingId) ?? null)
    : null;

  // useLayoutEffect fires synchronously before the browser paints.
  // This guarantees that when the new sphere first appears in sortedSpheres, animatingId is
  // already set — so the sphere is immediately excluded from the resting group and only
  // ever rendered through the drop animation, never as an instant "pop-in".
  useLayoutEffect(() => {
    if (!newEchoType || hasTriggeredRef.current || isFetching || !sortedSpheres.length) return;
    const newest = sortedSpheres[sortedSpheres.length - 1];
    if (!newest) return;
    hasTriggeredRef.current = true;
    setAnimatingId(newest.id);
  }, [newEchoType, sortedSpheres, isFetching]);

  return (
    <div style={pageStyle}>
      {/* Bottle + header */}
      <div style={heroStyle}>
        <div style={bottleWrapStyle}>
          <GlassBottle
            spheres={bottleSpheres}
            droppingSphere={droppingSphere}
            onDropComplete={() => setAnimatingId(null)}
          />
        </div>
        <div style={heroTextStyle}>
          <h1 style={headingStyle}>My Echoes</h1>
          <p style={subStyle}>
            {sortedSpheres.length > 0
              ? `${sortedSpheres.length} ${sortedSpheres.length === 1 ? 'echo' : 'echoes'} inside`
              : 'Your bottle is empty — send your first Echo.'}
          </p>
          <Link to="/create" style={createLinkStyle}>
            + Create Echo
          </Link>
        </div>
      </div>

      {/* Echo grid */}
      <div style={gridWrapStyle}>
        {isLoading && (
          <p style={mutedStyle}>Loading your Echoes…</p>
        )}

        {error && (
          <p style={{ ...mutedStyle, color: '#ef4444' }}>
            Failed to load Echoes. {error instanceof Error ? error.message : ''}
          </p>
        )}

        {!isLoading && echoes?.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={mutedStyle}>No echoes yet.</p>
            <Link to="/create" style={{ ...createLinkStyle, marginTop: 16, display: 'inline-block' }}>
              Create your first Echo
            </Link>
          </div>
        )}

        {!isLoading && !!echoes?.length && (
          <div style={filterBarStyle}>
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  ...filterBtnStyle,
                  background: filter === value ? '#1a1a2e' : 'transparent',
                  color: filter === value ? '#fff' : '#6b7280',
                  border: filter === value ? '1.5px solid #1a1a2e' : '1.5px solid #e5e7eb',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div style={gridStyle}>
          <AnimatePresence>
            {echoes?.filter((e) => {
              if (filter === 'sealed') return !e.isUnlocked;
              if (filter === 'unsealed') return e.isUnlocked && !e.openedAt;
              return true;
            }).map((echo, i) => (
              <motion.div
                key={echo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, delay: i * 0.04 }}
              >
                <Link to={`/echoes/${echo.id}`} style={{ textDecoration: 'none' }}>
                  <EchoCard
                    {...echo}
                    onDelete={echo.isUnlocked ? (e) => {
                      e.preventDefault();
                      if (window.confirm('Delete this Echo? This cannot be undone.')) {
                        deleteEcho(echo.id);
                      }
                    } : undefined}
                  />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 58px)',
  maxWidth: 1280,
  margin: '0 auto',
  padding: '0 24px 80px',
};

const heroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 48,
  padding: '48px 0 40px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const heroTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headingStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#1a1a2e',
  letterSpacing: '-0.03em',
  margin: 0,
};

const subStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#6b7280',
  margin: 0,
};

const createLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#1a1a2e',
  color: '#fff',
  borderRadius: 999,
  padding: '12px 28px',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'background 0.2s',
  alignSelf: 'flex-start',
};

const bottleWrapStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 240,
  display: 'flex',
  justifyContent: 'center',
};

const gridWrapStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 20,
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 20,
};

const filterBtnStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '7px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const mutedStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 14,
  textAlign: 'center',
  padding: '24px 0',
};
