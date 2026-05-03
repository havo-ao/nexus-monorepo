import { useEffect, useState } from "react";
import { IonContent, IonPage, IonText } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import type { UserProfile } from "../api/types";
import { formatUserDisplayName, getStoredUser } from "../auth/storage";
import "./TraderPanel.css";

const TraderPanel: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);

  // Ionic keeps pages in the navigation stack; the same component instance can be reused.
  // `location.key` changes on each navigation, so we always re-read session from storage.
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      history.replace("/login");
      setUser(null);
      return;
    }
    setUser(stored);
  }, [history, location.key]);

  if (!user) {
    return null;
  }

  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding trader-panel-content">
        <div className="trader-panel-card">
          <IonText>
            <h1>Welcome</h1>
          </IonText>
          <p className="trader-panel-greeting">
            Hello, <strong>{formatUserDisplayName(user)}</strong>.
          </p>
          <dl className="trader-panel-details">
            <div>
              <dt>Username</dt>
              <dd>{user.username}</dd>
            </div>
            <div>
              <dt>First name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Last name</dt>
              <dd>{user.surname}</dd>
            </div>
          </dl>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TraderPanel;
