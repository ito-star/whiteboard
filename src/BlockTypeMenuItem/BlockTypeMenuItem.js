import React from "react";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import HelpIcon from "@material-ui/icons/HelpOutlineOutlined";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Tooltip from "@material-ui/core/Tooltip";
import RestrictedMenuItem from "../RestrictedMenuItem/RestrictedMenuItem";
import UpgradeOffer from "../User/UpgradeOffer";
import access from "../access";
import { blockTypesInfo } from "../constant";

/**
 * A helper component for displaying Block types within a menu
 * (like `<Menu>`, `<TextField select>`, or `<Select>`)
 *
 * Automatically supplies the proper label for the given
 * Block type.
 *
 * Performs all of the neccessary access checks to ensure that
 * the current user is allowed to create Blocks of the given type.
 */
const BlockTypeMenuItem = React.forwardRef(function BlockTypeMenuItem(
  props,
  ref
) {
  const { blockType, ...other } = props;

  const blockTypeLabel = blockTypesInfo[blockType].label;
  const blockTypeIcon = blockTypesInfo[blockType].icon;
  const accessCheck = (user) => {
    return access.canCreateBlocksOfType(blockType, user);
  };

  const fallback = (
    <MenuItem ref={ref} {...other} disabled>
      <ListItemIcon>{blockTypeIcon}</ListItemIcon>
      <ListItemText primary={blockTypeLabel} />
      <ListItemSecondaryAction>
        <Tooltip title={<UpgradeOffer prefix="Want to use this Block type?" />}>
          <IconButton edge="end">
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </MenuItem>
  );

  return (
    <RestrictedMenuItem
      ref={ref}
      {...other}
      AuthCheckProps={{
        accessCheck,
        fallback,
      }}
    >
      <ListItemIcon>{blockTypeIcon}</ListItemIcon>
      <ListItemText primary={blockTypeLabel} />
    </RestrictedMenuItem>
  );
});

BlockTypeMenuItem.propTypes = {
  ...MenuItem.propTypes,
  blockType: PropTypes.oneOf(Array.from(Object.keys(blockTypesInfo)))
    .isRequired,
};

export default BlockTypeMenuItem;
