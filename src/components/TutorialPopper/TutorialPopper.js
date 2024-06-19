import React from "react";
import {
  Button,
  Box,
  Grow,
  IconButton,
  Paper,
  Popper,
  Typography,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/CloseOutlined";
import useUser from "../../auth/useUser";
import "./TutorialPopper.scss";

const TotorialContent = [
  {
    title: "What?",
    description:
      'Welcome to Whatboard. Let\'s create our first board! Boards are where you organize and share content with others. Click on the "+ Create New" or "TRY" buttons to get started!',
  },
  {
    title: "What are blocks?",
    description: (
      <>
        <p>
          Blocks hold and display your content. Each Block type can hold a
          different type of content (eg. text, images, PDFs, checklists, etc).
          Title and create your first Block.
        </p>

        <p>
          TIPS: Drag and drop your content on the canvas to create new blocks.
          Also, click the title bar of your Block and drag anywhere on the
          canvas.
        </p>
      </>
    ),
  },
  {
    title: "What Settings?",
    description:
      "Customize, share and protect your board using Board Settings. Use the Collaborators tab to invite others to your board or generate a public link, password protect your board using the Password Protection tab, or use the Customize Board tab to add color to your board.",
  },
  {
    title: "How do I share a board?",
    description:
      'Click the "Share" button to quickly generate and copy a public link to your board. Alternatively, visit the Board Settings "Collaborators" tab to invite collaborators and keep your board private.',
  },
  {
    title: "What? My board is a mess!",
    description:
      'Use the "Tidy Up Board" button and we\'ll help you clean things up faster than you can say Whatboard!',
  },
  {
    title: "What does Freeze do?",
    description:
      "Freeze locks all your blocks positions. This ensures that you or someone you share your board with cannot alter the format of the blocks. If you want to move blocks just click the Freeze button again to unlock the blocks.",
  },
];

const TutorialPopper = ({
  popperAnchor,
  onClose,
  onTry = () => {},
  placement = "bottom-start",
}) => {
  const { user, updateTutorialStep } = useUser();
  const { title, description } = TotorialContent[+user.tutorialStep - 1];

  const handleSkip = () => {
    updateTutorialStep(+user.tutorialStep + 1);
    onClose();
  };

  const handleClickTry = () => {
    updateTutorialStep(+user.tutorialStep + 1);
    onTry();
    onClose();
  };

  if (!popperAnchor) return null;

  return (
    <Popper
      open={!!popperAnchor}
      anchorEl={popperAnchor}
      placement={placement}
      transition
      style={{ zIndex: 1001 }}
    >
      {({ TransitionProps }) => (
        <Grow {...TransitionProps}>
          <Paper className="tutorial-popper">
            <IconButton className="close-tutorial" onClick={onClose}>
              <CloseIcon />
            </IconButton>
            <Box padding={2} className="tutorial-body">
              <Typography variant="h6" className="tutorial-title">
                {title}
              </Typography>
              <Typography variant="subtitle1" className="tutorial-subtitle">
                {description}
              </Typography>
            </Box>
            <Box
              display="flex"
              padding={1}
              justifyContent="space-between"
              alignItems="center"
            >
              <Button onClick={handleSkip}>SKIP</Button>
              <Typography variant="button">
                {user.tutorialStep} / {6}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClickTry}
              >
                TRY
              </Button>
            </Box>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
};

export default TutorialPopper;
