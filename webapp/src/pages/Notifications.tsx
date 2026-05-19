import { IonContent, IonPage, IonText } from "@ionic/react";
import NavBar from "../components/NavBar";

const Notifications: React.FC = () => {
  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding">
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <IonText>
            <h1>Notifications</h1>
            <p>Here you will find your notifications and alerts.</p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
