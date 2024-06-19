import React, { useState } from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Popover from "@material-ui/core/Popover";
import { SketchPicker } from "react-color";
import clsx from "clsx";
import { customButtonProps, customButtonType } from "../constant";
import CustomButton from "../CustomButton";
import UrlField from "../BlockModal/UrlField";
import "./ButtonOptionPanel.scss";

const ButtonOptionPanel = ({ currentButton, handleChange }) => {
  const buttonTypes = Object.keys(customButtonType);
  const [buttonData, setButtonData] = useState(currentButton);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isBGColor, setISBGColor] = useState(false);

  const handleButtonChange = (button) => {
    if (button.type === currentButton.type) {
      setButtonData(currentButton);
    } else {
      setButtonData({ ...button, id: buttonData.id });
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    e.preventDefault();
    handleChange(buttonData);
  };

  return (
    <form onSubmit={handleSave}>
      <div className="button-option-panel">
        <div className="button-types-container">
          <div className="container-title">BUTTON TYPE</div>
          <div className="button-types">
            {buttonTypes.map((buttonType) => (
              <div
                className={clsx({
                  "button-container": true,
                  selected: buttonType === buttonData.type,
                })}
                key={buttonType}
              >
                <CustomButton
                  button={customButtonProps[buttonType]}
                  onClick={() =>
                    handleButtonChange(customButtonProps[buttonType])
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div className="button-options-container">
          <div className="container-title">BUTTON OPTIONS</div>
          <div className="button-options">
            <TextField
              label="Button text"
              value={buttonData.text}
              onChange={(e) =>
                setButtonData({ ...buttonData, text: e.target.value })
              }
            />
            <UrlField
              label="Button URL"
              value={buttonData.url}
              allowedSchemes={[
                ...UrlField.defaultProps.allowedSchemes,
                "mailto",
                "tel",
                "callto",
                "cid",
                "xmpp",
              ]}
              onChange={(e) =>
                setButtonData({ ...buttonData, url: e.target.value })
              }
            />
            <div className="color-container">
              <div className="color-selector-container">
                <span className="color-selector-title">Text Color</span>
                <Button
                  className="color-selector"
                  style={{ backgroundColor: buttonData.color }}
                  onClick={(e) => {
                    setISBGColor(false);
                    setAnchorEl(e.currentTarget);
                  }}
                  disabled={buttonData.type !== customButtonType.Custom}
                />
              </div>
              <div className="color-selector-container">
                <span className="color-selector-title">Background Color</span>
                <Button
                  className="color-selector"
                  style={{ backgroundColor: buttonData.backgroundColor }}
                  onClick={(e) => {
                    setISBGColor(true);
                    setAnchorEl(e.currentTarget);
                  }}
                  disabled={buttonData.type !== customButtonType.Custom}
                />
              </div>
            </div>
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "center",
                horizontal: "left",
              }}
            >
              <SketchPicker
                color={buttonData.color}
                onChange={(color) => {
                  if (isBGColor)
                    setButtonData({
                      ...buttonData,
                      backgroundColor: color.hex,
                    });
                  else setButtonData({ ...buttonData, color: color.hex });
                }}
              />
            </Popover>
            <Button type="submit" variant="outlined" color="primary">
              Save
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ButtonOptionPanel;
