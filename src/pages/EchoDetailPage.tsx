import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEcho } from '../hooks/useEchoes';
import { useEchoAttachments } from '../hooks/useEchoAttachments';
import { useOpenEcho } from '../hooks/useOpenEcho';
import { ECHO_CONFIG } from '../utils/echoConfig';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export function EchoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: echo, isLoading, error } = useEcho(id!);
  const { data: attachments, isLoading: attachmentsLoading, error: attachmentsError } = useEchoAttachments(id!);
  const { mutate: openEcho } = useOpenEcho();

  useEffect(() => {
    if (echo?.isUnlocked && !echo.openedAt) {
      openEcho(echo.id);
    }
  }, [echo?.id, echo?.isUnlocked, echo?.openedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div style={centerStyle}>
        <p style={mutedStyle}>Loading…</p>
      </div>
    );
  }

  if (error || !echo) {
    return (
      <div style={centerStyle}>
        <p style={{ ...mutedStyle, color: '#ef4444' }}>
          {error instanceof Error ? error.message : 'Echo not found.'}
        </p>
        <button style={backBtnStyle} onClick={() => navigate('/echoes')}>
          ← Back to My Echoes
        </button>
      </div>
    );
  }

  const cfg = ECHO_CONFIG[echo.type];

  return (
    <div style={pageStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={cardStyle}
      >
        {/* Gradient header */}
        <div style={{ background: echo.isUnlocked ? cfg.gradient : cfg.softGradient, ...headerStyle, position: 'relative' }}>
          <span style={typeBadgeStyle}>{cfg.label}</span>
          <button
            onClick={() => navigate('/echoes')}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 12,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0,0,0,0.18)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
              transition: 'opacity 0.15s, background 0.15s',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(0,0,0,0.40)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'rgba(0,0,0,0.18)';
            }}
          >
            <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
              <line x1="1" y1="1" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={bodyStyle}>
          <button style={backBtnStyle} onClick={() => navigate('/echoes')}>
            ← My Echoes
          </button>

          <h1 style={titleStyle}>{echo.title}</h1>

          <div style={metaStyle}>
            <span style={metaItemStyle}>
              Created {dateFormatter.format(echo.createdAt)}
            </span>
            <span style={{ color: '#d1d5db' }}>·</span>
            <span style={metaItemStyle}>
              {echo.isUnlocked
                ? `Unlocked ${dateFormatter.format(echo.unlockAt)}`
                : `Unlocks ${dateFormatter.format(echo.unlockAt)}`}
            </span>
          </div>

          {!echo.isUnlocked ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={sealedBoxStyle}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 15, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                This Echo is still sealed.
                <br />
                It will open on{' '}
                <strong style={{ color: '#1a1a2e' }}>{dateFormatter.format(echo.unlockAt)}</strong>.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {echo.content ? (
                <div style={messageStyle}>
                  {echo.content.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.75 }}>
                      {line || <br />}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 15 }}>
                  No message was written for this Echo.
                </p>
              )}

              {/* Goals reflection */}
              {echo.type === 'goals' && <GoalsReflection echoId={echo.id} accentColor={ECHO_CONFIG.goals.color} />}

              {/* Attachments section */}
              {attachmentsLoading && (
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Loading attachments…</p>
              )}

              {attachmentsError && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                  Failed to load attachments: {attachmentsError instanceof Error ? attachmentsError.message : 'unknown error'}
                </div>
              )}

              {!attachmentsLoading && !attachmentsError && attachments && attachments.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Attachments
                  </p>
                  {/* Image grid */}
                  {attachments.some((a) => a.mime_type.startsWith('image/')) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
                      {attachments.filter((a) => a.mime_type.startsWith('image/')).map((a) => (
                        a.url
                          ? (
                            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#f3f4f6' }}>
                              <img src={a.url} alt={a.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </a>
                          ) : (
                            <div key={a.id} style={{ borderRadius: 10, aspectRatio: '1', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 8 }}>
                              {a.file_name}<br/>unavailable
                            </div>
                          )
                      ))}
                    </div>
                  )}
                  {/* Document list */}
                  {attachments.filter((a) => !a.mime_type.startsWith('image/')).map((a) => (
                    a.url
                      ? (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={a.file_name}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, textDecoration: 'none', marginBottom: 6 }}
                        >
                          <span style={{ fontSize: 20 }}>{a.mime_type === 'application/pdf' ? '📄' : '📝'}</span>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.file_name}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                            {a.file_size < 1024 * 1024 ? `${Math.round(a.file_size / 1024)} KB` : `${(a.file_size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                        </a>
                      ) : (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 6, opacity: 0.5 }}>
                          <span style={{ fontSize: 20 }}>📎</span>
                          <span style={{ fontSize: 13, color: '#9ca3af', flex: 1 }}>{a.file_name} — unavailable</span>
                        </div>
                      )
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Goals Reflection ─────────────────────────────────────────────────────────

type GoalsAnswer = 'yes' | 'partially' | 'not-yet';

const ANSWERS: { value: GoalsAnswer; label: string; message: string }[] = [
  { value: 'yes',       label: 'Yes!',      message: 'Amazing — you did it! Every goal you set, you crushed.' },
  { value: 'partially', label: 'Partially', message: 'Progress is still progress. You\'re closer than you were.' },
  { value: 'not-yet',   label: 'Not yet',   message: 'That\'s okay. The goal is still out there — maybe it\'s time to revisit it.' },
];

function GoalsReflection({ echoId, accentColor }: { echoId: string; accentColor: string }) {
  const storageKey = `goals-reflection-${echoId}`;
  const [answer, setAnswer] = useState<GoalsAnswer | null>(
    () => (localStorage.getItem(storageKey) as GoalsAnswer | null)
  );

  const select = (val: GoalsAnswer) => {
    localStorage.setItem(storageKey, val);
    setAnswer(val);
  };

  const chosen = ANSWERS.find((a) => a.value === answer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{
        marginTop: 8,
        padding: '24px 24px 20px',
        background: `${accentColor}0d`,
        border: `1.5px solid ${accentColor}30`,
        borderRadius: 18,
      }}
    >
      <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>
        Did you achieve these goals?
      </p>

      {!answer ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ANSWERS.map((a) => (
            <button
              key={a.value}
              onClick={() => select(a.value)}
              style={{
                padding: '9px 20px',
                borderRadius: 999,
                border: `1.5px solid ${accentColor}60`,
                background: '#fff',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = accentColor;
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.borderColor = `${accentColor}60`;
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={answer}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'flex-start' }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                {chosen!.message}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 58px)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '48px 16px 80px',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 620,
  background: '#fff',
  borderRadius: 28,
  overflow: 'hidden',
  boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
};

const headerStyle: React.CSSProperties = {
  height: 160,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '20px 28px 22px',
};

const typeBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'rgba(255,255,255,0.55)',
  color: '#374151',
  borderRadius: 999,
  padding: '4px 12px',
};

const bodyStyle: React.CSSProperties = {
  padding: '0px 32px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 700,
  color: '#1a1a2e',
  letterSpacing: '-0.02em',
  margin: 0,
  lineHeight: 1.3,
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const metaItemStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#9ca3af',
};

const sealedBoxStyle: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: 16,
  padding: '32px 24px',
  textAlign: 'center',
  marginTop: 8,
};

const messageStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#374151',
  lineHeight: 1.75,
  marginTop: 8,
  padding: '24px',
  background: '#f9fafb',
  borderRadius: 16,
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: 13,
  fontWeight: 500,
  color: '#6b7280',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  marginBottom: 4,
};

const centerStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 58px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
};

const mutedStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 14,
};
