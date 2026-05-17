import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  barChartOutline,
  briefcaseOutline,
  cartOutline,
  chevronDownOutline,
  gridOutline,
  notificationsOutline,
  personCircleOutline,
  settingsOutline,
  starOutline,
  sunnyOutline,
  trendingUpOutline,
} from "ionicons/icons";
import type { UserProfile } from "../api/types";
import {
  formatUserDisplayName,
  getStoredUser,
} from "../auth/storage";
import "./AppLayout.css";

type AppLayoutProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  path: string;
  icon: string;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: gridOutline },
  { label: "Market", path: "/markets", icon: trendingUpOutline },
  { label: "Trading", path: "/trader-panel", icon: cartOutline },
  { label: "Portfolio", path: "/portfolio", icon: briefcaseOutline },
  { label: "Watchlist", path: "/watchlist", icon: starOutline },
  { label: "Reports", path: "/reports", icon: barChartOutline },
];

const fallbackUser: UserProfile = {
  id: 0,
  name: "Daniela",
  surname: "Ocando",
  email: "mariangelocando1@gmail.com",
  username: "daniela",
  userRol: "TRADER",
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const history = useHistory();
  const location = useLocation();
  const user = getStoredUser() ?? fallbackUser;

  const navigateTo = (path: string) => {
    history.push(path);
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-mark">
            <IonIcon icon={trendingUpOutline} />
          </span>
          <span>Nexus</span>
        </div>

        <nav className="app-navigation" aria-label="Application navigation">
          {navigationItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                type="button"
                className={isActive ? "active" : ""}
                onClick={() => navigateTo(item.path)}
              >
                <IonIcon icon={item.icon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          <button type="button" onClick={() => navigateTo("/settings")}>
            <IonIcon icon={settingsOutline} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-spacer" />
          <div className="app-topbar-actions">
            <button type="button" aria-label="Toggle theme">
              <IonIcon icon={sunnyOutline} />
            </button>
            <button
              type="button"
              className="app-notification-button"
              aria-label="Notifications"
            >
              <IonIcon icon={notificationsOutline} />
              <span>2</span>
            </button>
            <button type="button" className="app-user-menu">
              <span className="app-user-avatar">
                <IonIcon icon={personCircleOutline} />
              </span>
              <span className="app-user-copy">
                <strong>{formatUserDisplayName(user)}</strong>
                <small>{user.email}</small>
              </span>
              <IonIcon icon={chevronDownOutline} />
            </button>
          </div>
        </header>

        <div className="app-page">{children}</div>
      </div>
    </div>
  );
};

export default AppLayout;
