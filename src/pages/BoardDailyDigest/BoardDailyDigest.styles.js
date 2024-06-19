import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  headCell: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  accordion: {
    marginTop: 16,
  },
}));

export default useStyles;
