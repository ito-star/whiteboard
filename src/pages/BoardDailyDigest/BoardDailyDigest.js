import * as React from "react";
import { compose } from "redux";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
} from "@material-ui/core";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import dayjs from "dayjs";
import _groupBy from "lodash/groupBy";
import SimpleNavBar from "../../SimpleNavBar";
import { initFirebase, getCallableFbFunction } from "../../utils";
import restrictedPage from "../../auth/restrictedPage";
import useStyles from "./BoardDailyDigest.styles";
import Loader from "../../components/Loader";

const Row = (props) => {
  const { row } = props;
  const [open, setOpen] = React.useState(false);
  const logByEmail = _groupBy(Object.values(row.detail), "email");

  return (
    <>
      <TableRow>
        <TableCell style={{ borderBottom: "unset" }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" style={{ borderBottom: "unset" }}>
          {row.date}
        </TableCell>
        <TableCell align="center" style={{ borderBottom: "unset" }}>
          {row.dailyVisits}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Visitors
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell align="center">Visits</TableCell>
                    <TableCell align="center">Visit Times</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(logByEmail).map((email) => {
                    return (
                      <TableRow key={email}>
                        <TableCell>{email}</TableCell>
                        <TableCell align="center">
                          {logByEmail[email].length}
                        </TableCell>
                        <TableCell align="center">
                          {logByEmail[email].map((log) => (
                            <p key={log.createdAt}>
                              {dayjs(log.createdAt).format(
                                "ddd, MMM D, YYYY h:mm A"
                              )}
                            </p>
                          ))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const DailyDigestPage = () => {
  const styles = useStyles();
  const [digestData, setDigestData] = React.useState([]);
  const [loadingDegest, setLoadingDigest] = React.useState(true);
  React.useEffect(() => {
    initFirebase();
    const getDailyDigest = getCallableFbFunction("boards-getDailyDigest");
    getDailyDigest()
      .then((res) => {
        setDigestData(res.data);
      })
      .finally(() => {
        setLoadingDigest(false);
      });
  }, []);

  if (loadingDegest) {
    return <Loader isFullScreen />;
  }

  return (
    <>
      <SimpleNavBar />
      <Box mt={4} maxWidth={700} mx="auto">
        <Typography variant="h4">
          Daily Digest enabled on {digestData.length} board
          {digestData.length === 1 ? "" : "s"}
        </Typography>
        {digestData.map((boardData) => (
          <Accordion key={boardData.boardId} className={styles.accordion}>
            <AccordionSummary id={boardData.boardId}>
              <Typography>{boardData.boardName}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className={styles.headCell} />
                      <TableCell className={styles.headCell}>Date</TableCell>
                      <TableCell align="center" className={styles.headCell}>
                        Total Visits
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(boardData.dailyLog).map((logKey) => {
                      const date = logKey;
                      const dailyVisits = Object.keys(
                        boardData.dailyLog[logKey]
                      ).length;
                      return (
                        <Row
                          key={logKey}
                          row={{
                            date,
                            dailyVisits,
                            detail: boardData.dailyLog[logKey],
                          }}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </>
  );
};

const enhance = compose(restrictedPage());

export default enhance(DailyDigestPage);
