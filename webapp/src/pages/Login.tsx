import { FormEvent, useEffect, useState } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  useIonAlert
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import { login } from "../api/auth";
import { persistAuthSession } from "../auth/storage";
import "./Login.css";

type LocationState = { registered?: boolean };

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [presentAlert] = useIonAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.registered) {
      setBanner("Account created. You can log in now.");
    }
  }, [location.state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const auth = await login({ email: email.trim(), password });
      persistAuthSession(auth);

      const destination = auth.user.userRol === "ADMIN" ? "/profile" : "/dashboard";
      history.push(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      const looksLikeTempBan =
        message.includes("try again in about") || message.toLowerCase().includes("cannot log in");
      void presentAlert({
        header: looksLikeTempBan ? "Sign-in temporarily blocked" : "Sign-in failed",
        message,
        buttons: ["OK"]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding login-content">
        <div className="login-container">
          <IonText>
            <h1>Log in</h1>
          </IonText>
          <p>Nice to see you again. Enter your email and password to continue.</p>

          {banner ? <p className="form-banner">{banner}</p> : null}

          <form className="login-form" onSubmit={handleSubmit}>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                name="email"
                placeholder="email@example.com"
                value={email}
                onIonInput={(e) => setEmail(String(e.detail.value ?? ""))}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                name="password"
                placeholder="********"
                value={password}
                onIonInput={(e) => setPassword(String(e.detail.value ?? ""))}
                required
              />
            </IonItem>

            <IonButton expand="block" type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Log in"}
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
