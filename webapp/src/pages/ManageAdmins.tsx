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
  IonText
} from "@ionic/react";
import NavBar from "../components/NavBar";
import {
  getAdminById,
  getAdminCount,
  getAdminsAudit,
  getTraderAudit,
  getTraderAuditCount,
  registerAdmin,
  updateAdmin,
  type AdminAuditResponse,
  type AdminCreatePayload,
  type AdminUpdatePayload,
  type TraderAuditResponse
} from "../api/admin";
import { getStoredUser, SESSION_CHANGE_EVENT } from "../auth/storage";
import type { Genre } from "../api/types";
import { evaluatePasswordRules, passwordRulesAllMet } from "../utils/passwordRules";
import "./ManageAdmins.css";

type AdminAction = "create" | "update" | "getById" | "listAdmins" | "listTraders" | "counts";

const actionButtons: Array<{ id: AdminAction; label: string }> = [
  { id: "create", label: "Register Admin" },
  { id: "update", label: "Update Admin" },
  { id: "getById", label: "Get Admin By ID" },
  { id: "listAdmins", label: "List Admins" },
  { id: "listTraders", label: "Audit Traders" },
  { id: "counts", label: "Platform Counts" }
];

const emptyAdminCreateForm: AdminCreatePayload = {
  name: "",
  surname: "",
  genre: "MALE",
  email: "",
  username: "",
  password: "",
  department: "",
  position: ""
};

const emptyAdminUpdateForm = {
  name: "",
  surname: "",
  genre: "" as "" | Genre,
  email: "",
  username: "",
  password: "",
  department: "",
  position: ""
};

