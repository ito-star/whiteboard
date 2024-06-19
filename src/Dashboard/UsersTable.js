import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Paper from "@material-ui/core/Paper";
import Dayjs from "dayjs";
import _orderBy from "lodash/orderBy";
import _get from "lodash/get";

function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  const headCells = [
    {
      id: "displayName",
      numeric: false,
      disablePadding: true,
      label: "Name",
      align: "left",
    },
    {
      id: "lastSignInTime",
      numeric: true,
      disablePadding: false,
      label: "Last Sign In",
      align: "left",
    },
    {
      id: "loginType",
      numeric: true,
      disablePadding: false,
      label: "Login Type",
      align: "left",
    },
    {
      id: "email",
      numeric: true,
      disablePadding: false,
      label: "Email",
      align: "left",
    },
  ];

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            sortDirection={orderBy === headCell.id ? order : false}
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

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    marginTop: "20px",
    paddingLeft: "16px",
    paddingRight: "8px",
  },
  paper: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
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
  const classes = useStyles();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("displayName");
  const { data } = props;
  const rows = data;
  const sortProps = {
    displayName: "displayName",
    lastSignInTime(user) {
      return new Date(user.metadata.lastSignInTime);
    },
    loginType: "providerData[0].providerId",
    email: "email",
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <TableContainer>
          <Table
            className={classes.table}
            aria-labelledby="tableTitle"
            aria-label="enhanced users table"
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              classes={classes}
            />
            <TableBody>
              {_orderBy(rows, sortProps[orderBy], order).map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={row.uid}
                    padding="checkbox"
                  >
                    <TableCell component="th" id={labelId} scope="row">
                      {row.displayName}
                    </TableCell>
                    <TableCell align="left">
                      {Dayjs(row.metadata.lastSignInTime).format("YYYY-MM-DD")}
                    </TableCell>
                    {_get(row, "providerData[0].providerId") && (
                      <TableCell
                        component="th"
                        align="left"
                        id={labelId}
                        scope="row"
                      >
                        {row.providerData[0].providerId}
                      </TableCell>
                    )}
                    <TableCell component="th" id={labelId} scope="row">
                      {row.email || "-"}
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
