import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  useIonAlert
} from "@ionic/react";
import NavBar from "../components/NavBar";
import {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  toggleSubscriptionPlanActive,
  updateSubscriptionPlan,
  type SubscriptionPlanPayload,
  type SubscriptionPlanResponse
} from "../api/adminPlans";
import { getStoredUser, SESSION_CHANGE_EVENT } from "../auth/storage";
import "./ManagePlans.css";

type PlanAction = "create" | "list" | "getById" | "update" | "toggle";

const emptyPlanForm: SubscriptionPlanPayload = {
  name: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  stripePriceIdMonthly: "",
  stripePriceIdYearly: "",
  active: true
};

const actionButtons: Array<{ id: PlanAction; label: string }> = [
  { id: "create", label: "Create Plan" },
  { id: "list", label: "List Plans" },
  { id: "getById", label: "Get By ID" },
  { id: "update", label: "Update Plan" },
  { id: "toggle", label: "Toggle Active" }
];

const ManagePlans: React.FC = () => {
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const isAdmin = sessionUser?.userRol === "ADMIN";
  const [presentAlert] = useIonAlert();
  const [activeAction, setActiveAction] = useState<PlanAction>("create");
  const [planForm, setPlanForm] = useState<SubscriptionPlanPayload>(emptyPlanForm);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanResponse | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [createInfoShown, setCreateInfoShown] = useState(false);

  const currentId = useMemo(() => Number(selectedPlanId), [selectedPlanId]);

  useEffect(() => {
    const handleSessionChange = () => setSessionUser(getStoredUser());
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  useEffect(() => {
    setActiveAction("create");
    setPlanForm(emptyPlanForm);
    setSelectedPlanId("");
    setPlans([]);
    setSelectedPlan(null);
    setFeedback("");
    setError("");
    setIsBusy(false);
    setCreateInfoShown(false);
  }, [sessionUser?.id]);

  useEffect(() => {
    if (!isAdmin || activeAction !== "create" || createInfoShown) {
      return;
    }

    setCreateInfoShown(true);
    void presentAlert({
      header: "Stripe required first",
      message:
        "Before creating a plan here, make sure you have already created the corresponding products/prices in Stripe and paste those Stripe price IDs in the monthly and yearly fields.",
      buttons: ["OK"]
    });
  }, [activeAction, createInfoShown, isAdmin, presentAlert]);

  const resetMessages = () => {
    setFeedback("");
    setError("");
  };

  const readFormPayload = (): SubscriptionPlanPayload => ({
    name: planForm.name.trim(),
    description: planForm.description.trim(),
    priceMonthly: Number(planForm.priceMonthly),
    priceYearly: Number(planForm.priceYearly),
    stripePriceIdMonthly: planForm.stripePriceIdMonthly.trim(),
    stripePriceIdYearly: planForm.stripePriceIdYearly.trim(),
    active: Boolean(planForm.active)
  });

  const validatePlanPayload = (payload: SubscriptionPlanPayload) => {
    if (!payload.name || !payload.description) {
      throw new Error("Name and description are required.");
    }
    if (!payload.stripePriceIdMonthly || !payload.stripePriceIdYearly) {
      throw new Error("Both Stripe price IDs are required.");
    }
    if (Number.isNaN(payload.priceMonthly) || Number.isNaN(payload.priceYearly)) {
      throw new Error("Monthly and yearly prices must be valid numbers.");
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setIsBusy(true);
    try {
      const payload = readFormPayload();
      validatePlanPayload(payload);
      const created = await createSubscriptionPlan(payload);
      setSelectedPlan(created);
      setFeedback(`Plan "${created.name}" created successfully.`);
      setPlanForm(emptyPlanForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the plan.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleList = async () => {
    resetMessages();
    setIsBusy(true);
    try {
      const response = await getAllSubscriptionPlans();
      setPlans(response);
      setSelectedPlan(null);
      setFeedback(response.length > 0 ? "Plans loaded successfully." : "No plans are currently registered.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plans.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleGetById = async () => {
    resetMessages();
    setIsBusy(true);
    try {
      if (!currentId) {
        throw new Error("Enter a valid plan ID.");
      }
      const response = await getSubscriptionPlanById(currentId);
      setSelectedPlan(response);
      setFeedback(`Plan #${currentId} loaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the plan.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLoadForUpdate = async () => {
    resetMessages();
    setIsBusy(true);
    try {
      if (!currentId) {
        throw new Error("Enter a valid plan ID.");
      }
      const response = await getSubscriptionPlanById(currentId);
      setSelectedPlan(response);
      setPlanForm({
        name: response.name,
        description: response.description,
        priceMonthly: Number(response.priceMonthly),
        priceYearly: Number(response.priceYearly),
        stripePriceIdMonthly: response.stripePriceIdMonthly,
        stripePriceIdYearly: response.stripePriceIdYearly,
        active: Boolean(response.active)
      });
      setFeedback(`Plan #${currentId} loaded into the update form.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the plan for update.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setIsBusy(true);
    try {
      if (!currentId) {
        throw new Error("Enter a valid plan ID.");
      }
      const payload = readFormPayload();
      validatePlanPayload(payload);
      const updated = await updateSubscriptionPlan(currentId, payload);
      setSelectedPlan(updated);
      setFeedback(`Plan #${currentId} updated successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the plan.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggle = async () => {
    resetMessages();
    setIsBusy(true);
    try {
      if (!currentId) {
        throw new Error("Enter a valid plan ID.");
      }
      const response = await toggleSubscriptionPlanActive(currentId);
      setSelectedPlan(response);
      setFeedback(`Plan #${currentId} is now ${response.active ? "active" : "inactive"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not toggle the plan status.");
    } finally {
      setIsBusy(false);
    }
  };

  const renderPlanCard = (plan: SubscriptionPlanResponse) => (
    <article className="manage-plans-result-card" key={String(plan.id ?? `${plan.name}-${plan.stripePriceIdMonthly}`)}>
      <div className="manage-plans-result-head">
        <h3>{plan.name}</h3>
        <span className={plan.active ? "plan-status plan-status--active" : "plan-status"}>{plan.active ? "Active" : "Inactive"}</span>
      </div>
      <p>{plan.description}</p>
      <div className="manage-plans-result-grid">
        <span>ID: {String(plan.id ?? "-")}</span>
        <span>Monthly: ${String(plan.priceMonthly)}</span>
        <span>Yearly: ${String(plan.priceYearly)}</span>
        <span>Stripe Monthly: {plan.stripePriceIdMonthly}</span>
        <span>Stripe Yearly: {plan.stripePriceIdYearly}</span>
        <span>Updated: {plan.updatedAt ? new Date(plan.updatedAt).toLocaleString() : "-"}</span>
      </div>
    </article>
  );

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding manage-plans-content">
        <div className="manage-plans-container">
          <section className="manage-plans-hero">
            <span className="manage-plans-kicker">PLAN MANAGEMENT</span>
            <IonText>
              <h1>Manage Plans</h1>
              <p>Create, inspect, update and activate subscription plans from the admin control surface.</p>
            </IonText>
          </section>

          {!isAdmin ? (
            <div className="manage-plans-message manage-plans-message--error">
              Only administrators can access this section.
            </div>
          ) : (
            <>
              <section className="manage-plans-actions">
                {actionButtons.map((action) => (
                  <button
                    type="button"
                    key={action.id}
                    className={`manage-plans-action-btn ${activeAction === action.id ? "active" : ""}`}
                    onClick={() => {
                      resetMessages();
                      setActiveAction(action.id);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </section>

              {feedback ? <div className="manage-plans-message">{feedback}</div> : null}
              {error ? <div className="manage-plans-message manage-plans-message--error">{error}</div> : null}

              <section className="manage-plans-panel">
                {activeAction === "create" ? (
                  <form className="manage-plans-form" onSubmit={handleCreate}>
                    <div className="manage-plans-panel-head">
                      <h2>Create plan</h2>
                      <p>Default admin action. Fill all plan fields, including the Stripe price IDs created beforehand in Stripe.</p>
                    </div>
                    <PlanFormFields planForm={planForm} setPlanForm={setPlanForm} />
                    <IonButton expand="block" type="submit" disabled={isBusy}>
                      {isBusy ? "Creating..." : "Create plan"}
                    </IonButton>
                  </form>
                ) : null}

                {activeAction === "list" ? (
                  <div>
                    <div className="manage-plans-panel-head">
                      <h2>List all plans</h2>
                      <p>Fetch the complete plan catalog registered in the platform.</p>
                    </div>
                    <IonButton expand="block" onClick={handleList} disabled={isBusy}>
                      {isBusy ? "Loading..." : "Load plans"}
                    </IonButton>
                    <div className="manage-plans-results">
                      {plans.map((plan) => renderPlanCard(plan))}
                    </div>
                  </div>
                ) : null}

                {activeAction === "getById" ? (
                  <div>
                    <div className="manage-plans-panel-head">
                      <h2>Get plan by ID</h2>
                      <p>Inspect a single subscription plan using its numeric identifier.</p>
                    </div>
                    <PlanIdField selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId} />
                    <IonButton expand="block" onClick={handleGetById} disabled={isBusy}>
                      {isBusy ? "Loading..." : "Load plan"}
                    </IonButton>
                    <div className="manage-plans-results">{selectedPlan ? renderPlanCard(selectedPlan) : null}</div>
                  </div>
                ) : null}

                {activeAction === "update" ? (
                  <form className="manage-plans-form" onSubmit={handleUpdate}>
                    <div className="manage-plans-panel-head">
                      <h2>Update plan</h2>
                      <p>Load an existing plan into the form, edit it and then save the changes.</p>
                    </div>
                    <PlanIdField selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId} />
                    <IonButton expand="block" fill="outline" type="button" onClick={handleLoadForUpdate} disabled={isBusy}>
                      {isBusy ? "Loading..." : "Load plan into form"}
                    </IonButton>
                    <PlanFormFields planForm={planForm} setPlanForm={setPlanForm} />
                    <IonButton expand="block" type="submit" disabled={isBusy}>
                      {isBusy ? "Saving..." : "Update plan"}
                    </IonButton>
                  </form>
                ) : null}

                {activeAction === "toggle" ? (
                  <div>
                    <div className="manage-plans-panel-head">
                      <h2>Toggle active state</h2>
                      <p>Enable or disable a plan without editing the rest of its information.</p>
                    </div>
                    <PlanIdField selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId} />
                    <IonButton expand="block" onClick={handleToggle} disabled={isBusy}>
                      {isBusy ? "Updating..." : "Toggle active state"}
                    </IonButton>
                    <div className="manage-plans-results">{selectedPlan ? renderPlanCard(selectedPlan) : null}</div>
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

type PlanFormFieldsProps = {
  planForm: SubscriptionPlanPayload;
  setPlanForm: React.Dispatch<React.SetStateAction<SubscriptionPlanPayload>>;
};

const PlanFormFields: React.FC<PlanFormFieldsProps> = ({ planForm, setPlanForm }) => (
  <div className="manage-plans-form-grid">
    <IonItem>
      <IonLabel position="stacked">Name</IonLabel>
      <IonInput
        value={planForm.name}
        onIonInput={(e) => setPlanForm((current) => ({ ...current, name: String(e.detail.value ?? "") }))}
        required
      />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Description</IonLabel>
      <IonInput
        value={planForm.description}
        onIonInput={(e) => setPlanForm((current) => ({ ...current, description: String(e.detail.value ?? "") }))}
        required
      />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Monthly price</IonLabel>
      <IonInput
        type="number"
        value={String(planForm.priceMonthly)}
        onIonInput={(e) => setPlanForm((current) => ({ ...current, priceMonthly: Number(e.detail.value ?? 0) }))}
        required
      />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Yearly price</IonLabel>
      <IonInput
        type="number"
        value={String(planForm.priceYearly)}
        onIonInput={(e) => setPlanForm((current) => ({ ...current, priceYearly: Number(e.detail.value ?? 0) }))}
        required
      />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Stripe price ID monthly</IonLabel>
      <IonInput
        value={planForm.stripePriceIdMonthly}
        onIonInput={(e) =>
          setPlanForm((current) => ({ ...current, stripePriceIdMonthly: String(e.detail.value ?? "") }))
        }
        required
      />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Stripe price ID yearly</IonLabel>
      <IonInput
        value={planForm.stripePriceIdYearly}
        onIonInput={(e) =>
          setPlanForm((current) => ({ ...current, stripePriceIdYearly: String(e.detail.value ?? "") }))
        }
        required
      />
    </IonItem>
    <IonItem className="manage-plans-form-grid-wide">
      <IonLabel position="stacked">Active</IonLabel>
      <IonSelect
        interface="popover"
        value={String(planForm.active)}
        onIonChange={(e) => setPlanForm((current) => ({ ...current, active: String(e.detail.value) === "true" }))}
      >
        <IonSelectOption value="true">Active</IonSelectOption>
        <IonSelectOption value="false">Inactive</IonSelectOption>
      </IonSelect>
    </IonItem>
  </div>
);

type PlanIdFieldProps = {
  selectedPlanId: string;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string>>;
};

const PlanIdField: React.FC<PlanIdFieldProps> = ({ selectedPlanId, setSelectedPlanId }) => (
  <IonItem className="manage-plans-id-field">
    <IonLabel position="stacked">Plan ID</IonLabel>
    <IonInput
      type="number"
      value={selectedPlanId}
      onIonInput={(e) => setSelectedPlanId(String(e.detail.value ?? ""))}
      placeholder="1"
      required
    />
  </IonItem>
);

export default ManagePlans;
