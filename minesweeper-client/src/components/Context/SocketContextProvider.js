import React, { Component } from "react";
const { Provider, Consumer } = React.createContext();

class SocketContextProvider extends Component {
  state = {
    theme: "Day"
  };

  toggleTheme = () => {
    this.setState(prevState => {
      return {
        theme: prevState.theme === "Day" ? "Night" : "Day"
      };
    });
  };

  render() {
    return (
      <Provider
        value={this.state.theme}
      >
        {this.props.children}
      </Provider>
    );
  }
}

export { SocketContextProvider, Consumer as SocketContextConsumer };