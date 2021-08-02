import React from "react";
import {connect} from "react-redux";
import {NavLink, withRouter} from 'react-router-dom';
import ModalContainer from "../Modal/ModalContainer";
import {openModal} from "../../redux/reducers/modalReducer";
import EditModalContainer from "../Modal/EditModal/EditModalContainer";
import classes from './Home.module.css'

class Home extends React.Component {

  componentDidMount() {

  }

  joinToGame = (gameId) => {
    this.props.socket.emit('game/join', {gameId}, (data) => {
      console.log(['data'], data)
    })
  }

  joinToGameAsViewer = (gameId) => {
    this.props.socket.emit('game/join', {gameId, isViewer: true}, (data) => {
      console.log(['data'], data)
    })
  }

  render() {
    console.log("this.props.usersInRoom", this.props.usersInRoom)
    return (
      <div className={classes.wrapper}>
        <div className={classes.leftItem}>
          <NavLink to={'/profile'}>Profile</NavLink>
        </div>
        <div className={classes.rightItem}>
          <div onClick={() => {
            this.props.openModal(<EditModalContainer title={'TITLE'} id={33333} text={'TESTEST'}/>)
          }}>Open modal
          </div>
          <ModalContainer/>
          HOME
          <div>
            <span>LIST OF ACTIVE GAMES</span>
            <div>
              {this.props.gamesList.filter(game => !game.isfinished).map(item => {
                return <div>
                  <div onClick={() => {
                    this.joinToGame(item.gameid)
                  }}>
                    <span>Name: {item.gamename} </span>
                    <span>Field: {item.fieldsize} </span>
                    <span>Players: {this.props.usersInRoom[item.gameid]}/{item.maxplayers} </span>
                    <span>Mines: {item.amountofmines} </span>
                    {item.isplaying ? <span>Live</span> : <span>Pending</span>}
                  </div>
                  <div onClick={() => {
                    this.joinToGameAsViewer(item.gameid)
                  }}>Join as Viewer
                  </div>
                </div>
              })}
            </div>
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
