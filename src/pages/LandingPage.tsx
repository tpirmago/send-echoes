import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassBottle } from '../components/bottle/GlassBottle';
import { ECHO_CONFIG, ECHO_TYPES } from '../utils/echoConfig';
import { useAuth } from '../context/AuthContext';
import { useEchoes } from '../hooks/useEchoes';
import { Nav } from '../components/ui/Nav';
import type { EchoType } from '../types/echo';

// Placeholder spheres shown to non-authenticated visitors (~1/3 of bottle = 23 spheres)
const DEMO_COLORS = [
  ECHO_CONFIG.myself.color,
  ECHO_CONFIG.goals.color,
  ECHO_CONFIG.voice.color,
];
const DEMO_SPHERES = Array.from({ length: 23 }, (_, i) => ({
  id: `d${i}`,
  color: DEMO_COLORS[i % DEMO_COLORS.length],
}));

export function LandingPage() {
  const { user } = useAuth();
  const { data: echoes } = useEchoes(); // only fires when user is set
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<EchoType>('myself');
  const [droppingSphere, setDroppingSphere] = useState<{ id: string; color: string } | null>(null);
  // Demo spheres that have landed — kept in bottle after drop
  const [extraSpheres, setExtraSpheres] = useState<{ id: string; color: string }[]>([]);


  const spheres = [
    ...(user
      ? (echoes ?? []).map((e) => ({ id: e.id, color: ECHO_CONFIG[e.type].color }))
      : DEMO_SPHERES),
    ...extraSpheres,
  ];

  // Demo drop animation — available for both guests and logged-in users
  const handleDropDemo = useCallback(() => {
    if (droppingSphere) return;
    const color = user
      ? ECHO_CONFIG[selectedType].color
      : DEMO_COLORS[Math.floor(Math.random() * DEMO_COLORS.length)];
    setDroppingSphere({ id: `demo-${Date.now()}`, color });
  }, [droppingSphere, user, selectedType]);

  const handleDropComplete = useCallback(() => {
    if (droppingSphere) {
      setExtraSpheres((prev) => [...prev, droppingSphere]);
    }
    setDroppingSphere(null);
  }, [droppingSphere]);

  return (
    <>
      <Nav showBorder={false} />
      <div style={pageStyle}>

        {/* ── Hero ── */}
      <main style={heroStyle}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={heroTextStyle}
        >
          <h1 style={headingStyle}>
            Send a message
            <br />
            <span style={{ color: '#8B5CF6' }}>into the future</span>
          </h1>
          <p style={subtextStyle}>
            Write an Echo, seal it, and choose when it opens.
            <br />A letter to yourself. A memory. A dream.
          </p>

          {user ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/create" style={primaryCtaStyle}>
                + Create Echo
              </Link>
              <Link to="/echoes" style={secondaryCtaStyle}>
                My Echoes
              </Link>
            </div>
          ) : (
            <Link to="/auth" style={primaryCtaStyle}>
              Get started — it's free
            </Link>
          )}
        </motion.div>

        {/* Bottle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
          style={bottleWrapStyle}
        >
          <GlassBottle
            spheres={spheres}
            droppingSphere={droppingSphere}
            onDropComplete={handleDropComplete}
          />

          {/* Demo type picker + drop button (visible when logged in on landing) */}
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 260 }}>
                {ECHO_TYPES.map((type: EchoType) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      border: selectedType === type ? `2px solid ${ECHO_CONFIG[type].color}` : '2px solid #e5e7eb',
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: selectedType === type ? ECHO_CONFIG[type].color : '#fff',
                      color: selectedType === type ? '#fff' : '#374151',
                      transition: 'all 0.15s',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                style={dropBtnStyle}
                onClick={handleDropDemo}
                disabled={!!droppingSphere}
              >
                {droppingSphere ? 'Dropping…' : 'Drop sphere ✦'}
              </button>
            </div>
          )}

          {/* CTA for guests */}
          {!user && (
            <button
              onClick={handleDropDemo}
              disabled={!!droppingSphere}
              style={dropBtnStyle}
            >
              {droppingSphere ? 'Dropping…' : 'Drop an Echo ✦'}
            </button>
          )}
        </motion.div>
      </main>

      {/* ── Feature blurbs ── */}
      <section style={blurbsStyle}>
        {BLURBS.map((b) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ boxShadow: '0 0 0 2px #8B5CF6, 0 4px 24px rgba(139,92,246,0.18)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            style={blurbStyle}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 4px' }}>{b.title}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{b.text}</p>
          </motion.div>
        ))}
      </section>
      </div>
    </>
  );
}

const BLURBS = [
  { title: 'Sealed until ready', text: 'No peeking. Your message is locked until the date you choose' },
  { title: 'Choose how to send your Echo', text: 'Write a letter, capture a goal, or record a voice message' },
  { title: 'A moment of wonder', text: 'When it unlocks, open it and rediscover what you wrote' },
];

// ── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
};


const heroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 72,
  maxWidth: 1280,
  margin: '0 auto',
  padding: '64px 32px 48px',
  flexWrap: 'wrap-reverse',
};

const heroTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  maxWidth: 460,
};

const headingStyle: React.CSSProperties = {
  fontSize: 'clamp(2rem, 5vw, 3.2rem)',
  fontWeight: 800,
  color: '#1a1a2e',
  letterSpacing: '-0.04em',
  lineHeight: 1.15,
  margin: 0,
};

const subtextStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#6b7280',
  lineHeight: 1.65,
  margin: 0,
};

const primaryCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#1a1a2e',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 999,
  padding: '14px 32px',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  alignSelf: 'flex-start',
};

const secondaryCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'transparent',
  color: '#1a1a2e',
  textDecoration: 'none',
  border: '1.5px solid #1a1a2e',
  borderRadius: 999,
  padding: '14px 32px',
  fontSize: 15,
  fontWeight: 600,
  alignSelf: 'flex-start',
};

const bottleWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  flexShrink: 0,
  width: 240,
};

const dropBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1.5px solid #e5e7eb',
  borderRadius: 999,
  padding: '9px 22px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  color: '#374151',
  transition: 'all 0.15s',
};

const blurbsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  justifyContent: 'center',
  flexWrap: 'wrap',
  maxWidth: 960,
  margin: '0 auto',
  padding: '0 32px 80px',
};

const blurbStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  borderRadius: 20,
  padding: '24px 28px',
  maxWidth: 260,
  flex: '1 1 200px',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.6)',
};
