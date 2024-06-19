import React from "react";
import AddRemoveLayout from "./Layout";
import { initFirebase } from "./utils";
import Loader from "./components/Loader";

export default class Screen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      board_id: props.board_id,
      board_members: props.board_members,
      board_name: props.board_name,
      readOnlyBodyColor: props.readOnlyBodyColor,
      layoutLoaded: false,
    };
  }

  componentDidMount() {
    initFirebase();
    this.setState({ layoutLoaded: true });
  }

  layoutChanged = () => {
    // TODO Figure out if we need this? This function doesn't seem to be used
  };

  render() {
    // layout is an array of objects, see the demo for more complete usage
    const {
      layoutLoaded,
      board_id,
      board_members,
      board_name,
      readOnlyBodyColor,
    } = this.state;
    const { readOnly, readOnlyId, toolbarContainer } = this.props;

    if (!layoutLoaded) {
      return <Loader />;
    }

    return (
      <AddRemoveLayout
        layoutChangeMethod={this.layoutChanged}
        board_id={board_id}
        board_members={board_members}
        board_name={board_name}
        readOnly={readOnly}
        readOnlyId={readOnlyId}
        readOnlyBodyColor={readOnlyBodyColor}
        toolbarContainer={toolbarContainer}
      />
    );
  }
}
