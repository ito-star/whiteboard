import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0)",
    transition: "400ms background ease-in, 400ms opacity ease-in",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    gap: "24px",
    "&:hover": {
      background: "rgba(256, 256, 256, 0.7)",
      opacity: 1,
    },
  },
}));

export default useStyles;
