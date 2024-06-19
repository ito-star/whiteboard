const _ = require("lodash");

const ThemeColors = {
  BLUE: "#2c387e",
  LIGHTBLUE: "#0f8df0",
  YELLOW: "#ffc106",
  ORANGE: "#f67c09",
  RED: "#dc143c",
  SCARLET: "#FF2400",
  PINK: "#F4869C",
  BEIGE: "#FCEAB4",
  GREEN: "#55C57C",
  DARKGREEN: "#0da00b",
  BROWN: "#795548",
  GREY: "#4B4B4B",
  PURPLE: "#a043bc",
  DARKBLUE: "#051225",
  DARKGREY: "#1f1f1f",
  BLACK: "#000000",
  LIGHTGREY: "#F1F1F1",
  NOCOLOR: "#ffffff00",
  WHITE: "#ffffff",
};

const ThemeColorLabels = {
  DARKBLUE: "Dark Blue",
  BLUE: "Blue",
  SCARLET: "Scarlet",
  LIGHTBLUE: "Light Blue",
  YELLOW: "Yellow",
  ORANGE: "Orange",
  RED: "Red",
  PINK: "Pink",
  DARKGREEN: "Dark Green",
  BEIGE: "Beige",
  GREEN: "Green",
  BROWN: "Brown",
  GREY: "Grey",
  BLACK: "Black",
  DARKGREY: "Dark Grey",
  PURPLE: "Purple",
  LIGHTGREY: "Light Grey",
  NOCOLOR: "Transparent",
  WHITE: "White",
};

Object.entries(ThemeColors).forEach(([key, value]) => {
  ThemeColorLabels[value] = ThemeColorLabels[key];
});

const boardColors = [
  ThemeColors.RED,
  ThemeColors.SCARLET,
  ThemeColors.ORANGE,
  ThemeColors.YELLOW,
  ThemeColors.GREEN,
  ThemeColors.DARKGREEN,
  ThemeColors.LIGHTBLUE,
  ThemeColors.BLUE,
  ThemeColors.DARKBLUE,
  ThemeColors.PURPLE,
  ThemeColors.PINK,
  ThemeColors.BEIGE,
  ThemeColors.BROWN,
  ThemeColors.GREY,
  ThemeColors.DARKGREY,
  ThemeColors.BLACK,
  ThemeColors.LIGHTGREY,
  ThemeColors.NOCOLOR,
  ThemeColors.WHITE,
];

const blockColors = _.without(boardColors, ThemeColors.NOCOLOR);

exports.ThemeColors = ThemeColors;
exports.ThemeColorLabels = ThemeColorLabels;
exports.boardColors = boardColors;
exports.blockColors = blockColors;

exports.makeColorChoices = (colors) => {
  const choices = colors.map((color) => {
    return {
      label: ThemeColorLabels[color] || color,
      value: color,
      sample: color,
    };
  });

  return choices;
};
