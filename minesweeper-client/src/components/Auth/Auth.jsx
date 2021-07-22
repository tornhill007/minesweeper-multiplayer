import React from "react";
import {connect} from "react-redux";
import {Redirect, withRouter} from "react-router-dom";
import {generateUID} from '../../utils/generateUID'
import {SocketContextProvider} from "../Context/SocketContextProvider";
import {io} from "socket.io-client";
import {setIsRender, setSocket} from "../../redux/reducers/socketReducer";
import {
  setGame,
  setGameOver,
  setGamesList, setInformationGame, setListLogs, setListViewers, setSurrendered,
  setUsersInRoom,
  setUsersListReadiness, setWin
} from "../../redux/reducers/gameReducer";

class Auth extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isRender: false
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {

    if (this.props.token && !this.props.isRender) {
      console.log("RENDER")
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
        this.props.setGame({game: data.dataTable});
        this.props.history.push(`/game/${data.gameId}`)
      })

      socket.on("game/action", (data) => {
        console.log("new_ACTION", data)
        this.props.setGame({game: data.dataTable, isMine: data.isMine});
      })

      socket.on("game/list", (data) => {
        console.log("new_list", data)
        this.props.setGamesList(data);
      })

      socket.on("game/users", (data) => {
        console.log("list_users_in_room", data)
        this.props.setUsersInRoom(data);
      })

      socket.on("game/listReadiness", (data) => {
        console.log("list_readiness", data)
        this.props.setUsersListReadiness(data);
      })

      socket.on("game/win", (data) => {
        console.log("game/win", data)
        this.props.setWin(data);
      })

      socket.on("game/blownUp", (data) => {
        console.log("blownUp", data)
        this.props.setGameOver(data);
      })

      socket.on("game/info", (data) => {
        console.log("information111", data)
        this.props.setInformationGame(data.game);
      })

      socket.on("game/surrendered", (data) => {
        console.log("surrendered", data)
        this.props.setSurrendered(data.surrendered);
      })

      socket.on("game/listViewers", (data) => {
        console.log("listViewers", data)
        this.props.setListViewers(data.listViewers);
      })

      socket.on("game/listLogs", (data) => {
        console.log("listViewers", data)
        this.props.setListLogs(data.history);
      })


      this.props.setIsRender(true)
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
  isRender: state.socketPage.isRender
})


export default withRouter(connect(mapStateToProps, {
  setSocket,
  setGame,
  setIsRender,
  setGamesList,
  setUsersInRoom,
  setUsersListReadiness,
  setGameOver,
  setWin,
  setInformationGame,
  setSurrendered,
  setListViewers,
  setListLogs
})(Auth));