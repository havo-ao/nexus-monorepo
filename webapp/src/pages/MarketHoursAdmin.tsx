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
  configureMarketHours,
  configureMarketRestriction,
  getMarketHoursConfiguration,
  getMarkets,
  type Market,
  type MarketDaySchedule,
  type MarketHoursConfiguration
} from "../api/market";
import { getStoredUser, SESSION_CHANGE_EVENT } from "../auth/storage";
import "./MarketHoursAdmin.css";

const weekDays = [
  { value: 1, label: "Monday", group: "Weekdays" },
  { value: 2, label: "Tuesday", group: "Weekdays" },
  { value: 3, label: "Wednesday", group: "Weekdays" },
  { value: 4, label: "Thursday", group: "Weekdays" },
  { value: 5, label: "Friday", group: "Weekdays" },
  { value: 6, label: "Saturday", group: "Weekend" },
  { value: 0, label: "Sunday", group: "Weekend" }
];

const commonTimezones = [
  "America/New_York",
  "America/Bogota",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC"
];

type ScheduleForm = {
  timezone: string;
  openTime: string;
  closeTime: string;
  operatingDays: number[];
  weeklySchedule: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
};

type RestrictionForm = {
  date: string;
  status: "CLOSED" | "RESTRICTED";
  reason: string;
};

const defaultScheduleForm: ScheduleForm = {
  timezone: "America/New_York",
  openTime: "09:30",
  closeTime: "16:00",
  operatingDays: [1, 2, 3, 4, 5],
  weeklySchedule: weekDays.map((day) => ({
    dayOfWeek: day.value,
    isOpen: day.value >= 1 && day.value <= 5,
    openTime: "09:30",
    closeTime: "16:00"
  }))
};

const defaultRestrictionForm: RestrictionForm = {
  date: "",
  status: "CLOSED",
  reason: ""
};

function toTimeInput(time?: { hour: number; minute: number }): string {
  if (!time) {
    return "";
  }

  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

function fromTimeInput(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error("Enter valid opening and closing times.");
  }

  return { hour, minute };
}

function toScheduleForm(
  configuration: MarketHoursConfiguration,
): ScheduleForm {
  const savedByDay = new Map(
    (configuration.weeklySchedule ?? []).map((daySchedule) => [
      daySchedule.dayOfWeek,
      daySchedule
    ])
  );

  return {
    timezone: configuration.timezone,
    openTime: toTimeInput(configuration.openTime),
    closeTime: toTimeInput(configuration.closeTime),
    operatingDays: configuration.operatingDays,
    weeklySchedule: weekDays.map((day) => {
      const saved = savedByDay.get(day.value);

      return {
        dayOfWeek: day.value,
        isOpen: saved?.isOpen ?? configuration.operatingDays.includes(day.value),
        openTime: toTimeInput(saved?.openTime ?? configuration.openTime),
        closeTime: toTimeInput(saved?.closeTime ?? configuration.closeTime)
      };
    })
  };
}

function toWeeklySchedulePayload(
  weeklySchedule: ScheduleForm["weeklySchedule"],
): MarketDaySchedule[] {
  return weeklySchedule.map((daySchedule) => ({
    dayOfWeek: daySchedule.dayOfWeek,
    isOpen: daySchedule.isOpen,
    openTime: fromTimeInput(daySchedule.openTime),
    closeTime: fromTimeInput(daySchedule.closeTime)
  }));
}

function buildActor(user: ReturnType<typeof getStoredUser>): string {
  return user?.email || user?.username || "admin@nexus.local";
}

