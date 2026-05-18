// src/components/BrokersSection.tsx
import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonButton,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  notificationsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  flashOutline,
  eyeOutline,
  documentTextOutline,
  shieldCheckmarkOutline,
  trendingUpOutline,
  flagOutline,
  peopleOutline,
  timeOutline,
} from "ionicons/icons";
import "./BrokersSection.css";

const BrokersSection: React.FC = () => {
  return (
    <div className="brokers-section">
      {/* Main title */}
      <div className="brokers-header">
        <h2 className="section-title">Brokers Assistance</h2>
        <p className="section-subtitle">
          Professional broker guidance. No one-size-fits-all. Just your risk,
          your strategy.
        </p>
      </div>

      {/* Operation modes */}
      <div className="modes-container">
        {/* Advisory Mode */}
        <IonCard className="mode-card">
          <div className="mode-icon-wrapper">
            <IonIcon
              icon={notificationsOutline}
              className="mode-icon advisory-icon"
            />
          </div>
          <IonCardHeader>
            <IonCardTitle className="mode-title">Advisory Mode</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="mode-description">
              The broker sends notifications with buy and sell recommendations.
              You approve or reject each operation.
            </p>
            <div className="mode-actions">
              <IonButton size="small" fill="outline" color="success">
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Approve
              </IonButton>
              <IonButton size="small" fill="outline" color="danger">
                <IonIcon icon={closeCircleOutline} slot="start" />
                Cancel
              </IonButton>
            </div>
            <IonChip className="mode-chip" color="light">
              <IonIcon icon={eyeOutline} />
              <IonLabel>You keep final control</IonLabel>
            </IonChip>
          </IonCardContent>
        </IonCard>

        {/* Operational Mode */}
        <IonCard className="mode-card">
          <div className="mode-icon-wrapper">
            <IonIcon
              icon={flashOutline}
              className="mode-icon operational-icon"
            />
          </div>
          <IonCardHeader>
            <IonCardTitle className="mode-title">Operational Mode</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="mode-description">
              Full broker access to sales and portfolio actions. Operations
              follow the strategies defined in the contract.
            </p>
            <div className="mode-features">
              <div className="feature-item">
                <IonIcon icon={trendingUpOutline} color="primary" />
                <span>Automated operation</span>
              </div>
              <div className="feature-item">
                <IonIcon icon={eyeOutline} color="primary" />
                <span>Real-time monitoring</span>
              </div>
              <div className="feature-item">
                <IonIcon icon={documentTextOutline} color="primary" />
                <span>Pre-approved strategies</span>
              </div>
            </div>
            <IonChip className="mode-chip" color="primary">
              <IonIcon icon={shieldCheckmarkOutline} />
              <IonLabel>You supervise every operation</IonLabel>
            </IonChip>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Why you need a broker */}
      <div className="why-broker-section">
        <h3 className="why-title">Why do you need a broker?</h3>
        <div className="why-grid">
          <div className="why-card">
            <IonIcon icon={timeOutline} className="why-icon" />
            <p className="why-card-title">
              No time to watch the markets all day?
            </p>
            <p className="why-card-text">
              Delegate analysis and continuous monitoring to a professional.
            </p>
          </div>
          <div className="why-card">
            <IonIcon icon={peopleOutline} className="why-icon" />
            <p className="why-card-title">Professional broker guidance</p>
            <p className="why-card-text">
              Personalized guidance, not generic solutions.
            </p>
          </div>
          <div className="why-card">
            <IonIcon icon={flagOutline} className="why-icon" />
            <p className="why-card-title">Your risk, your strategy</p>
            <p className="why-card-text">
              We operate under your rules and risk tolerance.
            </p>
          </div>
        </div>
        <div className="why-callout">
          Stop studying. Start improving. Let your broker do the heavy lifting.
        </div>
      </div>
    </div>
  );
};
export default BrokersSection;
