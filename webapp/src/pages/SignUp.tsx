import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonPopover,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  useIonAlert
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import NavBar from "../components/NavBar";
import { login, registerTrader } from "../api/auth";
import type { Genre, TraderCreateRequest, TraderExperience } from "../api/types";
import { persistAuthSession } from "../auth/storage";
import { fetchCountryOptions, type CountryOption } from "../utils/countries";
import { evaluatePasswordRules, passwordRulesAllMet } from "../utils/passwordRules";
import "./SignUp.css";

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

const emptyTraderForm = {
  name: "",
  surname: "",
  genre: "" as "" | Genre,
  username: "",
  email: "",
  password: "",
  phoneCode: "",
  phone: "",
  address: "",
  nationalityCode: "",
  timeZone: "",
  experience: "" as "" | TraderExperience
};

const SignUp: React.FC = () => {
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countryLoadError, setCountryLoadError] = useState("");
  const [traderForm, setTraderForm] = useState(emptyTraderForm);
  const [activePicker, setActivePicker] = useState<"phoneCode" | "nationality" | "timezone" | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRuleState = evaluatePasswordRules(traderForm.password);

  const showAlert = (header: string, message: string) => {
    void presentAlert({ header, message, buttons: ["OK"] });
  };

  const timeZoneOptions = useMemo(() => {
    const intlWithSupportedValues = Intl as unknown as {
      supportedValuesOf?: (key: "timeZone") => string[];
    };
    const generatedTimeZones = intlWithSupportedValues.supportedValuesOf?.("timeZone") ?? [];
    return generatedTimeZones.length > 0 ? generatedTimeZones : FALLBACK_TIME_ZONES;
  }, []);

  const normalizedPickerQuery = pickerSearch.trim().toLowerCase();

  const filteredPhoneCodes = useMemo(
    () =>
      countries
        .filter((country) => country.dialCode)
        .filter((country) => {
          if (!normalizedPickerQuery) return true;
          return (
            country.name.toLowerCase().includes(normalizedPickerQuery) ||
            country.code.toLowerCase().includes(normalizedPickerQuery) ||
            country.dialCode?.toLowerCase().includes(normalizedPickerQuery)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [countries, normalizedPickerQuery]
  );

  const filteredNationalities = useMemo(
    () =>
      countries
        .filter((country) => {
          if (!normalizedPickerQuery) return true;
          return (
            country.name.toLowerCase().includes(normalizedPickerQuery) ||
            country.code.toLowerCase().includes(normalizedPickerQuery)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [countries, normalizedPickerQuery]
  );

  const filteredTimeZones = useMemo(
    () =>
      timeZoneOptions.filter((timeZone) => {
        if (!normalizedPickerQuery) return true;
        return timeZone.toLowerCase().includes(normalizedPickerQuery);
      }),
    [timeZoneOptions, normalizedPickerQuery]
  );

  const closePicker = () => {
    setActivePicker(null);
    setPickerSearch("");
  };

  const handlePickerSelect = (field: "phoneCode" | "nationalityCode" | "timeZone", value: string) => {
    setTraderForm((f) => ({ ...f, [field]: value }));
    closePicker();
  };

  useEffect(() => {
    const abortController = new AbortController();

    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true);
        setCountryLoadError("");

        const normalizedCountries = await fetchCountryOptions(abortController.signal);
        setCountries(normalizedCountries);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCountryLoadError("We could not load countries now. Please try again.");
        }
      } finally {
        setIsLoadingCountries(false);
      }
    };

    loadCountries();

    return () => abortController.abort();
  }, []);

  const handleTraderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!traderForm.genre) {
      showAlert("Missing information", "Please select a gender.");
      return;
    }
    if (!traderForm.experience) {
      showAlert("Missing information", "Please select your experience level.");
      return;
    }

    const nationalityRaw = traderForm.nationalityCode.trim().toUpperCase();
    if (!nationalityRaw || nationalityRaw.length !== 2) {
      showAlert("Missing information", "Please select or enter a valid 2-letter nationality code.");
      return;
    }

    if (!traderForm.timeZone.trim()) {
      showAlert("Missing information", "Please select a timezone.");
      return;
    }

    const phoneDigits = traderForm.phone.replace(/\D/g, "");
    const normalizedPhoneCode = traderForm.phoneCode.trim().replace(/[^+\d]/g, "");
    const internationalPhone = `${normalizedPhoneCode}${phoneDigits}`;
    const internationalPhoneDigits = internationalPhone.replace(/\D/g, "");

    if (!normalizedPhoneCode || internationalPhoneDigits.length < 9 || internationalPhoneDigits.length > 16) {
      showAlert(
        "Invalid phone",
        "Please select a phone code and enter a valid phone number in international format."
      );
      return;
    }

    if (!passwordRulesAllMet(traderForm.password)) {
      showAlert(
        "Password requirements",
        "Your password does not meet all requirements. Check the list below and try again."
      );
      return;
    }

    const payload: TraderCreateRequest = {
      name: traderForm.name.trim(),
      surname: traderForm.surname.trim(),
      genre: traderForm.genre,
      username: traderForm.username.trim(),
      email: traderForm.email.trim(),
      password: traderForm.password,
      phone: internationalPhone,
      address: traderForm.address.trim(),
      nationalityCode: nationalityRaw,
      timeZone: traderForm.timeZone.trim(),
      experience: traderForm.experience
    };

    setIsSubmitting(true);

    try {
      await registerTrader(payload);
      const auth = await login({ email: payload.email, password: payload.password });
      persistAuthSession(auth);
      history.push("/profile");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      showAlert("Registration failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding signup-content">
        <div className="signup-container">
          <IonText>
            <h1>Create your account</h1>
          </IonText>
          <p>Complete the trader registration form to start using the platform.</p>

          <form className="signup-form" onSubmit={handleTraderSubmit}>
            <IonItem>
              <IonLabel position="stacked">Name</IonLabel>
              <IonInput
                type="text"
                maxlength={80}
                value={traderForm.name}
                onIonInput={(e) => setTraderForm((f) => ({ ...f, name: String(e.detail.value ?? "") }))}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Last name</IonLabel>
              <IonInput
                type="text"
                maxlength={80}
                value={traderForm.surname}
                onIonInput={(e) => setTraderForm((f) => ({ ...f, surname: String(e.detail.value ?? "") }))}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Gender</IonLabel>
              <IonSelect
                interface="popover"
                placeholder="Select gender"
                value={traderForm.genre || undefined}
                onIonChange={(e) =>
                  setTraderForm((f) => ({ ...f, genre: (e.detail.value as Genre) ?? "" }))
                }
              >
                <IonSelectOption value="MALE">Male</IonSelectOption>
                <IonSelectOption value="FEMALE">Female</IonSelectOption>
                <IonSelectOption value="NON_BINARY">Non-binary</IonSelectOption>
                <IonSelectOption value="OTHER">Other</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Username</IonLabel>
              <IonInput
                type="text"
                minlength={3}
                maxlength={60}
                placeholder="username_123"
                value={traderForm.username}
                onIonInput={(e) => setTraderForm((f) => ({ ...f, username: String(e.detail.value ?? "") }))}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                maxlength={120}
                placeholder="email@example.com"
                value={traderForm.email}
                onIonInput={(e) => setTraderForm((f) => ({ ...f, email: String(e.detail.value ?? "") }))}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                minlength={8}
                maxlength={255}
                placeholder="********"
                value={traderForm.password}
                onIonInput={(e) => setTraderForm((f) => ({ ...f, password: String(e.detail.value ?? "") }))}
                required
              />
            </IonItem>

            <div className="password-rules" aria-live="polite">
              <p className="password-rules-title">Password must have:</p>
              <ul>
                <li className={passwordRuleState.minLength ? "met" : ""}>
                  <span className="password-rules-icon" aria-hidden>
                    {passwordRuleState.minLength ? "✓" : "○"}
                  </span>
                  At least 8 characters
                </li>
                <li className={passwordRuleState.hasDigit ? "met" : ""}>
                  <span className="password-rules-icon" aria-hidden>
                    {passwordRuleState.hasDigit ? "✓" : "○"}
                  </span>
                  At least one number
                </li>
                <li className={passwordRuleState.hasLower ? "met" : ""}>
                  <span className="password-rules-icon" aria-hidden>
                    {passwordRuleState.hasLower ? "✓" : "○"}
                  </span>
                  At least one lowercase letter
                </li>
                <li className={passwordRuleState.hasUpper ? "met" : ""}>
                  <span className="password-rules-icon" aria-hidden>
                    {passwordRuleState.hasUpper ? "✓" : "○"}
                  </span>
                  At least one uppercase letter
                </li>
                <li className={passwordRuleState.hasSpecial ? "met" : ""}>
                  <span className="password-rules-icon" aria-hidden>
                    {passwordRuleState.hasSpecial ? "✓" : "○"}
                  </span>
                  At least one special character: @ # $ % ^ & + =
                </li>
                <li className={passwordRuleState.noSpaces ? "met" : ""}>
                  <span className="password-rules-icon" aria-hidden>
                    {passwordRuleState.noSpaces ? "✓" : "○"}
                  </span>
                  No spaces
                </li>
              </ul>
            </div>

            <div className="signup-phone-row">
              {!countryLoadError ? (
                <IonItem
                  className="signup-phone-code-item"
                  button
                  detail
                  onClick={() => setActivePicker("phoneCode")}
                >
                  <IonLabel position="stacked">Phone code</IonLabel>
                  <IonInput
                    readonly
                    value={traderForm.phoneCode}
                    placeholder="+XX"
                  />
                </IonItem>
              ) : (
                <IonItem className="signup-phone-code-item">
                  <IonLabel position="stacked">Phone code</IonLabel>
                  <IonInput
                    type="text"
                    maxlength={5}
                    placeholder="+1"
                    value={traderForm.phoneCode}
                    onIonInput={(e) => setTraderForm((f) => ({ ...f, phoneCode: String(e.detail.value ?? "") }))}
                    required
                  />
                </IonItem>
              )}

              <IonItem className="signup-phone-number-item">
                <IonLabel position="stacked">Phone</IonLabel>
                <IonInput
                  type="tel"
                  minlength={6}
                  maxlength={16}
                  placeholder="987654321"
                  value={traderForm.phone}
                  onIonInput={(e) => setTraderForm((f) => ({ ...f, phone: String(e.detail.value ?? "") }))}
                  required
                />
              </IonItem>
            </div>

            <IonItem>
              <IonLabel position="stacked">Address</IonLabel>
              <IonInput
                type="text"
                maxlength={100}
                value={traderForm.address}
                onIonInput={(e) => setTraderForm((f) => ({ ...f, address: String(e.detail.value ?? "") }))}
                required
              />
            </IonItem>

            {!countryLoadError ? (
              <IonItem
                button
                detail
                onClick={() => setActivePicker("nationality")}
              >
                <IonLabel position="stacked">Nationality</IonLabel>
                <IonInput
                  readonly
                  value={traderForm.nationalityCode}
                  placeholder={isLoadingCountries ? "Loading countries..." : "Select your country"}
                />
              </IonItem>
            ) : (
              <IonItem>
                <IonLabel position="stacked">Nationality code (ISO-2)</IonLabel>
                <IonInput
                  type="text"
                  minlength={2}
                  maxlength={2}
                  placeholder="US"
                  value={traderForm.nationalityCode}
                  onIonInput={(e) =>
                    setTraderForm((f) => ({ ...f, nationalityCode: String(e.detail.value ?? "") }))
                  }
                  required
                />
              </IonItem>
            )}
            {countryLoadError && <p className="signup-helper-text">{countryLoadError}</p>}

            <IonItem
              button
              detail
              onClick={() => setActivePicker("timezone")}
            >
              <IonLabel position="stacked">Timezone</IonLabel>
              <IonInput
                readonly
                value={traderForm.timeZone}
                placeholder="Select your timezone"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Experience</IonLabel>
              <IonSelect
                interface="popover"
                placeholder="Select experience"
                value={traderForm.experience || undefined}
                onIonChange={(e) =>
                  setTraderForm((f) => ({ ...f, experience: (e.detail.value as TraderExperience) ?? "" }))
                }
              >
                <IonSelectOption value="BEGINNER">Beginner</IonSelectOption>
                <IonSelectOption value="INTERMEDIATE">Intermediate</IonSelectOption>
                <IonSelectOption value="EXPERT">Expert</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonButton expand="block" type="submit" className="signup-submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Trader account"}
            </IonButton>
          </form>

          <IonPopover isOpen={activePicker !== null} onDidDismiss={closePicker}>
            <div className="picker-popover-wrapper">
              <IonSearchbar
                value={pickerSearch}
                onIonInput={(e) => setPickerSearch(String(e.detail.value ?? ""))}
                placeholder="Search..."
              />
              <IonList>
                {activePicker === "phoneCode" &&
                  filteredPhoneCodes.map((country) => (
                    <IonItem
                      key={`${country.code}-${country.dialCode}`}
                      button
                      onClick={() => handlePickerSelect("phoneCode", String(country.dialCode ?? ""))}
                    >
                      {country.name} ({country.dialCode})
                    </IonItem>
                  ))}
                {activePicker === "nationality" &&
                  filteredNationalities.map((country) => (
                    <IonItem
                      key={country.code}
                      button
                      onClick={() => handlePickerSelect("nationalityCode", country.code)}
                    >
                      {country.name} ({country.code})
                    </IonItem>
                  ))}
                {activePicker === "timezone" &&
                  filteredTimeZones.map((timeZone) => (
                    <IonItem key={timeZone} button onClick={() => handlePickerSelect("timeZone", timeZone)}>
                      {timeZone}
                    </IonItem>
                  ))}
                {activePicker !== null && [
                  (activePicker === "phoneCode" && filteredPhoneCodes.length === 0),
                  (activePicker === "nationality" && filteredNationalities.length === 0),
                  (activePicker === "timezone" && filteredTimeZones.length === 0)
                ].some(Boolean) ? (
                  <IonItem lines="none">
                    No results found.
                  </IonItem>
                ) : null}
              </IonList>
            </div>
          </IonPopover>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
