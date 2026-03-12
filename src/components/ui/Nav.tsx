import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Nav({ showBorder = true }: { showBorder?: boolean }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <nav style={{ ...navStyle, borderBottom: showBorder ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
      <div style={innerStyle}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span style={logoStyle}>Send Echoes</span>
        </Link>

        {user ? (
          <>
            {/* Desktop nav */}
            <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <NavLink to="/echoes" style={linkStyle}>My Echoes</NavLink>
              <NavLink to="/create" style={ctaLinkStyle}>+ Create Echo</NavLink>
              <button onClick={handleSignOut} style={signOutStyle}>Sign out</button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              style={hamburgerStyle}
            >
              <span style={barStyle(menuOpen, 0)} />
              <span style={barStyle(menuOpen, 1)} />
              <span style={barStyle(menuOpen, 2)} />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/auth" style={ctaLinkStyle}>Log in</Link>
          </div>
        )}
      </div>

      {/* Mobile dropdown */}
      {user && menuOpen && (
        <div className="nav-mobile-menu" style={mobileMenuStyle}>
          <NavLink
            to="/echoes"
            style={mobileLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            My Echoes
          </NavLink>
          <NavLink
            to="/create"
            style={mobileLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            + Create Echo
          </NavLink>
          <button onClick={handleSignOut} style={mobileSignOutStyle}>
            Sign out
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 511px) {
          .nav-hamburger { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
        @media (max-width: 510px) {
          .nav-desktop { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'rgba(248,250,255,0.95)',
  backdropFilter: 'blur(12px)',
};

const innerStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '20px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const logoStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: '#1a1a2e',
  letterSpacing: '-0.02em',
};

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  fontSize: 14,
  fontWeight: 500,
  color: isActive ? '#1a1a2e' : '#6b7280',
  textDecoration: 'none',
  transition: 'color 0.15s',
});

const ctaLinkStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#1a1a2e',
  textDecoration: 'none',
  border: '1.5px solid #1a1a2e',
  borderRadius: 999,
  padding: '6px 16px',
};

const signOutStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #e5e7eb',
  borderRadius: 999,
  padding: '5px 14px',
  fontSize: 13,
  fontWeight: 500,
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
};

const hamburgerStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  justifyContent: 'center',
  alignItems: 'center',
  width: 36,
  height: 36,
};

const barStyle = (open: boolean, i: number): React.CSSProperties => ({
  display: 'block',
  width: 22,
  height: 2,
  background: '#1a1a2e',
  borderRadius: 2,
  transition: 'transform 0.2s, opacity 0.2s',
  transform: open
    ? i === 0 ? 'translateY(7px) rotate(45deg)'
    : i === 2 ? 'translateY(-7px) rotate(-45deg)'
    : 'none'
    : 'none',
  opacity: open && i === 1 ? 0 : 1,
});

const mobileMenuStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 24px 16px',
  gap: 4,
  borderTop: '1px solid rgba(0,0,0,0.06)',
};

const mobileLinkStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: '#1a1a2e',
  textDecoration: 'none',
  padding: '10px 0',
  borderBottom: '1px solid rgba(0,0,0,0.05)',
};

const mobileSignOutStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '10px 0',
  fontSize: 15,
  fontWeight: 500,
  color: '#6b7280',
  cursor: 'pointer',
  textAlign: 'left',
};
