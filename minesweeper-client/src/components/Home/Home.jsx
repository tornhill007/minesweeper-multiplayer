import React from "react";
import {connect} from "react-redux";
import {withRouter} from 'react-router-dom';
import ModalContainer from "../Modal/ModalContainer";
import {openModal} from "../../redux/reducers/modalReducer";
import EditModalContainer from "../Modal/EditModal/EditModalContainer";

class Home extends React.Component {

  render() {

   return (
      <div>
        <div onClick={() => {this.props.openModal(<EditModalContainer title={'TITLE'} id={33333} text={'TESTEST'}/>)}}>Open modal</div>
      <ModalContainer/>
        HOME
      </div>
    );
  }
}

const mapStateToProps = (state) => ({

})

export default withRouter(connect(mapStateToProps, {openModal
})(Home));
