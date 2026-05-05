// src/pages/Home.tsx
import { useEffect } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import AboutSection from "../components/AboutSection";
import "./Home.css";
import PlansSection from "../components/PlansSection";
import BrokersSection from "../components/BrokersSection";
import MarketsSection from "../components/MarketsSection";
import SecuritySection from "../components/SecuritySection";

const Home: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const sectionId = location.hash.replace("#", "");
    const sectionElement = document.getElementById(sectionId);

    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <IonPage>
      <NavBar />
      <IonContent className="ion-padding">
        <div id="about-section">
          <AboutSection />
        </div>
        <div id="plans-section">
          <PlansSection />
        </div>
        <div id="brokers-section">
          <BrokersSection />
        </div>
        <div id="markets-section">
          <MarketsSection />
        </div>
        <div id="security-section">
          <SecuritySection />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
