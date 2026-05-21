import { IonContent, IonPage, IonText } from "@ionic/react";
import NavBar from "../components/NavBar";

const Portfolio: React.FC = () => {
  return (
    <IonPage>
      <NavBar />
      <IonContent fullscreen className="ion-padding">
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <IonText>
            <h1>Portfolio</h1>
            <p>Your portfolio overview and holdings will be displayed here.</p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Portfolio;