const MarketHoursAdmin: React.FC = () => {
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const isAdmin = sessionUser?.userRol === "ADMIN";
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketCode, setSelectedMarketCode] = useState("");
  const [configuration, setConfiguration] =
    useState<MarketHoursConfiguration | null>(null);
  const [scheduleForm, setScheduleForm] =
    useState<ScheduleForm>(defaultScheduleForm);
  const [restrictionForm, setRestrictionForm] =
    useState<RestrictionForm>(defaultRestrictionForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const selectedMarket = useMemo(
    () => markets.find((market) => market.code === selectedMarketCode) ?? null,
    [markets, selectedMarketCode]
  );

  useEffect(() => {
    const handleSessionChange = () => setSessionUser(getStoredUser());
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let active = true;

    const loadMarkets = async () => {
      setLoading(true);
      setError("");

      try {
        const loadedMarkets = await getMarkets();
        if (!active) {
          return;
        }

        setMarkets(loadedMarkets);
        setSelectedMarketCode((current) => current || loadedMarkets[0]?.code || "");
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load available markets."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadMarkets();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedMarketCode) {
      return;
    }

    let active = true;

    const loadConfiguration = async () => {
      setLoading(true);
      setError("");
      setFeedback("");

      try {
        const currentConfiguration =
          await getMarketHoursConfiguration(selectedMarketCode);
        if (!active) {
          return;
        }

        setConfiguration(currentConfiguration);
        setScheduleForm(toScheduleForm(currentConfiguration));
      } catch {
        if (!active) {
          return;
        }

        setConfiguration(null);
        setScheduleForm({
          ...defaultScheduleForm,
          timezone: selectedMarket?.timezone || defaultScheduleForm.timezone
        });
        setFeedback("No saved schedule found yet. Configure this market to create it.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadConfiguration();

    return () => {
      active = false;
    };
  }, [isAdmin, selectedMarket?.timezone, selectedMarketCode]);

  const resetMessages = () => {
    setFeedback("");
    setError("");
  };

  const toggleOperatingDay = (day: number) => {
    setScheduleForm((current) => {
      const weeklySchedule = current.weeklySchedule.map((daySchedule) =>
        daySchedule.dayOfWeek === day
          ? { ...daySchedule, isOpen: !daySchedule.isOpen }
          : daySchedule
      );
      const nextDays = weeklySchedule
        .filter((daySchedule) => daySchedule.isOpen)
        .map((daySchedule) => daySchedule.dayOfWeek);

      return {
        ...current,
        operatingDays: nextDays.sort((left, right) => left - right),
        weeklySchedule
      };
    });
  };

  const updateDayTime = (
    day: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    setScheduleForm((current) => ({
      ...current,
      weeklySchedule: current.weeklySchedule.map((daySchedule) =>
        daySchedule.dayOfWeek === day
          ? { ...daySchedule, [field]: value }
          : daySchedule
      )
    }));
  };

  const handleSaveSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMarketCode) {
      setError("Select a market before saving.");
      return;
    }

    resetMessages();
    setLoading(true);

    try {
      const weeklySchedule = toWeeklySchedulePayload(scheduleForm.weeklySchedule);

      const saved = await configureMarketHours(selectedMarketCode, {
        timezone: scheduleForm.timezone,
        openTime: fromTimeInput(scheduleForm.openTime),
        closeTime: fromTimeInput(scheduleForm.closeTime),
        operatingDays: weeklySchedule
          .filter((daySchedule) => daySchedule.isOpen)
          .map((daySchedule) => daySchedule.dayOfWeek),
        weeklySchedule,
        actor: buildActor(sessionUser)
      });

      setConfiguration(saved);
      setScheduleForm(toScheduleForm(saved));
      setFeedback(`${saved.marketCode} schedule was saved successfully.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save market schedule."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRestriction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMarketCode) {
      setError("Select a market before saving.");
      return;
    }

    resetMessages();
    setLoading(true);

    try {
      const saved = await configureMarketRestriction(selectedMarketCode, {
        ...restrictionForm,
        reason: restrictionForm.reason.trim(),
        actor: buildActor(sessionUser)
      });

      setConfiguration(saved);
      setRestrictionForm(defaultRestrictionForm);
      setFeedback(`${saved.marketCode} restriction was saved successfully.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save market restriction."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding market-hours-admin-content">
        <div className="market-hours-admin-container">
          <section className="market-hours-admin-hero">
            <span className="market-hours-admin-kicker">ADMIN CONTROL</span>
            <IonText>
              <h1>Market Hours</h1>
              <p>Configure operating schedules, closing days and restrictions for each market.</p>
            </IonText>
          </section>

          {!sessionUser ? (
            <div className="market-hours-admin-message market-hours-admin-message--error">
              Sign in as an administrator to access this panel.
            </div>
          ) : !isAdmin ? (
            <div className="market-hours-admin-message market-hours-admin-message--error">
              Only administrators can access market-hours administration.
            </div>
          ) : (
            <>
              <section className="market-hours-admin-toolbar">
                <IonItem className="market-hours-admin-field">
                  <IonLabel position="stacked">Market</IonLabel>
                  <IonSelect
                    value={selectedMarketCode}
                    interface="popover"
                    onIonChange={(event) => {
                      resetMessages();
                      setSelectedMarketCode(String(event.detail.value ?? ""));
                    }}
                  >
                    {markets.map((market) => (
                      <IonSelectOption key={market.code} value={market.code}>
                        {market.code} - {market.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </section>

              {feedback ? <div className="market-hours-admin-message">{feedback}</div> : null}
              {error ? (
                <div className="market-hours-admin-message market-hours-admin-message--error">
                  {error}
                </div>
              ) : null}

              <section className="market-hours-admin-summary">
                <article className="market-hours-admin-card">
                  <span>Selected market</span>
                  <strong>{selectedMarket?.name ?? (selectedMarketCode || "-")}</strong>
                  <p>{selectedMarket ? `${selectedMarket.country} · ${selectedMarket.currency}` : "Choose a market to edit."}</p>
                </article>
                <article className="market-hours-admin-card">
                  <span>Current status</span>
                  <strong>{configuration?.currentStatus.status ?? "-"}</strong>
                  <p>{configuration?.currentStatus.reason ?? "Status will appear after configuration loads."}</p>
                </article>
                <article className="market-hours-admin-card">
                  <span>Restrictions</span>
                  <strong>{configuration?.restrictions.length ?? 0}</strong>
                  <p>Closing or restricted dates currently registered.</p>
                </article>
              </section>

              <section className="market-hours-admin-grid">
                <form className="market-hours-admin-panel" onSubmit={handleSaveSchedule}>
                  <div className="market-hours-admin-panel-head">
                    <h2>Operating schedule</h2>
                    <p>Update timezone and configure the normal schedule for each day of the week.</p>
                  </div>

                  <div className="market-hours-admin-form-grid">
                    <IonItem className="market-hours-admin-field">
                      <IonLabel position="stacked">Timezone</IonLabel>
                      <IonSelect
                        value={scheduleForm.timezone}
                        interface="popover"
                        onIonChange={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            timezone: String(event.detail.value ?? "")
                          }))
                        }
                      >
                        {commonTimezones.map((timezone) => (
                          <IonSelectOption key={timezone} value={timezone}>
                            {timezone}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>

                    <IonItem className="market-hours-admin-field">
                      <IonLabel position="stacked">Default open time</IonLabel>
                      <IonInput
                        type="time"
                        value={scheduleForm.openTime}
                        onIonInput={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            openTime: String(event.detail.value ?? "")
                          }))
                        }
                      />
                    </IonItem>

                    <IonItem className="market-hours-admin-field">
                      <IonLabel position="stacked">Default close time</IonLabel>
                      <IonInput
                        type="time"
                        value={scheduleForm.closeTime}
                        onIonInput={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            closeTime: String(event.detail.value ?? "")
                          }))
                        }
                      />
                    </IonItem>
                  </div>

                  <div className="market-hours-admin-weekly-schedule">
                    {["Weekdays", "Weekend"].map((group) => (
                      <section key={group} className="market-hours-admin-day-group">
                        <h3>{group}</h3>
                        {weekDays
                          .filter((day) => day.group === group)
                          .map((day) => {
                            const daySchedule = scheduleForm.weeklySchedule.find(
                              (item) => item.dayOfWeek === day.value
                            );

                            if (!daySchedule) {
                              return null;
                            }

                            return (
                              <article key={day.value} className="market-hours-admin-day-row">
                                <button
                                  type="button"
                                  className={daySchedule.isOpen ? "active" : ""}
                                  onClick={() => toggleOperatingDay(day.value)}
                                >
                                  {daySchedule.isOpen ? "Open" : "Closed"}
                                </button>
                                <strong>{day.label}</strong>
                                <IonInput
                                  aria-label={`${day.label} open time`}
                                  type="time"
                                  value={daySchedule.openTime}
                                  disabled={!daySchedule.isOpen}
                                  onIonInput={(event) =>
                                    updateDayTime(
                                      day.value,
                                      "openTime",
                                      String(event.detail.value ?? "")
                                    )
                                  }
                                />
                                <IonInput
                                  aria-label={`${day.label} close time`}
                                  type="time"
                                  value={daySchedule.closeTime}
                                  disabled={!daySchedule.isOpen}
                                  onIonInput={(event) =>
                                    updateDayTime(
                                      day.value,
                                      "closeTime",
                                      String(event.detail.value ?? "")
                                    )
                                  }
                                />
                              </article>
                            );
                          })}
                      </section>
                    ))}
                  </div>

                  <IonButton expand="block" type="submit" disabled={loading || !selectedMarketCode}>
                    {loading ? "Saving..." : "Save schedule"}
                  </IonButton>
                </form>

                <form className="market-hours-admin-panel" onSubmit={handleSaveRestriction}>
                  <div className="market-hours-admin-panel-head">
                    <h2>Restriction or closing day</h2>
                    <p>Register a market holiday or restricted operating day.</p>
                  </div>

                  <div className="market-hours-admin-form-grid market-hours-admin-form-grid--single">
                    <IonItem className="market-hours-admin-field">
                      <IonLabel position="stacked">Date</IonLabel>
                      <IonInput
                        type="date"
                        value={restrictionForm.date}
                        onIonInput={(event) =>
                          setRestrictionForm((current) => ({
                            ...current,
                            date: String(event.detail.value ?? "")
                          }))
                        }
                      />
                    </IonItem>

                    <IonItem className="market-hours-admin-field">
                      <IonLabel position="stacked">Status</IonLabel>
                      <IonSelect
                        value={restrictionForm.status}
                        interface="popover"
                        onIonChange={(event) =>
                          setRestrictionForm((current) => ({
                            ...current,
                            status: String(event.detail.value ?? "CLOSED") as RestrictionForm["status"]
                          }))
                        }
                      >
                        <IonSelectOption value="CLOSED">Closed</IonSelectOption>
                        <IonSelectOption value="RESTRICTED">Restricted</IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <IonItem className="market-hours-admin-field market-hours-admin-field--wide">
                      <IonLabel position="stacked">Reason</IonLabel>
                      <IonInput
                        value={restrictionForm.reason}
                        placeholder="Market holiday or operational restriction"
                        onIonInput={(event) =>
                          setRestrictionForm((current) => ({
                            ...current,
                            reason: String(event.detail.value ?? "")
                          }))
                        }
                      />
                    </IonItem>
                  </div>

                  <IonButton expand="block" type="submit" disabled={loading || !selectedMarketCode}>
                    {loading ? "Saving..." : "Save restriction"}
                  </IonButton>

                  <div className="market-hours-admin-restrictions">
                    {(configuration?.restrictions ?? []).map((restriction) => (
                      <article key={`${restriction.date}-${restriction.status}`}>
                        <strong>{restriction.date}</strong>
                        <span>{restriction.status}</span>
                        <p>{restriction.reason}</p>
                      </article>
                    ))}
                    {configuration?.restrictions.length === 0 ? (
                      <p>No restrictions registered for this market.</p>
                    ) : null}
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MarketHoursAdmin;
