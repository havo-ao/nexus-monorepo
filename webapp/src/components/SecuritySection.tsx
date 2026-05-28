// src/components/SecuritySection.tsx
import React from 'react';
import { 
  IonIcon
} from '@ionic/react';
import { 
  shieldCheckmarkOutline, 
  businessOutline, 
  eyeOutline
} from 'ionicons/icons';
import './SecuritySection.css';

const SecuritySection: React.FC = () => {
  return (
    <div className="security-section">
      <div className="security-header">
        <h2 className="security-title">Security & Trust</h2>
        <p className="security-subtitle">
          Your funds and data are protected with enterprise-grade security.
        </p>
      </div>

      <div className="security-blocks">
        {/* Bloque 1: Multi-Factor Authentication */}
        <div className="security-block">
          <div className="block-header">
            <IonIcon icon={shieldCheckmarkOutline} className="block-icon" />
          <h3 className="block-title centered">Multi-Factor Authentication</h3>
          </div>
          <p className="block-description centered">
            Protect your account with an extra layer of security. Even if someone steals your password, 
            they can't access your account without a second verification code from your phone.
          </p>
        </div>

        {/* Bloque 2: Third-Party Fund Custody */}
        <div className="security-block center-block">
          <div className="block-header">
          <h3 className="block-title centered">Third-Party Fund Custody</h3>
            <IonIcon icon={businessOutline} className="block-icon" />
          </div>
          <p className="block-description centered">
            We never hold your money directly. Your funds are custodied with regulated financial partners, 
            separate from our operational accounts.
          </p>
        </div>

        {/* Bloque 3: Transparency & Traceability */}
        <div className="security-block">
          <div className="block-header">
            <IonIcon icon={eyeOutline} className="block-icon" />
          <h3 className="block-title centered">Transparency & Traceability</h3>
          </div>
          <p className="block-description centered">
            Every transaction you make is permanently logged and auditable. You can see exactly where 
            your money goes, what fees you pay, and when trades execute.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
