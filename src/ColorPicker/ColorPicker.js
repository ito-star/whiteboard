import React from "react";
import clsx from "clsx";
import { connect } from "react-redux";
import { compose } from "redux";
import hexToRgba from "hex-to-rgba";
import { ThemeColors, boardColors } from "../constant";
import { setHeaderColor, setBodyColor } from "../actions/setting";
import { ColorItem } from "../components/style";

import "./Colorpicker.scss";

class ColorPicker extends React.Component {
  handleClick = (color) => {
    const {
      setHeaderColor: setHeaderColorProps,
      body,
      setBodyColor: setBodyColorProps,
    } = this.props;
    if (body) {
      setBodyColorProps(color);
    } else {
      setHeaderColorProps(color);
    }
  };

  render() {
    const { headerColor, bodyColor, body } = this.props;
    if (body) {
      return (
        <div className="colorPicker">
          {boardColors.map((color) => (
            <ColorItem
              className={clsx("color-item", {
                selected: bodyColor === color,
                nocolor: ThemeColors.NOCOLOR === color,
                whiteColor:
                  ThemeColors.WHITE === color ||
                  ThemeColors.LIGHTGREY === color,
              })}
              onClick={() => this.handleClick(color)}
              key={color}
              color={hexToRgba(color, 0.75)}
            />
          ))}
        </div>
      );
    }
    return (
      <div className="colorPicker">
        {boardColors.map((color) => (
          <ColorItem
            className={clsx("color-item", {
              selected: headerColor === color,
              nocolor: ThemeColors.NOCOLOR === color,
              whiteColor:
                ThemeColors.WHITE === color || ThemeColors.LIGHTGREY === color,
            })}
            onClick={() => this.handleClick(color)}
            key={color}
            color={color}
          />
        ))}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  headerColor: state.setting.headerColor,
  bodyColor: state.setting.bodyColor,
});

const enhance = compose(
  connect(mapStateToProps, { setHeaderColor, setBodyColor })
);

export default enhance(ColorPicker);
