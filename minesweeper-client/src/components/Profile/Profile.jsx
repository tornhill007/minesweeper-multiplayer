import React, {useEffect} from "react";
import {connect} from "react-redux";
import classes from './Profile.module.css';
import {NavLink} from "react-router-dom";


const Profile = (props) => {


  useEffect(() => {
    props.socket && props.socket.emit("game/getPlayerStats")
  }, [])

  let playerStat = props.playerStats.filter(item => item.userid == props.userId)
console.log("playerStat", playerStat)

  return <div className={classes.mainWrap}>
    <NavLink to={'/'} className={classes.leftItem}>
      Home
    </NavLink>
    <div className={classes.rightItem}>
      <div>
      Name: {props.userName}
      </div>
      <div>
        Amount of loss: {playerStat[0] ? playerStat[0].lossamount : 0}
      </div>
      <div>
        Amount of win : {playerStat[0] ? playerStat[0].winamount : 0}
      </div>
      </div>
  </div>
}

const mapStateToProps = (state) => ({
  userName: state.auth.userName,
  userId: state.auth.userId,
  socket: state.socketPage.socket,
  playerStats: state.gamePage.playerStats
})

export default connect(mapStateToProps, {})(Profile);