// src/components/PlansSection.tsx
import React from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList
} from "@ionic/react";
import { checkmarkCircle, checkmarkCircleOutline } from "ionicons/icons";
import "./PlansSection.css";

type PlanType = "free" | "premium";

type PlansSectionProps = {
  selectedPlan?: PlanType;
  onSelectPlan?: (plan: PlanType) => void;
};

const PlansSection: React.FC<PlansSectionProps> = ({ selectedPlan, onSelectPlan }) => {
  const isSelectable = Boolean(onSelectPlan);

  return (
    <div className="plans-section">
      <div className="plans-header">
        <h2 className="plans-title">Plans & Pricing</h2>
        <p className="plans-subtitle">Select the plan that fits your trading needs</p>
      </div>

      <div className="plans-container">
        {/* Plan Free */}
        <IonCard
          className={`plan-card ${isSelectable && selectedPlan === "free" ? "selected-plan-card" : ""}`}
        >
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
            {isSelectable ? (
              <IonButton
                expand="block"
                fill={selectedPlan === "free" ? "solid" : "outline"}
                className="plan-select-btn"
                onClick={() => onSelectPlan?.("free")}
              >
                {selectedPlan === "free" ? "Selected" : "Choose Free"}
              </IonButton>
            ) : null}
          </IonCardContent>
        </IonCard>

        {/* Plan Premium */}
        <IonCard
          className={`plan-card premium-card ${
            isSelectable && selectedPlan === "premium" ? "selected-plan-card" : ""
          }`}
        >
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
            {isSelectable ? (
              <IonButton
                expand="block"
                fill={selectedPlan === "premium" ? "solid" : "outline"}
                className="plan-select-btn"
                onClick={() => onSelectPlan?.("premium")}
              >
                {selectedPlan === "premium" ? "Selected" : "Choose Premium"}
              </IonButton>
            ) : null}
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default PlansSection;
