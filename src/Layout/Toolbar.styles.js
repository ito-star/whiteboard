import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  staticTooltipLabel: {
    whiteSpace: "nowrap",
    fontSize: 12,
    paddingLeft: 10,
    paddingRight: 10,
    cursor: "pointer",
  },
  dialActions: {
    position: "absolute",
    marginTop: "60px !important",
    paddingTop: "0 !important",
  },
  fab: {
    width: 48,
    height: 48,
  },
}));

export default useStyles;
