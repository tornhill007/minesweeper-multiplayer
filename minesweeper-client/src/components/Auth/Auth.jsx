import React from "react";
import {connect} from "react-redux";
import {Redirect, withRouter} from "react-router-dom";
import {generateUID} from '../../utils/generateUID'
import {SocketContextProvider} from "../Context/SocketContextProvider";
import {io} from "socket.io-client";
import {setSocket} from "../../redux/reducers/socketReducer";
import {setGame} from "../../redux/reducers/gameReducer";


class Auth extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.token) {

      let socket;
      socket = io('http://192.168.1.229:8080/', {
        query: {
          tabId: JSON.parse(sessionStorage.getItem('tabId')),
          loggeduser: this.props.token
        }
      });
      socket.on("connect", () => {
        console.log("sockett_ID", socket.id)
        this.props.setSocket(socket);
      });
      socket.on("game/new", (data) => {
        console.log("NEW_GAME", data)
        this.props.setGame(data.dataTable);
        this.props.history.push(`/game/${data.gameId}`)
      })
    }
  }

  render() {

    if (!JSON.parse(sessionStorage.getItem('tabId'))) {
      let tabId = generateUID();
      window.sessionStorage.setItem("tabId", JSON.stringify(tabId))
    }


    if (!this.props.token) return <Redirect to={'/login'}/>

    if (this.props.token) {
      return <Redirect to={'/'}/>
    }
  }
}

const mapStateToProps = (state) => ({
  token: state.auth.token,
})


export default withRouter(connect(mapStateToProps, {
  setSocket,
  setGame
})(Auth));