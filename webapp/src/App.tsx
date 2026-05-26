import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Watchlist from './pages/Watchlist';
import PlanSelection from './pages/PlanSelection';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Portfolio from './pages/Portfolio';
import Success from './pages/Success';
import ManageAdmins from './pages/ManageAdmins';
import ManagePlans from './pages/ManagePlans';
import CancelledPayment from './pages/CancelledPayment';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/signup">
          <SignUp />
        </Route>
        <Route exact path="/plan-selection">
          <PlanSelection />
        </Route>
        <Route exact path="/success">
          <Success />
        </Route>
        <Route exact path="/cancelledPayment">
          <CancelledPayment />
        </Route>
        <Route exact path="/dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/markets">
          <Market />
        </Route>
        <Route exact path="/markets/:marketCode/instruments">
          <Market />
        </Route>
        <Route exact path="/markets/:marketCode/instruments/:symbol">
          <Market />
        </Route>
        <Route exact path="/watchlist">
          <Watchlist />
        </Route>
        <Route exact path="/profile">
          <Profile />
        </Route>
        <Route exact path="/notifications">
          <Notifications />
        </Route>
        <Route exact path="/portfolio">
          <Portfolio />
        </Route>
        <Route exact path="/manage-admins">
          <ManageAdmins />
        </Route>
        <Route exact path="/manage-plans">
          <ManagePlans />
        </Route>
        <Route render={() => <Redirect to="/" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
