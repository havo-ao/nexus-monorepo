import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  albumsOutline,
  analyticsOutline,
  barChartOutline,
  briefcaseOutline,
  cardOutline,
  cartOutline,
  gridOutline,
  homeOutline,
  informationCircleOutline,
  logInOutline,
  logOutOutline,
  closeOutline,
  menuOutline,
  notificationsOutline,
  personAddOutline,
  personCircleOutline,
  pricetagsOutline,
  ribbonOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  starOutline,
  timeOutline
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = sessionUser?.userRol === 'ADMIN';
  const isLegal = sessionUser?.userRol === 'LEGAL_USER';
  const isBroker = sessionUser?.userRol === 'CONSULTANT';

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.classList.toggle('nexus-mobile-menu-open', isMobileMenuOpen);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('nexus-mobile-menu-open');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

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
      { label: 'Trading', icon: cartOutline, path: '/trader-panel', action: () => goToRoute('/trader-panel') },
      { label: 'Market', icon: analyticsOutline, path: '/markets', action: () => goToRoute('/markets') },
      { label: 'Watchlist', icon: starOutline, path: '/watchlist', action: () => goToRoute('/watchlist') },
      { label: 'Portfolio', icon: albumsOutline, path: '/portfolio', action: () => goToRoute('/portfolio') }
    ],
    [goToRoute]
  );

  const adminLinks = useMemo<NavItem[]>(
    () => [
      { label: 'Profile', icon: personCircleOutline, path: '/profile', action: () => goToRoute('/profile') },
      { label: 'Market', icon: analyticsOutline, path: '/markets', action: () => goToRoute('/markets') },
      { label: 'Market Hours', icon: timeOutline, path: '/admin/market-hours', action: () => goToRoute('/admin/market-hours') },
      { label: 'Manage Admins', icon: ribbonOutline, path: '/manage-admins', action: () => goToRoute('/manage-admins') },
      { label: 'Manage Plans', icon: cardOutline, path: '/manage-plans', action: () => goToRoute('/manage-plans') },
      { label: 'Reports', icon: barChartOutline, path: '/reports', action: () => goToRoute('/reports') }
    ],
    [goToRoute]
  );

  const legalLinks = useMemo<NavItem[]>(
    () => [
      { label: 'Profile', icon: personCircleOutline, path: '/profile', action: () => goToRoute('/profile') },
      { label: 'Reports', icon: barChartOutline, path: '/reports', action: () => goToRoute('/reports') },
      { label: 'Notifications', icon: notificationsOutline, path: '/notifications', action: () => goToRoute('/notifications') }
    ],
    [goToRoute]
  );

  const brokerLinks = useMemo<NavItem[]>(
    () => [
      { label: 'Profile', icon: personCircleOutline, path: '/profile', action: () => goToRoute('/profile') },
      { label: 'Trading', icon: cartOutline, path: '/trader-panel', action: () => goToRoute('/trader-panel') },
      { label: 'Market', icon: analyticsOutline, path: '/markets', action: () => goToRoute('/markets') }
    ],
    [goToRoute]
  );

  const navItems = sessionUser
    ? isAdmin
      ? adminLinks
      : isLegal
        ? legalLinks
        : isBroker
          ? brokerLinks
          : memberLinks
    : guestLinks;

  const isItemActive = (item: NavItem) => {
    if (item.path === '/markets') {
      return location.pathname.startsWith('/markets');
    }

    if (item.path === '/watchlist') {
      return location.pathname.startsWith('/watchlist');
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
    <>
      <header className="nexus-mobile-header">
        <button
          type="button"
          className="nexus-mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isMobileMenuOpen}
          aria-controls="nexus-primary-navigation"
        >
          <IonIcon icon={menuOutline} />
        </button>
        <button
          type="button"
          className="nexus-mobile-brand"
          onClick={() => history.push('/')}
          aria-label="Go to home"
        >
          <span className="nexus-mobile-brand-mark">
            <IonIcon icon={sparklesOutline} />
          </span>
          <span>Acciones ElBosque</span>
        </button>
      </header>

      <button
        type="button"
        className={`nexus-sidebar-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-label="Close navigation"
        tabIndex={isMobileMenuOpen ? 0 : -1}
      />

      <aside
        id="nexus-primary-navigation"
        className={`nexus-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="nexus-sidebar-top">
          <div className="nexus-sidebar-brand-row">
            <button
              type="button"
              className="nexus-sidebar-logo"
              onClick={() => history.push('/')}
              aria-label="Go to home"
            >
              <span className="nexus-sidebar-logo-mark">
                <IonIcon icon={sparklesOutline} />
              </span>
              <span className="nexus-sidebar-logo-text">Acciones ElBosque</span>
            </button>
            <button
              type="button"
              className="nexus-sidebar-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <IonIcon icon={closeOutline} />
            </button>
          </div>

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
    </>
  );
};

export default NavBar;
