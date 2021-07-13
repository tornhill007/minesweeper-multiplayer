import React from 'react';
import {connect} from "react-redux";
import EditModal from "./EditModal";
import {
  closeModal
} from "../../../redux/reducers/modalReducer";
import {setGameInfo, setGameInfoAndSetTable} from "../../../redux/reducers/gameReducer";
import {withRouter} from "react-router-dom";

let mapStateToProps = (state) => {
  return {

  }
};


export default withRouter(connect(mapStateToProps, {closeModal, setGameInfoAndSetTable, setGameInfo})(EditModal));