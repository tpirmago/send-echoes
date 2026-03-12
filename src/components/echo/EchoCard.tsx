import { motion } from 'framer-motion';
import type { EchoType } from '../../types/echo';
import { ECHO_CONFIG } from '../../utils/echoConfig';

interface EchoCardProps {
  id: string;
  type: EchoType;
  title: string;
  unlockAt: Date;
  isUnlocked: boolean;
  onClose?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="rgba(255,255,255,0.92)" />
      <path
        d="M8 11V7a4 4 0 1 1 8 0v4"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export function EchoCard({ type, title, unlockAt, isUnlocked, onClose, onDelete }: EchoCardProps) {
  const config = ECHO_CONFIG[type];
  const gradient = isUnlocked ? config.gradient : config.softGradient;
  const formattedDate = dateFormatter.format(unlockAt);

  return (
    <motion.article
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      animate={
        isUnlocked
          ? {
              boxShadow: [
                `0 4px 20px rgba(0,0,0,0.07)`,
                `0 6px 32px ${config.color}44`,
                `0 4px 20px rgba(0,0,0,0.07)`,
              ],
            }
          : { boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }
      }
      transition={
        isUnlocked
          ? { boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }
          : {}
      }
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        background: '#fff',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* ── GRADIENT HEADER ── */}
      <div
        style={{
          height: 130,
          background: gradient,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 18px 14px',
          transition: 'background 0.6s ease',
        }}
      >
        {/* Type label badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isUnlocked ? 'rgba(255,255,255,0.95)' : 'rgba(80,60,120,0.70)',
            background: isUnlocked ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.50)',
            borderRadius: 999,
            padding: '3px 10px',
            alignSelf: 'flex-start',
          }}
        >
          {config.label}
        </span>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 26,
              height: 26,
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
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="1" y1="1" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Lock / unlocked indicator */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {isUnlocked ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ fontSize: 20 }}
            >
              ✨
            </motion.span>
          ) : (
            <LockIcon />
          )}
        </div>
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding: '18px 20px 22px' }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1a1a2e',
            margin: '0 0 8px',
            lineHeight: 1.35,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </h3>

        {isUnlocked ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Opened {formattedDate}</p>
              <button
                style={{
                  background: config.color,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Open Echo
              </button>
            </div>
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="Delete echo"
                style={{
                  background: 'none',
                  border: '1.5px solid #fecaca',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f87171',
                  fontSize: 16,
                  flexShrink: 0,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                🗑
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Opens</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>{formattedDate}</span>
          </div>
        )}
      </div>
    </motion.article>
  );
}
