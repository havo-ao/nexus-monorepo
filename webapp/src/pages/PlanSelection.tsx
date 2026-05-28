import { useEffect, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonRadio,
  IonRadioGroup,
  useIonAlert
} from "@ionic/react";
import { calendarClearOutline, checkmarkCircleOutline, diamondOutline, repeatOutline, sparklesOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import NavBar from "../components/NavBar";
import PlansSection from "../components/PlansSection";
import { createStripeCheckoutSession, getSubscriptionStatus, type PremiumPlanCycle } from "../api/subscriptions";
import { getTraderMe } from "../api/traders";
import { getStoredUser, SESSION_CHANGE_EVENT } from "../auth/storage";
import "./PlanSelection.css";

type PlanType = "free" | "premium";
type SubscriptionField = {
  label: string;
  value: string;
  accent?: "primary" | "success";
};

const PlanSelection: React.FC = () => {
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("free");
  const [premiumCycle, setPremiumCycle] = useState<PremiumPlanCycle>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<Record<string, unknown> | null>(null);
  const [statusError, setStatusError] = useState("");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    const handleSessionChange = () => setSessionUser(getStoredUser());
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  useEffect(() => {
    setSelectedPlan("free");
    setPremiumCycle("monthly");
    setIsPremium(null);
    setSubscriptionDetails(null);
    setStatusError("");
    setIsLoadingStatus(Boolean(sessionUser));
  }, [sessionUser?.id]);

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      if (selectedPlan === "free") {
        history.push("/dashboard");
        return;
      }

      const checkoutUrl = await createStripeCheckoutSession(premiumCycle);
      window.location.assign(checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not continue with your plan selection.";
      void presentAlert({
        header: "Plan selection error",
        message,
        buttons: ["OK"]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActivePremiumPlan = (profile: Record<string, unknown>): boolean => {
    if (profile.activePremiumPlan === true) {
      return true;
    }

    const subscriptions = profile.subscriptions;
    if (!Array.isArray(subscriptions)) {
      return false;
    }

    return subscriptions.some((subscription) => {
      if (subscription && typeof subscription === "object") {
        const maybeStatus = (subscription as Record<string, unknown>).status;
        return maybeStatus === "ACTIVE";
      }
      return false;
    });
  };

  useEffect(() => {
    let active = true;

    const loadSubscriptionStatus = async () => {
      setIsPremium(null);
      setSubscriptionDetails(null);
      setIsLoadingStatus(true);
      setStatusError("");

      try {
        const profile = await getTraderMe();
        const premium = hasActivePremiumPlan(profile);
        if (!active) return;
        setIsPremium(premium);

        if (premium) {
          const status = await getSubscriptionStatus();
          if (active) {
            setSubscriptionDetails(status);
          }
        }
      } catch (error) {
        if (active) {
          setStatusError(error instanceof Error ? error.message : "Could not load subscription status.");
        }
      } finally {
        if (active) {
          setIsLoadingStatus(false);
        }
      }
    };

    if (sessionUser) {
      void loadSubscriptionStatus();
    } else {
      setIsLoadingStatus(false);
      setIsPremium(false);
      setSubscriptionDetails(null);
      setStatusError("");
    }

    return () => {
      active = false;
    };
  }, [sessionUser?.id]);

  const renderSubscriptionDetails = () => {
    if (isLoadingStatus) {
      return <div className="subscription-feedback-card">Loading your current subscription...</div>;
    }

    if (statusError) {
      return <div className="subscription-feedback-card subscription-feedback-card--error">{statusError}</div>;
    }

    if (!subscriptionDetails) {
      return <div className="subscription-feedback-card">No subscription details are available.</div>;
    }

    const fields: SubscriptionField[] = [
      {
        label: "Plan",
        value: String(subscriptionDetails.planName ?? "Premium"),
        accent: "success"
      },
      {
        label: "Status",
        value: String(subscriptionDetails.status ?? "Active"),
        accent: "primary"
      },
      {
        label: "Start date",
        value: String(subscriptionDetails.startDate ?? "-")
      },
      {
        label: "Renewal / end date",
        value: String(subscriptionDetails.endDate ?? "-")
      },
      {
        label: "Auto renew",
        value: subscriptionDetails.autoRenew === true ? "Enabled" : "Disabled"
      }
    ];

    return (
      <div className="subscription-card subscription-card--premium">
        <div className="subscription-card-header">
          <div>
            <span className="subscription-kicker">PREMIUM ACCESS</span>
            <h2>Premium Subscription</h2>
            <p>Your plan is active and the account is ready to use the full trading toolkit.</p>
          </div>
          <div className="subscription-badge">
            <IonIcon icon={diamondOutline} aria-hidden="true" />
            <span>Premium</span>
          </div>
        </div>

        <div className="subscription-highlight-grid">
          <div className="subscription-highlight-card">
            <IonIcon icon={sparklesOutline} aria-hidden="true" />
            <strong>Advanced market tools</strong>
            <p>Premium analytics, alerts and watchlist customization remain unlocked.</p>
          </div>
          <div className="subscription-highlight-card">
            <IonIcon icon={calendarClearOutline} aria-hidden="true" />
            <strong>Billing visibility</strong>
            <p>Key dates and renewal settings are grouped below instead of showing raw payload fields.</p>
          </div>
        </div>

        <div className="subscription-details-grid">
          {fields.map((field) => (
            <div className={`subscription-detail-row ${field.accent ? `subscription-detail-row--${field.accent}` : ""}`} key={field.label}>
              <span>{field.label}</span>
              <strong>{field.value}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding plan-selection-content">
        <div className="plan-selection-container">
          <section className="subscription-hero">
            <span className="subscription-kicker">{isPremium ? "MEMBERSHIP OVERVIEW" : "CHOOSE YOUR PLAN"}</span>
            <h1>{isPremium ? "Your subscription" : "Plans built for your trading stage"}</h1>
            <p>
              {isPremium
                ? "A cleaner premium summary with the important billing details front and center."
                : "Compare your options, pick a billing cycle and continue with Stripe when you are ready."}
            </p>
          </section>

          {isPremium ? (
            renderSubscriptionDetails()
          ) : (
            <>
              <PlansSection selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />

              {selectedPlan === "premium" ? (
                <div className="premium-cycle-container">
                  <div className="premium-cycle-header">
                    <div>
                      <h3>Premium billing cycle</h3>
                      <p>Select how you want your premium access to renew.</p>
                    </div>
                    <div className="premium-cycle-badge">
                      <IonIcon icon={checkmarkCircleOutline} aria-hidden="true" />
                      <span>Secure Stripe checkout</span>
                    </div>
                  </div>
                  <IonRadioGroup
                    value={premiumCycle}
                    onIonChange={(e) => setPremiumCycle((e.detail.value as PremiumPlanCycle) ?? "monthly")}
                  >
                    <IonItem className="premium-cycle-option">
                      <IonLabel>
                        <strong>Monthly</strong>
                        <span>$12 USD billed every month</span>
                      </IonLabel>
                      <IonRadio slot="start" value="monthly" />
                    </IonItem>
                    <IonItem className="premium-cycle-option">
                      <IonLabel>
                        <strong>Yearly</strong>
                        <span>$120 USD billed once per year</span>
                      </IonLabel>
                      <IonRadio slot="start" value="yearly" />
                    </IonItem>
                  </IonRadioGroup>
                  <div className="premium-cycle-note">
                    <IonIcon icon={repeatOutline} aria-hidden="true" />
                    <p>You can verify your current billing state later from this same subscription page.</p>
                  </div>
                </div>
              ) : null}

              <IonButton
                expand="block"
                className="plan-continue-btn"
                onClick={handleContinue}
                disabled={isSubmitting || isLoadingStatus}
              >
                {isSubmitting ? "Continuing..." : "Continue"}
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PlanSelection;
