import './App.css';
import React from "react";
import {BrowserRouter, Switch} from "react-router-dom";
import {connect, Provider} from "react-redux";
import store from "./redux/store";
import DashboardLayoutRoute from "./layouts/DashboardLayout";
import LoginLayoutRoute from "./layouts/loginLayout";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import Home from "./components/Home/Home";
import Game from "./components/Game/Game";
import Auth from "./components/Auth/Auth";
import {setAuthUserData} from "./redux/reducers/authReducer";
import {compose} from "redux";
import {SocketContextProvider} from "./components/Context/SocketContextProvider";
import Profile from "./components/Profile/Profile";

class App extends React.Component {

  checkConnection = () => {
    if (JSON.parse(localStorage.getItem('user'))) {
      let user = JSON.parse(localStorage.getItem('user'));
      if (user.timestamp > Date.now() - 3600000) {
        this.props.setAuthUserData(user.userId, user.userName, user.token)
      } else {
        window.localStorage.removeItem('user');
        this.props.setAuthUserData(null, null, null)
      }
    } else {
      this.props.setAuthUserData(null, null, null)
    }
  }

  componentDidMount() {
    this.checkConnection();
    setInterval(() => {
      console.log(111)
      this.checkConnection()
    }, 1000)

  }

  render() {
    return (
      <div className="App">
        <Auth/>
        <Switch>
          <DashboardLayoutRoute exact path='/profile' component={Profile}/>
          <DashboardLayoutRoute exact path='/' component={Home}/>
          <DashboardLayoutRoute exact path='/game/:gameId' component={Game}/>
          <LoginLayoutRoute path='/register' component={Register}/>
          <LoginLayoutRoute path='/login' component={Login}/>
        </Switch>
      </div>
    );
  }

}

const mapStateToProps = (state) => ({})

let AppContainer = compose(
  connect(mapStateToProps, {setAuthUserData}))
(App);

const mainApp = () => {
  console.log()
  return (
    <BrowserRouter>
        <Provider store={store}>
          <AppContainer/>
        </Provider>
    </BrowserRouter>
  );
}

export default mainApp;


