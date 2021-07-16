import React from "react";
import {connect} from "react-redux";
import {withRouter} from 'react-router-dom';
import ModalContainer from "../Modal/ModalContainer";
import {openModal} from "../../redux/reducers/modalReducer";
import EditModalContainer from "../Modal/EditModal/EditModalContainer";

class Home extends React.Component {

  componentDidMount() {

  }

  joinToGame = (gameId) => {
    this.props.socket.emit('game/join', {gameId}, (data) => {
      console.log(['data'], data)
    })
  }

  render() {
    console.log("this.props.gamesList", this.props.gamesList)
    return (
      <div>
        <div onClick={() => {
          this.props.openModal(<EditModalContainer title={'TITLE'} id={33333} text={'TESTEST'}/>)
        }}>Open modal
        </div>
        <ModalContainer/>
        HOME
        <div>
          <span>LIST OF ACTIVE GAMES</span>
          <div>
            {this.props.gamesList.map(item => {
              return <div onClick={() => {
                this.joinToGame(item.gameid)
              }}>
                <span>Name: {item.gamename} </span>
                <span>Field: {item.fieldsize} </span>
                <span>Players: {this.props.usersInRoom[item.gameid]}/{item.maxplayers} </span>
                <span>Mines: {item.amountofmines} </span>
                <span>Live: Off </span>
              </div>
            })}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  gamesList: state.gamePage.gamesList,
  socket: state.socketPage.socket,
  usersInRoom: state.gamePage.usersInRoom
})

export default withRouter(connect(mapStateToProps, {
  openModal
})(Home));
