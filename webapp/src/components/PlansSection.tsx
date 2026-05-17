// src/components/PlansSection.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonList, IonItem, IonLabel } from '@ionic/react';
import { checkmarkCircleOutline, checkmarkCircle } from 'ionicons/icons';
import './PlansSection.css';

const PlansSection: React.FC = () => {
  return (
    <div className="plans-section">
      <div className="plans-header">
        <h2 className="plans-title">Plans & Pricing</h2>
        <p className="plans-subtitle">Select the plan that fits your trading needs</p>
      </div>

      <div className="plans-container">
        {/* Plan Free */}
        <IonCard className="plan-card">
          <IonCardHeader>
            <IonCardTitle className="plan-name">FREE</IonCardTitle>
            <div className="plan-price">Free forever</div>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={checkmarkCircle} color="success" slot="start" />
                <IonLabel>Basic market data</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={checkmarkCircle} color="success" slot="start" />
                <IonLabel>Manual portfolio tracking</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={checkmarkCircle} color="success" slot="start" />
                <IonLabel>Basic security</IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Plan Premium */}
        <IonCard className="plan-card premium-card">
          <IonCardHeader>
            <IonCardTitle className="plan-name">PREMIUM</IonCardTitle>
            <div className="plan-price">
              <span className="price-amount">$12.00 USD</span> / month
              <div className="price-note">or $120 USD / year</div>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={checkmarkCircleOutline} color="primary" slot="start" />
                <IonLabel>Advanced market data</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={checkmarkCircleOutline} color="primary" slot="start" />
                <IonLabel>Personalizable watchlists</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={checkmarkCircleOutline} color="primary" slot="start" />
                <IonLabel>Custom price alerts</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={checkmarkCircleOutline} color="primary" slot="start" />
                <IonLabel>Advanced statistics</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={checkmarkCircleOutline} color="primary" slot="start" />
                <IonLabel>Enhanced security (MFA)</IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default PlansSection;
