// src/components/NavBar.tsx
import React, { useState } from 'react';
import {
  IonButton,
  IonHeader,
  IonIcon,
  IonToolbar,
  useIonViewDidEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { logInOutline, logOutOutline, personAddOutline } from 'ionicons/icons';
import type { UserProfile } from '../api/types';
import { clearAuthSession, formatUserDisplayName, getStoredUser } from '../auth/storage';
import './NavBar.css';

const NavBar: React.FC = () => {
  const history = useHistory();
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(() => getStoredUser());

  useIonViewDidEnter(() => {
    setSessionUser(getStoredUser());
  });

  const handleLogout = () => {
    clearAuthSession();
    setSessionUser(null);
    history.push('/');
  };

  const goToHomeSection = (sectionId: string) => {
    history.push({ pathname: '/', hash: `#${sectionId}` });
  };

  return (
    <IonHeader>
      <IonToolbar className="landing-toolbar">
        <div slot="start" className="toolbar-brand">
          <button
            type="button"
            className="logo clickable-logo"
            onClick={() => history.push('/')}
            aria-label="Go to home"
          >
            Nexus
          </button>
        </div>

        <div className="nav-links">
          <button type="button" onClick={() => goToHomeSection('about-section')}>About</button>
          <button type="button" onClick={() => goToHomeSection('plans-section')}>Plans</button>
          <button type="button" onClick={() => goToHomeSection('brokers-section')}>Brokers</button>
          <button type="button" onClick={() => goToHomeSection('markets-section')}>Markets</button>
          <button type="button" onClick={() => goToHomeSection('security-section')}>Security</button>
        </div>

        <div slot="end" className="action-buttons">
          {sessionUser ? (
            <>
              <div className="nav-user-summary" aria-live="polite">
                <span className="nav-user-name">{formatUserDisplayName(sessionUser)}</span>
                <span className="nav-user-meta">@{sessionUser.username}</span>
              </div>
              <IonButton fill="clear" className="login-btn" onClick={handleLogout}>
                <IonIcon slot="start" icon={logOutOutline} />
                LOG OUT
              </IonButton>
            </>
          ) : (
            <>
              <IonButton fill="clear" className="login-btn" routerLink="/login" routerDirection="forward">
                <IonIcon slot="start" icon={logInOutline} />
                LOG IN
              </IonButton>
              <IonButton fill="solid" className="signup-btn" routerLink="/signup" routerDirection="forward">
                <IonIcon slot="start" icon={personAddOutline} />
                SIGN UP
              </IonButton>
            </>
          )}
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default NavBar;