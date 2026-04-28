'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Avatar({ user }) {
  if (user.photoURL) {
    return <img src={user.photoURL} alt={user.displayName || 'User'} className="user-avatar-img" referrerPolicy="no-referrer" />;
  }
  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <span className="user-avatar-initials">{initials}</span>;
}

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="user-menu">
      <button
        className="user-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar user={user} />
      </button>

      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="user-menu-dropdown">
            <p className="user-menu-name">{user.displayName || user.email}</p>
            <p className="user-menu-email">{user.email}</p>
            <hr className="user-menu-divider" />
            <button
              className="user-menu-signout"
              onClick={() => { signOut(); setOpen(false); }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
