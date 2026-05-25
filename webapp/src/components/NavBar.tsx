import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  albumsOutline,
  analyticsOutline,
  briefcaseOutline,
  cardOutline,
  gridOutline,
  homeOutline,
  informationCircleOutline,
  logInOutline,
  logOutOutline,
  notificationsOutline,
  personAddOutline,
  personCircleOutline,
  pricetagsOutline,
  ribbonOutline,
  shieldCheckmarkOutline,
  sparklesOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import type { UserProfile } from '../api/types';
import { clearAuthSession, formatUserDisplayName, getStoredUser, SESSION_CHANGE_EVENT } from '../auth/storage';
import './NavBar.css';

type NavItem = {
  label: string;
  icon: string;
  path?: string;
  hash?: string;
  action: () => void;
};

const NavBar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(() => getStoredUser());
  const isAdmin = sessionUser?.userRol === 'ADMIN';

  useEffect(() => {
    const handleSessionChange = () => setSessionUser(getStoredUser());
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  useEffect(() => {
    document.body.classList.add('nexus-sidebar-layout');
    return () => {
      document.body.classList.remove('nexus-sidebar-layout');
    };
  }, []);

  const goToHomeSection = useCallback((sectionId: string) => {
    history.push({ pathname: '/', hash: `#${sectionId}` });
  }, [history]);

  const goToRoute = useCallback((path: string) => {
    history.push(path);
  }, [history]);

  const handleLogout = () => {
    clearAuthSession();
    setSessionUser(null);
    history.push('/');
  };

  const guestLinks = useMemo<NavItem[]>(
    () => [
      { label: 'Home', icon: homeOutline, path: '/', action: () => goToRoute('/') },
      { label: 'About', icon: informationCircleOutline, path: '/', hash: '#about-section', action: () => goToHomeSection('about-section') },
      { label: 'Plans', icon: pricetagsOutline, path: '/', hash: '#plans-section', action: () => goToHomeSection('plans-section') },
      { label: 'Brokers', icon: briefcaseOutline, path: '/', hash: '#brokers-section', action: () => goToHomeSection('brokers-section') },
      { label: 'Markets', icon: analyticsOutline, path: '/', hash: '#markets-section', action: () => goToHomeSection('markets-section') },
      { label: 'Security', icon: shieldCheckmarkOutline, path: '/', hash: '#security-section', action: () => goToHomeSection('security-section') }
    ],
    [goToHomeSection, goToRoute]
  );

  const memberLinks = useMemo<NavItem[]>(
    () => [
      { label: 'Profile', icon: personCircleOutline, path: '/profile', action: () => goToRoute('/profile') },
      { label: 'Subscription', icon: sparklesOutline, path: '/plan-selection', action: () => goToRoute('/plan-selection') },
      { label: 'Notifications', icon: notificationsOutline, path: '/notifications', action: () => goToRoute('/notifications') },
      { label: 'Dashboard', icon: gridOutline, path: '/dashboard', action: () => goToRoute('/dashboard') },
      { label: 'Market', icon: analyticsOutline, path: '/markets', action: () => goToRoute('/markets') },
      { label: 'Portfolio', icon: albumsOutline, path: '/portfolio', action: () => goToRoute('/portfolio') }
    ],
    [goToRoute]
  );

  const adminLinks = useMemo<NavItem[]>(
    () => [
      { label: 'Profile', icon: personCircleOutline, path: '/profile', action: () => goToRoute('/profile') },
      { label: 'Market', icon: analyticsOutline, path: '/markets', action: () => goToRoute('/markets') },
      { label: 'Manage Admins', icon: ribbonOutline, path: '/manage-admins', action: () => goToRoute('/manage-admins') },
      { label: 'Manage Plans', icon: cardOutline, path: '/manage-plans', action: () => goToRoute('/manage-plans') }
    ],
    [goToRoute]
  );

  const navItems = sessionUser ? (isAdmin ? adminLinks : memberLinks) : guestLinks;

  const isItemActive = (item: NavItem) => {
    if (item.path === '/markets') {
      return location.pathname.startsWith('/markets');
    }

    if (item.path && location.pathname !== item.path) {
      return false;
    }

    if (item.hash) {
      return location.hash === item.hash;
    }

    return item.path ? location.pathname === item.path : false;
  };

  return (
    <aside className="nexus-sidebar" aria-label="Primary navigation">
      <div className="nexus-sidebar-top">
        <button
          type="button"
          className="nexus-sidebar-logo"
          onClick={() => history.push('/')}
          aria-label="Go to home"
        >
          <span className="nexus-sidebar-logo-mark">
            <IonIcon icon={sparklesOutline} />
          </span>
          <span className="nexus-sidebar-logo-text">Nexus</span>
        </button>

        {sessionUser ? (
          <div className="nexus-sidebar-user" aria-live="polite">
            <strong>{formatUserDisplayName(sessionUser)}</strong>
            <span>@{sessionUser.username}</span>
          </div>
        ) : (
          <p className="nexus-sidebar-tagline">Smart trading tools and clearer decisions in one workspace.</p>
        )}
      </div>

      <nav className="nexus-sidebar-nav">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.label}
            className={`nexus-sidebar-link ${isItemActive(item) ? 'active' : ''}`}
            onClick={item.action}
            aria-current={isItemActive(item) ? 'page' : undefined}
          >
            <IonIcon icon={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="nexus-sidebar-footer">
        {sessionUser ? (
          <button type="button" className="nexus-sidebar-action nexus-sidebar-action--ghost" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} />
            <span>Log Out</span>
          </button>
        ) : (
          <>
            <button type="button" className="nexus-sidebar-action nexus-sidebar-action--ghost" onClick={() => goToRoute('/login')}>
              <IonIcon icon={logInOutline} />
              <span>Log In</span>
            </button>
            <button type="button" className="nexus-sidebar-action nexus-sidebar-action--solid" onClick={() => goToRoute('/signup')}>
              <IonIcon icon={personAddOutline} />
              <span>Sign Up</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default NavBar;
