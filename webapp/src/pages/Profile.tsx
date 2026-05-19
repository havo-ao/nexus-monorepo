import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  useIonAlert
} from "@ionic/react";
import {
  briefcaseOutline,
  businessOutline,
  callOutline,
  createOutline,
  flagOutline,
  globeOutline,
  locationOutline,
  mailOutline,
  personCircleOutline,
  ribbonOutline,
  timeOutline
} from "ionicons/icons";
import NavBar from "../components/NavBar";
import { getTraderMe, updateTrader } from "../api/traders";
import { getStoredUser, SESSION_CHANGE_EVENT } from "../auth/storage";
import type { TraderExperience } from "../api/types";
import { fetchCountryOptions, getCountryLabel, type CountryOption } from "../utils/countries";
import "./Profile.css";

const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Guayaquil",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
  "Asia/Tokyo"
];

const EXPERIENCE_OPTIONS: TraderExperience[] = ["BEGINNER", "INTERMEDIATE", "EXPERT"];

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countryLoadError, setCountryLoadError] = useState("");
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const [editValues, setEditValues] = useState<{
    phone: string;
    phoneCode: string;
    address: string;
    nationalityCode: string;
    timeZone: string;
    experience: TraderExperience | "";
  }>({ phone: "", phoneCode: "", address: "", nationalityCode: "", timeZone: "", experience: "" });
  const [presentAlert] = useIonAlert();

  const initialRole = sessionUser?.userRol;

  const isAdmin = useMemo(() => {
    const roleValue = profile?.userRol ?? initialRole;
    return String(roleValue) === "ADMIN";
  }, [profile, initialRole]);

  useEffect(() => {
    const handleSessionChange = () => setSessionUser(getStoredUser());
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getTraderMe();
        if (active) {
          setProfile(data);
          if (!isAdmin) {
            const rawPhone = String(data.phone ?? "");
            const { phoneCode, phoneNumber } = splitPhoneParts(rawPhone, countries);
            setEditValues({
              phone: phoneNumber,
              phoneCode,
              address: String(data.address ?? ""),
              nationalityCode: String(data.nationalityCode ?? ""),
              timeZone: String(data.timeZone ?? ""),
              experience: (String(data.experience ?? "") as TraderExperience) || ""
            });
          }
        }
      } catch (err) {
        if (active) {
          setProfile(null);
          setError(err instanceof Error ? err.message : "Could not load profile.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (sessionUser) {
      void loadProfile();
    } else {
      setLoading(false);
      setProfile(null);
    }

    return () => {
      active = false;
      abortController.abort();
    };
  }, [sessionUser?.id, isAdmin]);

  const timeZoneOptions = useMemo(() => {
    const intlWithSupportedValues = Intl as unknown as {
      supportedValuesOf?: (key: "timeZone") => string[];
    };
    const generatedTimeZones = intlWithSupportedValues.supportedValuesOf?.("timeZone") ?? [];
    return generatedTimeZones.length > 0 ? generatedTimeZones : FALLBACK_TIME_ZONES;
  }, []);

  const countryNameByCode = useMemo(
    () =>
      countries.reduce<Record<string, string>>((acc, country) => {
        acc[country.code] = country.name;
        return acc;
      }, {}),
    [countries]
  );

  const splitPhoneParts = (phone: string, countriesList: CountryOption[]) => {
    const raw = String(phone ?? "").trim();
    if (!raw) {
      return { phoneCode: "", phoneNumber: "" };
    }

    const normalized = raw.replace(/[^+\d]/g, "");
    if (!normalized.startsWith("+")) {
      return { phoneCode: "", phoneNumber: normalized.replace(/\D/g, "") };
    }

    const digits = normalized.replace(/[^\d]/g, "");
    const sortedCountries = [...countriesList]
      .filter((country) => country.dialCode)
      .sort((a, b) => (b.dialCode?.length ?? 0) - (a.dialCode?.length ?? 0));

    const matched = sortedCountries.find((country) => {
      const cleanCode = String(country.dialCode ?? "").replace(/\D/g, "");
      return cleanCode && digits.startsWith(cleanCode);
    });

    if (matched) {
      const cleanCode = String(matched.dialCode ?? "").replace(/\D/g, "");
      return {
        phoneCode: `+${cleanCode}`,
        phoneNumber: digits.slice(cleanCode.length)
      };
    }

    return { phoneCode: `+${digits.slice(0, 1)}`, phoneNumber: digits.slice(1) };
  };

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true);
        setCountryLoadError("");

        const normalizedCountries = await fetchCountryOptions(abortController.signal);

        if (active) {
          setCountries(normalizedCountries);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCountryLoadError("We could not load countries now. Please try again.");
        }
      } finally {
        if (active) {
          setIsLoadingCountries(false);
        }
      }
    };

    loadCountries();
    return () => {
      active = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!editing && profile && !isAdmin) {
      const rawPhone = String(profile.phone ?? "");
      const { phoneCode, phoneNumber } = splitPhoneParts(rawPhone, countries);
      setEditValues({
        phone: phoneNumber,
        phoneCode,
        address: String(profile.address ?? ""),
        nationalityCode: String(profile.nationalityCode ?? ""),
        timeZone: String(profile.timeZone ?? ""),
        experience: (String(profile.experience ?? "") as TraderExperience) || ""
      });
    }
  }, [editing, profile, isAdmin, countries]);

  const handleFieldChange = (field: keyof typeof editValues, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile && !isAdmin) {
      const rawPhone = String(profile.phone ?? "");
      const { phoneCode, phoneNumber } = splitPhoneParts(rawPhone, countries);
      setEditValues({
        phone: phoneNumber,
        phoneCode,
        address: String(profile.address ?? ""),
        nationalityCode: String(profile.nationalityCode ?? ""),
        timeZone: String(profile.timeZone ?? ""),
        experience: (String(profile.experience ?? "") as TraderExperience) || ""
      });
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setError("");
    try {
      const digitsOnly = editValues.phone.replace(/\D/g, "");
      const normalizedPhoneCode = editValues.phoneCode.trim().replace(/[^+\d]/g, "");
      const phoneValue = normalizedPhoneCode ? `${normalizedPhoneCode}${digitsOnly}` : digitsOnly;
      const nationalityCode = editValues.nationalityCode.trim().toUpperCase();
      const timeZone = editValues.timeZone.trim();
      const phoneDigitsCount = `${normalizedPhoneCode}${digitsOnly}`.replace(/\D/g, "").length;
      const payload = {
        phone: phoneValue,
        address: editValues.address.trim(),
        nationalityCode,
        timeZone,
        experience: editValues.experience
      };

      if (!nationalityCode || nationalityCode.length !== 2) {
        throw new Error("Please select or enter a valid 2-letter nationality code.");
      }

      if (!normalizedPhoneCode || phoneDigitsCount < 9 || phoneDigitsCount > 16) {
        throw new Error("Please select a phone code and enter a valid phone number.");
      }

      if (!timeZone) {
        throw new Error("Please select a timezone.");
      }

      if (!payload.experience) {
        throw new Error("Please select your experience level.");
      }

      const updated = await updateTrader(payload);
      setProfile((prev) => (prev ? { ...prev, ...updated, ...payload } : prev));
      setEditing(false);
      void presentAlert({ header: "Saved", message: "Profile updated successfully.", buttons: ["OK"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update profile.";
      setError(message);
      void presentAlert({ header: "Update failed", message, buttons: ["OK"] });
    }
  };

  const renderStaticField = (label: string, value: unknown, icon?: string) => (
    <div className="profile-field-card">
      <div className="profile-field-heading">
        {icon ? <IonIcon icon={icon} aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <p className="profile-field-value">{String(value ?? "-") || "-"}</p>
    </div>
  );

  const nationalityLabel = getCountryLabel(String(profile?.nationalityCode ?? ""), countries);
  const profileName = `${profile?.name ?? ""} ${profile?.surname ?? ""}`.trim() || "User";
  const roleLabel = String(profile?.userRol ?? initialRole ?? "-");
  const experienceLabel = String(profile?.experience ?? "").trim();
  const departmentLabel = String(profile?.department ?? "").trim();
  const positionLabel = String(profile?.position ?? "").trim();
  const phonePreview = `${editValues.phoneCode || ""} ${editValues.phone}`.trim();
  const initials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding profile-page-content">
        <div className="profile-container">
          <div className="profile-header">
            <span className="profile-header-kicker">{isAdmin ? "ADMIN CENTER" : "ACCOUNT SETTINGS"}</span>
            <IonText>
              <h1>Profile</h1>
              <p>
                {isAdmin
                  ? "Admin profile is read-only."
                  : "Keep your contact details, nationality, timezone and trading experience up to date."}
              </p>
            </IonText>
          </div>

          {loading ? (
            <div className="profile-loading">
              <p>Loading profile...</p>
            </div>
          ) : error ? (
            <div className="profile-error">
              <p>{error}</p>
            </div>
          ) : !profile ? (
            <div className="profile-empty">
              <p>No profile information is available.</p>
            </div>
          ) : (
            <div className="profile-grid">
              <aside className="profile-summary-card">
                <div className="profile-avatar">{initials || "U"}</div>
                <div className="profile-summary-copy">
                  <p className="profile-summary-eyebrow">Identity</p>
                  <h2>{profileName}</h2>
                  <p>{isAdmin ? "Read-only administrative profile." : "Your public and private account details at a glance."}</p>
                </div>

                <div className="profile-summary-list">
                  {renderStaticField("Email", profile.email, mailOutline)}
                  {renderStaticField("Username", profile.username, personCircleOutline)}
                  {renderStaticField("Role", roleLabel, ribbonOutline)}
                  {isAdmin
                    ? renderStaticField("Department", departmentLabel || "-", businessOutline)
                    : renderStaticField("Nationality", nationalityLabel, flagOutline)}
                </div>
              </aside>

              <section className="profile-main-card">
                <div className="profile-section-head">
                  <div>
                    <p className="profile-summary-eyebrow">Profile Details</p>
                    <h2>{isAdmin ? "Administrative information" : "Contact & preferences"}</h2>
                  </div>
                  {!isAdmin ? (
                    <IonButton
                      fill={editing ? "outline" : "solid"}
                      className="profile-edit-toggle"
                      onClick={editing ? handleCancel : handleEdit}
                    >
                      <IonIcon icon={createOutline} slot="start" />
                      {editing ? "Cancel editing" : "Edit profile"}
                    </IonButton>
                  ) : null}
                </div>

                <form className="profile-edit-form" onSubmit={handleSave}>
                  <div className="profile-fields-grid">
                    {isAdmin ? (
                      <>
                        {renderStaticField("Department", departmentLabel || "-", businessOutline)}
                        {renderStaticField("Position", positionLabel || "-", briefcaseOutline)}
                        {renderStaticField("Admin ID", profile.id, globeOutline)}
                        {renderStaticField("Role", roleLabel, ribbonOutline)}
                      </>
                    ) : (
                      <>
                        <div className="profile-field-card profile-field-card--wide">
                          <div className="profile-field-heading">
                            <IonIcon icon={callOutline} aria-hidden="true" />
                            <span>Phone</span>
                          </div>
                          {editing ? (
                            <div className="phone-input-row">
                              <IonItem className="phone-code-item">
                                <IonLabel position="stacked">Phone code</IonLabel>
                                <IonSelect
                                  interface="popover"
                                  value={editValues.phoneCode || undefined}
                                  placeholder="+XX"
                                  onIonChange={(e) => handleFieldChange("phoneCode", String(e.detail.value ?? ""))}
                                  required
                                >
                                  {countries
                                    .filter((country) => country.dialCode)
                                    .map((country) => (
                                      <IonSelectOption key={`${country.code}-${country.dialCode}`} value={country.dialCode}>
                                        {country.name} ({country.dialCode})
                                      </IonSelectOption>
                                    ))}
                                </IonSelect>
                              </IonItem>
                              <IonItem className="phone-number-item">
                                <IonLabel position="stacked">Phone number</IonLabel>
                                <IonInput
                                  type="tel"
                                  value={editValues.phone}
                                  placeholder="123456789"
                                  onIonInput={(e) => handleFieldChange("phone", String(e.detail.value ?? ""))}
                                  required
                                />
                              </IonItem>
                            </div>
                          ) : (
                            <p className="profile-field-value">{String(profile.phone ?? phonePreview ?? "-")}</p>
                          )}
                        </div>

                        <div className="profile-field-card profile-field-card--wide">
                          <div className="profile-field-heading">
                            <IonIcon icon={locationOutline} aria-hidden="true" />
                            <span>Address</span>
                          </div>
                          {editing ? (
                            <IonItem>
                              <IonLabel position="stacked">Address</IonLabel>
                              <IonInput
                                value={editValues.address}
                                placeholder="123 Main St"
                                onIonInput={(e) => handleFieldChange("address", String(e.detail.value ?? ""))}
                                required
                              />
                            </IonItem>
                          ) : (
                            <p className="profile-field-value">{String(profile.address ?? "-")}</p>
                          )}
                        </div>

                        <div className="profile-field-card">
                          <div className="profile-field-heading">
                            <IonIcon icon={flagOutline} aria-hidden="true" />
                            <span>Nationality</span>
                          </div>
                          {editing ? (
                            !countryLoadError ? (
                              <IonItem>
                                <IonLabel position="stacked">Country</IonLabel>
                                <IonSelect
                                  interface="alert"
                                  placeholder={isLoadingCountries ? "Loading countries..." : "Select your country"}
                                  disabled={isLoadingCountries}
                                  value={editValues.nationalityCode || undefined}
                                  onIonChange={(e) => handleFieldChange("nationalityCode", String(e.detail.value ?? ""))}
                                  required
                                >
                                  {countries.map((country) => (
                                    <IonSelectOption key={country.code} value={country.code}>
                                      {country.name}
                                    </IonSelectOption>
                                  ))}
                                </IonSelect>
                              </IonItem>
                            ) : (
                              <IonItem>
                                <IonLabel position="stacked">Nationality code (ISO-2)</IonLabel>
                                <IonInput
                                  type="text"
                                  maxlength={2}
                                  value={editValues.nationalityCode}
                                  placeholder="US"
                                  onIonInput={(e) => handleFieldChange("nationalityCode", String(e.detail.value ?? ""))}
                                  required
                                />
                              </IonItem>
                            )
                          ) : (
                            <p className="profile-field-value">
                              {getCountryLabel(String(profile.nationalityCode ?? ""), countries)}
                            </p>
                          )}
                        </div>

                        <div className="profile-field-card">
                          <div className="profile-field-heading">
                            <IonIcon icon={globeOutline} aria-hidden="true" />
                            <span>Country code</span>
                          </div>
                          <p className="profile-field-value">
                            {String(profile.nationalityCode ?? "").trim()
                              ? `${String(profile.nationalityCode ?? "").toUpperCase()}${
                                  countryNameByCode[String(profile.nationalityCode ?? "").toUpperCase()]
                                    ? ` · ${countryNameByCode[String(profile.nationalityCode ?? "").toUpperCase()]}`
                                    : ""
                                }`
                              : "-"}
                          </p>
                        </div>

                        <div className="profile-field-card">
                          <div className="profile-field-heading">
                            <IonIcon icon={timeOutline} aria-hidden="true" />
                            <span>Time zone</span>
                          </div>
                          {editing ? (
                            <IonItem>
                              <IonLabel position="stacked">Time zone</IonLabel>
                              <IonSelect
                                interface="alert"
                                placeholder="Select your timezone"
                                value={editValues.timeZone || undefined}
                                onIonChange={(e) => handleFieldChange("timeZone", String(e.detail.value ?? ""))}
                                required
                              >
                                {timeZoneOptions.map((timeZone) => (
                                  <IonSelectOption key={timeZone} value={timeZone}>
                                    {timeZone}
                                  </IonSelectOption>
                                ))}
                              </IonSelect>
                            </IonItem>
                          ) : (
                            <p className="profile-field-value">{String(profile.timeZone ?? "-")}</p>
                          )}
                        </div>

                        <div className="profile-field-card">
                          <div className="profile-field-heading">
                            <IonIcon icon={ribbonOutline} aria-hidden="true" />
                            <span>Experience</span>
                          </div>
                          {editing ? (
                            <IonItem>
                              <IonLabel position="stacked">Experience</IonLabel>
                              <IonSelect
                                interface="popover"
                                placeholder="Select experience"
                                value={(editValues.experience as TraderExperience) || undefined}
                                onIonChange={(e) => handleFieldChange("experience", String(e.detail.value ?? ""))}
                                required
                              >
                                {EXPERIENCE_OPTIONS.map((level) => (
                                  <IonSelectOption key={level} value={level}>
                                    {level.charAt(0) + level.slice(1).toLowerCase()}
                                  </IonSelectOption>
                                ))}
                              </IonSelect>
                            </IonItem>
                          ) : (
                            <p className="profile-field-value">{experienceLabel || "-"}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {editing && countryLoadError ? <p className="profile-helper-text">{countryLoadError}</p> : null}

                  {!isAdmin && editing ? (
                    <div className="profile-action-buttons">
                      <IonButton expand="block" type="submit">
                        Save changes
                      </IonButton>
                      <IonButton expand="block" fill="outline" type="button" onClick={handleCancel}>
                        Cancel
                      </IonButton>
                    </div>
                  ) : null}
                </form>
              </section>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
