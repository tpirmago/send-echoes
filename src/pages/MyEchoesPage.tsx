import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEchoes } from '../hooks/useEchoes';
import { useDeleteEcho } from '../hooks/useDeleteEcho';
import { EchoCard } from '../components/echo/EchoCard';
import { GlassBottle } from '../components/bottle/GlassBottle';
import { ECHO_CONFIG } from '../utils/echoConfig';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { EchoType } from '../types/echo';

type Filter = 'all' | 'sealed' | 'unsealed' | 'opened';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sealed', label: 'Sealed' },
  { value: 'unsealed', label: 'Unsealed' },
  { value: 'opened', label: 'Opened' },
];

export function MyEchoesPage() {
  const { data: echoes, isLoading, isFetching, error } = useEchoes();
  const { mutate: deleteEcho } = useDeleteEcho();
  const [filter, setFilter] = useState<Filter>('all');
  const location = useLocation();

  const newEchoType = (location.state as { newEchoType?: EchoType } | null)?.newEchoType ?? null;

  // Hide the newest sphere from the bottle until the drop animation plays
  const [animating, setAnimating] = useState(() => !!newEchoType);
  const [droppingSphere, setDroppingSphere] = useState<{ id: string; color: string } | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  // ID of the sphere that just completed its drop — suppress its enter animation for a seamless swap
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

  // Echoes sorted oldest-first → stable GRID positions (oldest = bottom of bottle)
  const sortedSpheres = useMemo(() => {
    if (!echoes) return [];
    return [...echoes]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({ id: e.id, color: ECHO_CONFIG[e.type].color }));
  }, [echoes]);

  // While animating: hide the newest sphere (last in oldest-first order).
  // dropTarget in GlassBottle = GRID[spheres.length] = exact slot for the new echo.
  const spheres = animating && sortedSpheres.length > 0
    ? sortedSpheres.slice(0, -1)
    : sortedSpheres;

  // Trigger only once React Query finishes the background refetch (isFetching=false),
  // which guarantees the new echo is present in `echoes`.
  useEffect(() => {
    if (!newEchoType || hasTriggered || isFetching || !echoes || echoes.length === 0) return;
    setHasTriggered(true);
    const t = setTimeout(() => {
      setDroppingSphere({ id: 'new-drop', color: ECHO_CONFIG[newEchoType].color });
    }, 350);
    return () => clearTimeout(t);
  }, [newEchoType, echoes, hasTriggered, isFetching]);

  const handleDropComplete = useCallback(() => {
    // Remember the new sphere's ID so GlassBottle can skip its enter animation
    const newId = sortedSpheres[sortedSpheres.length - 1]?.id ?? null;
    setJustDroppedId(newId);
    setDroppingSphere(null);
    setAnimating(false);
    // Clear after one render cycle so future re-mounts animate normally
    if (newId) setTimeout(() => setJustDroppedId(null), 100);
  }, [sortedSpheres]);

  return (
    <div style={pageStyle}>
      {/* Bottle + header */}
      <div style={heroStyle}>
        <div style={bottleWrapStyle}>
          <GlassBottle
            spheres={spheres}
            droppingSphere={droppingSphere}
            onDropComplete={handleDropComplete}
            skipEnterAnimId={justDroppedId}
          />
        </div>
        <div style={heroTextStyle}>
          <h1 style={headingStyle}>My Echoes</h1>
          <p style={subStyle}>
            {echoes?.length
              ? `${echoes.length} ${echoes.length === 1 ? 'echo' : 'echoes'} sealed inside`
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
              if (filter === 'opened') return !!e.openedAt;
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
