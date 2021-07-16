import React from "react";
import {connect} from "react-redux";
import {withRouter} from 'react-router-dom';
import classes from './Game.module.css';
import {createMines} from "../../utils/createMines";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBomb} from "@fortawesome/free-solid-svg-icons";
import {checkCell, findMine} from "../../redux/reducers/gameReducer";


class Game extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isGaming: true,
      isRender: false,
      isReady: false
    }
  }

  onReady = () => {
    this.props.socket.emit("game/readiness", {isReady: true, gameId: this.props.match.params.gameId}, (data) => {
      console.log(['data'], data)
    })
    this.setState({
      isReady: true
    })
  }

  onNotReady = () => {
    this.props.socket.emit("game/readiness", {isReady: false, gameId: this.props.match.params.gameId}, (data) => {
      console.log(['data'], data)
    })
    this.setState({
      isReady: false
    })
  }


  render() {
    console.log("tableTwoDimensionalOPENED", this.props.gameInfo);
    console.log("tableTwoDimensionalOPENED1", this.props);
    console.log("tableTwoDimensionalOPENED", this.props.tableTwoDimensional);

    let isGameOver = this.props.isGameOver;

    const sendAction = (i, j) => {
      // this.props.checkCell(i, j)
      this.props.socket.emit("game/action", {i, j}, (data) => {
        console.log(['data'], data)
      })
    }

    const checkCell = (i, j) => {
      this.props.checkCell(i, j)
    }

    const findMine = (i, j) => {
      this.props.findMine(i, j)
    }




    let rows = this.props.tableTwoDimensional.map(function (item, i) {
      let entry = item.map(function (element, j) {
        return (
          // <td onClick={() => {checkCell(i, j); findMine(i, j)}} className={classes.itemCell} key={j}> {element.isMine ? <FontAwesomeIcon icon={faBomb} /> : (element.isOpen && element.amountOfMines === 0) ? '' : element.amountOfMines} </td>
          // <td onClick={() => {checkCell(i, j); findMine(i, j)}} className={`${element.isBlownUp && classes.blownUpBackground} ${element.isOpen && !element.isMine && element.amountOfMines === 0 && classes.emptyOpened} ${classes.itemCell}`} key={j}> {element.isMine && isGameOver ? <FontAwesomeIcon icon={faBomb} /> : (element.isOpen && !element.isMine && element.amountOfMines > 0 && element.amountOfMines) } </td>
          <td onClick={() => {
            sendAction(i, j)
          }}
              className={`${element.isBlownUp && classes.blownUpBackground} ${element.isOpen && !element.isMine && element.amountOfMines !== 0 && classes.emptyOpened} ${element.isOpen && !element.isMine && element.amountOfMines === 0 && classes.emptyOpened} ${classes.itemCell}`}
              key={j}> {element.isMine && element.isBlownUp ? <FontAwesomeIcon
            icon={faBomb}/> : (element.isOpen && !element.isMine && element.amountOfMines > 0 && element.amountOfMines)} </td>
        );
      });
      return (
        <tr key={i}> {entry} </tr>
      );
    });
console.log("gamesList", this.props.gamesList)
console.log("usersInGame", this.props.usersInGame)

    let maxPlayers = this.props.gamesList.filter(item => {
      return item.gameid === this.props.match.params.gameId
    })

    console.log("maxPlayers", maxPlayers)
    return (
      <div>

        {/*<div onClick={() => {drawingMap(tableTwoDimensional)}}>DRAWING MAP</div>*/}
        {this.props.isGameOver && <div>GAME OVER</div>}
        <table>
          {rows}
        </table>
        <div>list players: {this.props.usersInGame.map(item => {
          return <div>{item.tabid}</div>
        })}</div>
        {maxPlayers[0] && <div>Players: {this.props.usersInRoom[this.props.match.params.gameId]}/{maxPlayers[0].maxplayers}</div>}
        {!this.state.isReady ? <div onClick={() => {this.onReady()}}>Ready</div> : <div onClick={() => {this.onNotReady()}}>Not ready</div>}
        {(maxPlayers[0] && maxPlayers[0].owner == JSON.parse(localStorage.getItem('user')).userId) && <div onClick={() => {}}>START GAME</div>}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  gameInfo: state.gamePage.gameInfo,
  tableTwoDimensional: state.gamePage.tableTwoDimensional,
  isGameOver: state.gamePage.isGameOver,
  socket: state.socketPage.socket,
  gamesList: state.gamePage.gamesList,
  usersInRoom: state.gamePage.usersInRoom,
  usersInGame: state.gamePage.usersInGame,
  usersReadiness: state.gamePage.usersReadiness
})

export default withRouter(connect(mapStateToProps, {
  checkCell, findMine
})(Game));
