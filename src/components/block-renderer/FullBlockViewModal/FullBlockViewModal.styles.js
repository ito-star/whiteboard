import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  root: {
    background: "rgba(0,0,0,0.6)",
  },
  wrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  toolbar: {
    background:
      "linear-gradient(to bottom,rgba(0,0,0,0.75) 0%,transparent 100%)",
    height: 60,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    left: 24,
  },
  toolbarControls: {
    display: "flex",
    gap: "24px",
  },
  transformWrapper: {
    margin: "0 auto !important",
    minWidth: "50%",
    minHeight: "80%",
    maxWidth: "80%",
    maxHeight: "100%",
  },
  contentWrapper: {
    padding: "40px 0",
    height: "calc(100vh - 100px)",
  },
  previousIcon: {
    position: "absolute",
    left: "25px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  },
  nextPageIcon: {
    position: "absolute",
    right: "25px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  },
}));

export default useStyles;
