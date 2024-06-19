import React, { Component } from "react";
import "./BoardListView.scss";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import OpenInNewIcon from "@material-ui/icons/OpenInNewOutlined";
import { blockTypeColors } from "../constant";

class BoardListView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocks: [],
    };
  }

  componentDidMount() {
    const { board_id } = this.props;
    const ref = firebase.database().ref(`blocks/${board_id}`);

    ref.once("value", (snap) => {
      let blocks = [];
      snap.forEach((blockSnap) => {
        const block = blockSnap.val();
        blocks = [...blocks, { block_id: block.id, ...block }];
      });

      this.setState({
        blocks,
      });
    });
  }

  handleBlockFullScreen = (block) => {
    const { board_id } = this.props;
    const blockURL = `/board/${board_id}/block/${block.block_id}`;
    window.open(blockURL, "_blank");
  };

  render() {
    const { blocks } = this.state;
    return (
      <div className="board-list-view">
        <TableContainer component={Paper}>
          <Table stickyHeader style={{ tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                <TableCell align="left">Maximize</TableCell>
                <TableCell align="left">Content Type</TableCell>
                <TableCell align="left" width="80%">
                  Block Name
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blocks.map((block) => (
                <TableRow key={block.block_id}>
                  <TableCell align="left" padding="none">
                    <IconButton
                      onClick={() => this.handleBlockFullScreen(block)}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="left" padding="none">
                    <Chip
                      label={block.type}
                      style={{
                        backgroundColor: blockTypeColors[block.type],
                        color: "white",
                      }}
                    />
                  </TableCell>
                  <TableCell align="left">{block.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
}

export default BoardListView;
