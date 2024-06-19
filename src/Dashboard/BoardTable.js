import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import { lighten, makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Toolbar from "@material-ui/core/Toolbar";
import Paper from "@material-ui/core/Paper";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import DeleteIcon from "@material-ui/icons/DeleteOutlined";
import ExitToAppIcon from "@material-ui/icons/ExitToAppOutlined";
import EditIcon from "@material-ui/icons/EditOutlined";
import AddToPhotosIcon from "@material-ui/icons/AddToPhotosOutlined";
import Dayjs from "dayjs";
import _orderBy from "lodash/orderBy";
import AuthCheck from "../auth/AuthCheck";
import access from "../access";

function EnhancedTableHead(props) {
  const {
    classes,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  const headCells = [
    {
      id: "board_name",
      numeric: false,
      disablePadding: true,
      label: "Name",
      align: "left",
    },
    {
      id: "board_members",
      numeric: true,
      disablePadding: false,
      label: "Sharing Status",
      align: "left",
    },
    {
      id: "date_created",
      numeric: true,
      disablePadding: false,
      label: "Date Created",
      align: "left",
    },
    {
      id: "action",
      numeric: true,
      disablePadding: false,
      label: "Actions",
      align: "center",
    },
  ];

  return (
    <TableHead className="board-table-head">
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ "aria-label": "select all boards" }}
            width="10%"
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            padding={headCell.disablePadding ? "none" : "default"}
            sortDirection={orderBy === headCell.id ? order : false}
            width="25%"
          >
            {headCell.id === "action" ? (
              <>{headCell.label}</>
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <span className={classes.visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </span>
                ) : null}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
    marginTop: 20,
  },
  highlight:
    theme.palette.type === "light"
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: "1 1 100%",
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const { numSelected, onDelete, title } = props;

  return (
    <Toolbar
      className={clsx(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected === 0 && <div className={classes.title}>{title}</div>}
      {numSelected > 0 && (
        <div className={classes.title}>{numSelected} selected</div>
      )}
      {numSelected > 0 && (
        <Tooltip title="Delete">
          <IconButton aria-label="delete" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  paper: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 300,
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
  },
}));

export default function EnhancedTable(props) {
  const history = useHistory();
  const classes = useStyles();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("board_name");
  const [selected, setSelected] = useState([]);
  const { data, title } = props;
  const rows = data;

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.board_id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleCheckClick = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleRowClick = (board_id) => {
    history.push(`/board/${board_id}`);
  };
  const handleCloneClick = (event, row) => {
    event.stopPropagation();
    props.onCloneBoard(row);
  };
  const handleEditClick = (event, row) => {
    event.stopPropagation();
    props.onEditBoard(row);
  };
  const handleDeleteClick = (event, row) => {
    event.stopPropagation();
    props.onRemoveBoards([row.board_id]);
  };
  const isSelected = (name) => selected.indexOf(name) !== -1;

  const handleDeleteAll = () => {
    props.onRemoveBoards(selected);
    setSelected([]);
  };
  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          onDelete={handleDeleteAll}
          title={title}
        />
        <TableContainer>
          <Table
            className={classes.table}
            aria-labelledby="tableTitle"
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody className="board-table-body">
              {_orderBy(rows, orderBy, order).map((row, index) => {
                const isItemSelected = isSelected(row.board_id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.board_id}
                    selected={isItemSelected}
                    onClick={() => handleRowClick(row.board_id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) =>
                          handleCheckClick(event, row.board_id)
                        }
                        inputProps={{ "aria-labelledby": labelId }}
                        width="10%"
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                      width="20%"
                    >
                      {row.board_name}
                    </TableCell>
                    <TableCell align="left" width="25%">
                      {row.board_members.length > 1 && "Shared, "}
                      {row.isPublic ? "Public" : "Private"}
                    </TableCell>
                    <TableCell align="left" width="25%">
                      {Dayjs(row.date_created).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell align="center" width="20%">
                      <AuthCheck
                        accessCheck={(user) => access.canEditBoard(row, user)}
                      >
                        <Tooltip title="Rename">
                          <IconButton
                            aria-label="rename"
                            disabled={!!selected.length}
                            onClick={(e) => handleEditClick(e, row)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </AuthCheck>
                      <AuthCheck
                        accessCheck={(user) => access.canDeleteBoard(row, user)}
                      >
                        <Tooltip title="Delete">
                          <IconButton
                            aria-label="delete"
                            disabled={!!selected.length}
                            onClick={(e) => handleDeleteClick(e, row)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </AuthCheck>
                      <AuthCheck
                        accessCheck={(user) => access.canLeaveBoard(row, user)}
                      >
                        <Tooltip title="Leave">
                          <IconButton
                            aria-label="Leave board"
                            disabled={!!selected.length}
                            onClick={(e) => handleDeleteClick(e, row)}
                          >
                            <ExitToAppIcon />
                          </IconButton>
                        </Tooltip>
                      </AuthCheck>
                      <Tooltip title="Clone">
                        <IconButton
                          aria-label="clone"
                          disabled={!!selected.length}
                          onClick={(e) => handleCloneClick(e, row)}
                        >
                          <AddToPhotosIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}
