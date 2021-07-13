import React from "react";
import {connect} from "react-redux";
import {Redirect} from "react-router-dom";



class Auth extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isSocketExist: false,
    }
  }


  render() {

    if (!this.props.token) return <Redirect to={'/login'}/>

    if (this.props.token) {
      return <Redirect to={'/'}/>
    }
  }
}

const mapStateToProps = (state) => ({
  token: state.auth.token,
})

export default connect(mapStateToProps, {
})(Auth);