const ManageAdmins: React.FC = () => {
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const isAdmin = sessionUser?.userRol === "ADMIN";
  const [activeAction, setActiveAction] = useState<AdminAction>("create");
  const [createForm, setCreateForm] = useState<AdminCreatePayload>(emptyAdminCreateForm);
  const [updateForm, setUpdateForm] = useState(emptyAdminUpdateForm);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [traderCount, setTraderCount] = useState<number | null>(null);
  const [admins, setAdmins] = useState<AdminAuditResponse[]>([]);
  const [traders, setTraders] = useState<TraderAuditResponse[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const passwordRuleState = evaluatePasswordRules(createForm.password);
  const updatePasswordRuleState = evaluatePasswordRules(updateForm.password);

  const resetMessages = () => {
    setFeedback("");
    setError("");
  };

  useEffect(() => {
    const handleSessionChange = () => setSessionUser(getStoredUser());
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  useEffect(() => {
    setActiveAction("create");
    setCreateForm(emptyAdminCreateForm);
    setUpdateForm(emptyAdminUpdateForm);
    setSelectedAdminId("");
    setAdmins([]);
    setTraders([]);
    setSelectedAdmin(null);
    setFeedback("");
    setError("");
    setAdminCount(null);
    setTraderCount(null);
    setLoading(false);
  }, [sessionUser?.id]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminCount(null);
      setTraderCount(null);
      return;
    }

    let active = true;

    const loadCounts = async () => {
      setLoading(true);
      try {
        const [adminsTotal, tradersTotal] = await Promise.all([getAdminCount(), getTraderAuditCount()]);
        if (!active) {
          return;
        }
        setAdminCount(adminsTotal);
        setTraderCount(tradersTotal);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load platform counts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadCounts();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const summaryCards = useMemo(
    () => [
      { label: "Admins", value: adminCount ?? "-", detail: "Total administrators currently registered." },
      { label: "Traders", value: traderCount ?? "-", detail: "Total traders currently registered." },
      { label: "Admin audit rows", value: admins.length, detail: "Rows currently loaded from the admin audit list." }
    ],
    [adminCount, traderCount, admins.length]
  );

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (!passwordRulesAllMet(createForm.password)) {
        throw new Error("The admin password does not meet the required security rules.");
      }

      const payload: AdminCreatePayload = {
        name: createForm.name.trim(),
        surname: createForm.surname.trim(),
        genre: createForm.genre,
        email: createForm.email.trim(),
        username: createForm.username.trim(),
        password: createForm.password,
        department: createForm.department.trim(),
        position: createForm.position.trim()
      };

      const response = await registerAdmin(payload);
      setSelectedAdmin(response);
      setCreateForm(emptyAdminCreateForm);
      setFeedback(`Administrator "${String(response.username ?? payload.username)}" was registered successfully.`);
      const refreshedCount = await getAdminCount();
      setAdminCount(refreshedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register the administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAdminById = async () => {
    resetMessages();
    setLoading(true);

    try {
      const numericId = Number(selectedAdminId);
      if (!numericId) {
        throw new Error("Enter a valid administrator ID.");
      }
      const response = await getAdminById(numericId);
      setSelectedAdmin(response);
      setFeedback(`Administrator #${numericId} loaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAdminForUpdate = async () => {
    resetMessages();
    setLoading(true);

    try {
      const numericId = Number(selectedAdminId);
      if (!numericId) {
        throw new Error("Enter a valid administrator ID.");
      }
      const response = await getAdminById(numericId);
      setSelectedAdmin(response);
      setUpdateForm({
        name: String(response.name ?? ""),
        surname: String(response.surname ?? ""),
        genre: (String(response.genre ?? "") as Genre | "") || "",
        email: String(response.email ?? ""),
        username: String(response.username ?? ""),
        password: "",
        department: String(response.department ?? ""),
        position: String(response.position ?? "")
      });
      setFeedback(`Administrator #${numericId} loaded into the update form.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the administrator for update.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const numericId = Number(selectedAdminId);
      if (!numericId) {
        throw new Error("Enter a valid administrator ID.");
      }

      if (updateForm.password && !passwordRulesAllMet(updateForm.password)) {
        throw new Error("If you provide a new password, it must meet the required security rules.");
      }

      const payload: AdminUpdatePayload = {};
      if (updateForm.name.trim()) payload.name = updateForm.name.trim();
      if (updateForm.surname.trim()) payload.surname = updateForm.surname.trim();
      if (updateForm.genre) payload.genre = updateForm.genre;
      if (updateForm.email.trim()) payload.email = updateForm.email.trim();
      if (updateForm.username.trim()) payload.username = updateForm.username.trim();
      if (updateForm.password) payload.password = updateForm.password;
      if (updateForm.department.trim()) payload.department = updateForm.department.trim();
      if (updateForm.position.trim()) payload.position = updateForm.position.trim();

      const response = await updateAdmin(numericId, payload);
      setSelectedAdmin(response);
      setFeedback(`Administrator #${numericId} updated successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handleListAdmins = async () => {
    resetMessages();
    setLoading(true);

    try {
      const response = await getAdminsAudit();
      setAdmins(response);
      setFeedback(response.length > 0 ? "Administrator audit loaded successfully." : "No administrators were returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the administrator audit.");
    } finally {
      setLoading(false);
    }
  };

  const handleListTraders = async () => {
    resetMessages();
    setLoading(true);

    try {
      const response = await getTraderAudit();
      setTraders(response);
      setFeedback(response.length > 0 ? "Trader audit loaded successfully." : "No traders were returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the trader audit.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCounts = async () => {
    resetMessages();
    setLoading(true);

    try {
      const [adminsTotal, tradersTotal] = await Promise.all([getAdminCount(), getTraderAuditCount()]);
      setAdminCount(adminsTotal);
      setTraderCount(tradersTotal);
      setFeedback("Platform counts refreshed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh the platform counts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding manage-admins-content">
        <div className="manage-admins-container">
          <section className="manage-admins-hero">
            <span className="manage-admins-kicker">ADMIN CONTROL</span>
            <IonText>
              <h1>Manage Admins</h1>
              <p>Register administrators, update their records and audit both admins and traders from one control surface.</p>
            </IonText>
          </section>

          {!isAdmin ? (
            <div className="manage-admins-message manage-admins-message--error">
              Only administrators can access this section.
            </div>
          ) : (
            <>
              <section className="manage-admins-actions">
                {actionButtons.map((action) => (
                  <button
                    type="button"
                    key={action.id}
                    className={`manage-admins-action-btn ${activeAction === action.id ? "active" : ""}`}
                    onClick={() => {
                      resetMessages();
                      setActiveAction(action.id);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </section>

              <section className="manage-admins-summary">
                {summaryCards.map((card) => (
                  <article className="manage-admins-card" key={card.label}>
                    <span>{card.label}</span>
                    <strong>{String(card.value)}</strong>
                    <p>{card.detail}</p>
                  </article>
                ))}
              </section>

              {feedback ? <div className="manage-admins-message">{feedback}</div> : null}
              {error ? <div className="manage-admins-message manage-admins-message--error">{error}</div> : null}

              <section className="manage-admins-panel">
                {activeAction === "create" ? (
                  <form className="manage-admins-form" onSubmit={handleCreateAdmin}>
                    <div className="manage-admins-panel-head">
                      <h2>Register admin</h2>
                      <p>Default view. Create a new administrator using the protected `/api/auth/register/admin` endpoint.</p>
                    </div>
                    <AdminFormFields mode="create" form={createForm} setCreateForm={setCreateForm} setUpdateForm={setUpdateForm} />
                    <PasswordRules state={passwordRuleState} />
                    <IonButton expand="block" type="submit" disabled={loading}>
                      {loading ? "Registering..." : "Register administrator"}
                    </IonButton>
                  </form>
                ) : null}

                {activeAction === "update" ? (
                  <form className="manage-admins-form" onSubmit={handleUpdateAdmin}>
                    <div className="manage-admins-panel-head">
                      <h2>Update admin</h2>
                      <p>Load an existing admin first, then submit only the fields you want to patch.</p>
                    </div>
                    <AdminIdField selectedAdminId={selectedAdminId} setSelectedAdminId={setSelectedAdminId} />
                    <IonButton expand="block" fill="outline" type="button" onClick={handleLoadAdminForUpdate} disabled={loading}>
                      {loading ? "Loading..." : "Load admin into form"}
                    </IonButton>
                    <AdminFormFields mode="update" form={updateForm} setCreateForm={setCreateForm} setUpdateForm={setUpdateForm} />
                    {updateForm.password ? <PasswordRules state={updatePasswordRuleState} /> : null}
                    <IonButton expand="block" type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update administrator"}
                    </IonButton>
                  </form>
                ) : null}

                {activeAction === "getById" ? (
                  <div>
                    <div className="manage-admins-panel-head">
                      <h2>Get admin by ID</h2>
                      <p>Retrieve one administrator record directly from `/api/admin/{`{id}`}`.</p>
                    </div>
                    <AdminIdField selectedAdminId={selectedAdminId} setSelectedAdminId={setSelectedAdminId} />
                    <IonButton expand="block" onClick={handleGetAdminById} disabled={loading}>
                      {loading ? "Loading..." : "Load administrator"}
                    </IonButton>
                    <div className="manage-admins-results">{selectedAdmin ? <AdminCard admin={selectedAdmin} /> : null}</div>
                  </div>
                ) : null}

                {activeAction === "listAdmins" ? (
                  <div>
                    <div className="manage-admins-panel-head">
                      <h2>Administrator audit</h2>
                      <p>List all administrators returned by `/api/admin/audit`.</p>
                    </div>
                    <IonButton expand="block" onClick={handleListAdmins} disabled={loading}>
                      {loading ? "Loading..." : "Load administrators"}
                    </IonButton>
                    <div className="manage-admins-results">
                      {admins.map((admin, index) => (
                        <AdminCard key={String(admin.id ?? index)} admin={admin} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeAction === "listTraders" ? (
                  <div>
                    <div className="manage-admins-panel-head">
                      <h2>Trader audit</h2>
                      <p>Review the detailed trader audit feed for administrative inspection.</p>
                    </div>
                    <IonButton expand="block" onClick={handleListTraders} disabled={loading}>
                      {loading ? "Loading..." : "Load trader audit"}
                    </IonButton>
                    <div className="manage-admins-results">
                      {traders.map((trader, index) => (
                        <TraderCard key={String(trader.id ?? index)} trader={trader} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeAction === "counts" ? (
                  <div>
                    <div className="manage-admins-panel-head">
                      <h2>Platform counts</h2>
                      <p>Refresh the number of registered administrators and traders.</p>
                    </div>
                    <IonButton expand="block" onClick={handleRefreshCounts} disabled={loading}>
                      {loading ? "Refreshing..." : "Refresh counts"}
                    </IonButton>
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

type AdminFormFieldsProps = {
  mode: "create" | "update";
  form: AdminCreatePayload | typeof emptyAdminUpdateForm;
  setCreateForm: React.Dispatch<React.SetStateAction<AdminCreatePayload>>;
  setUpdateForm: React.Dispatch<React.SetStateAction<typeof emptyAdminUpdateForm>>;
};

const AdminFormFields: React.FC<AdminFormFieldsProps> = ({ mode, form, setCreateForm, setUpdateForm }) => {
  const updateField = (field: string, value: string) => {
    if (mode === "create") {
      setCreateForm((current) => ({ ...current, [field]: value }));
      return;
    }
    setUpdateForm((current) => ({ ...current, [field]: value }));
  };

  const updateGenre = (value: Genre | "") => {
    if (mode === "create") {
      setCreateForm((current) => ({ ...current, genre: (value as Genre) || "MALE" }));
      return;
    }
    setUpdateForm((current) => ({ ...current, genre: value }));
  };

  return (
    <div className="manage-admins-form-grid">
      <IonItem>
        <IonLabel position="stacked">Name</IonLabel>
        <IonInput value={String(form.name ?? "")} onIonInput={(e) => updateField("name", String(e.detail.value ?? ""))} required={mode === "create"} />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Surname</IonLabel>
        <IonInput value={String(form.surname ?? "")} onIonInput={(e) => updateField("surname", String(e.detail.value ?? ""))} required={mode === "create"} />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Username</IonLabel>
        <IonInput value={String(form.username ?? "")} onIonInput={(e) => updateField("username", String(e.detail.value ?? ""))} required={mode === "create"} />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Email</IonLabel>
        <IonInput type="email" value={String(form.email ?? "")} onIonInput={(e) => updateField("email", String(e.detail.value ?? ""))} required={mode === "create"} />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Gender</IonLabel>
        <IonSelect
          interface="popover"
          value={String(form.genre ?? "") || undefined}
          onIonChange={(e) => updateGenre((e.detail.value as Genre | "") ?? "")}
          placeholder="Select gender"
        >
          <IonSelectOption value="MALE">Male</IonSelectOption>
          <IonSelectOption value="FEMALE">Female</IonSelectOption>
          <IonSelectOption value="NON_BINARY">Non-binary</IonSelectOption>
          <IonSelectOption value="OTHER">Other</IonSelectOption>
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">{mode === "create" ? "Password" : "New password"}</IonLabel>
        <IonInput
          type="password"
          value={String(form.password ?? "")}
          onIonInput={(e) => updateField("password", String(e.detail.value ?? ""))}
          required={mode === "create"}
        />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Department</IonLabel>
        <IonInput
          value={String(form.department ?? "")}
          onIonInput={(e) => updateField("department", String(e.detail.value ?? ""))}
          required={mode === "create"}
        />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Position</IonLabel>
        <IonInput
          value={String(form.position ?? "")}
          onIonInput={(e) => updateField("position", String(e.detail.value ?? ""))}
          required={mode === "create"}
        />
      </IonItem>
    </div>
  );
};

const PasswordRules: React.FC<{ state: ReturnType<typeof evaluatePasswordRules> }> = ({ state }) => (
  <div className="manage-admins-password-rules" aria-live="polite">
    <p className="manage-admins-password-title">Password must have:</p>
    <ul>
      <li className={state.minLength ? "met" : ""}>At least 8 characters</li>
      <li className={state.hasDigit ? "met" : ""}>At least one number</li>
      <li className={state.hasLower ? "met" : ""}>At least one lowercase letter</li>
      <li className={state.hasUpper ? "met" : ""}>At least one uppercase letter</li>
      <li className={state.hasSpecial ? "met" : ""}>At least one special character: @ # $ % ^ & + =</li>
      <li className={state.noSpaces ? "met" : ""}>No spaces</li>
    </ul>
  </div>
);

const AdminIdField: React.FC<{
  selectedAdminId: string;
  setSelectedAdminId: React.Dispatch<React.SetStateAction<string>>;
}> = ({ selectedAdminId, setSelectedAdminId }) => (
  <IonItem className="manage-admins-id-field">
    <IonLabel position="stacked">Administrator ID</IonLabel>
    <IonInput
      type="number"
      value={selectedAdminId}
      onIonInput={(e) => setSelectedAdminId(String(e.detail.value ?? ""))}
      placeholder="10"
      required
    />
  </IonItem>
);

const AdminCard: React.FC<{ admin: AdminAuditResponse }> = ({ admin }) => (
  <article className="manage-admins-list-card">
    <strong>{`${String(admin.name ?? "")} ${String(admin.surname ?? "")}`.trim() || "Unnamed admin"}</strong>
    <span>{String(admin.email ?? "-")}</span>
    <span>@{String(admin.username ?? "-")}</span>
    <p>{String(admin.department ?? "No department")} · {String(admin.position ?? "No position")}</p>
    <small>ID: {String(admin.id ?? "-")} · Role: {String(admin.userRol ?? "ADMIN")}</small>
  </article>
);

const TraderCard: React.FC<{ trader: TraderAuditResponse }> = ({ trader }) => (
  <article className="manage-admins-list-card">
    <strong>{`${String(trader.name ?? "")} ${String(trader.surname ?? "")}`.trim() || "Unnamed trader"}</strong>
    <span>{String(trader.email ?? "-")}</span>
    <span>@{String(trader.username ?? "-")}</span>
    <p>
      {String(trader.experience ?? "No experience")} · Status: {String(trader.status ?? "-")} · Premium:{" "}
      {trader.activePremiumPlan === true ? "Yes" : "No"}
    </p>
    <small>
      Email verified: {trader.emailVerified === true ? "Yes" : "No"} · Phone verified:{" "}
      {trader.phoneVerified === true ? "Yes" : "No"}
    </small>
  </article>
);

export default ManageAdmins;
