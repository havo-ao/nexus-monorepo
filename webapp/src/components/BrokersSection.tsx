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
  IonText,
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
      {/* Título principal */}
      <div className="brokers-header">
        <h2 className="section-title">Brokers Assistance</h2>
        <p className="section-subtitle">
          Professional broker guidance. No one-size-fits-all. Just your risk,
          your strategy.
        </p>
      </div>

      {/* Modos de operación */}
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
              El broker envía notificaciones con recomendaciones de
              compra/venta. Tú apruebas o rechazas cada operación.
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
              <IonLabel>Tú mantienes el control final</IonLabel>
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
              Acceso total para el broker a ventas y portafolio. Opera según las
              estrategias definidas en el contrato.
            </p>
            <div className="mode-features">
              <div className="feature-item">
                <IonIcon icon={trendingUpOutline} color="primary" />
                <span>Operación automática</span>
              </div>
              <div className="feature-item">
                <IonIcon icon={eyeOutline} color="primary" />
                <span>Seguimiento en tiempo real</span>
              </div>
              <div className="feature-item">
                <IonIcon icon={documentTextOutline} color="primary" />
                <span>Estrategias pre-aprobadas</span>
              </div>
            </div>
            <IonChip className="mode-chip" color="primary">
              <IonIcon icon={shieldCheckmarkOutline} />
              <IonLabel>Tú supervisas todas las operaciones</IonLabel>
            </IonChip>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Sección "Why you need a broker" */}
      <div className="why-broker-section">
        <h3 className="why-title">Why you should to need a broker?</h3>
        <div className="why-grid">
          <div className="why-card">
            <IonIcon icon={timeOutline} className="why-icon" />
            <p className="why-card-title">
              No time to watch the markets all day?
            </p>
            <p className="why-card-text">
              Delega el análisis y monitoreo constante a un profesional.
            </p>
          </div>
          <div className="why-card">
            <IonIcon icon={peopleOutline} className="why-icon" />
            <p className="why-card-title">Professional broker guidance</p>
            <p className="why-card-text">
              Asesoría personalizada, no soluciones genéricas.
            </p>
          </div>
          <div className="why-card">
            <IonIcon icon={flagOutline} className="why-icon" />
            <p className="why-card-title">Your risk, your strategy</p>
            <p className="why-card-text">
              Operamos bajo tus reglas y tolerancia al riesgo.
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
