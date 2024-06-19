// compute base for responsive values; e.g.,
// [1,2,3] => {xs: true, sm: true, md: true}
// {xs: 1, sm: 2, md: 3} => {xs: true, sm: true, md: true}
export function computeBreakpointsBase(breakpointValues, themeBreakpoints) {
  // fixed value
  if (typeof breakpointValues !== "object") {
    return {};
  }
  const base = {};
  const breakpointsKeys = Object.keys(themeBreakpoints);
  if (Array.isArray(breakpointValues)) {
    breakpointsKeys.forEach((breakpoint, i) => {
      if (i < breakpointValues.length) {
        base[breakpoint] = true;
      }
    });
  } else {
    breakpointsKeys.forEach((breakpoint) => {
      if (breakpointValues[breakpoint] != null) {
        base[breakpoint] = true;
      }
    });
  }
  return base;
}

export function resolveBreakpointValues({
  values: breakpointValues,
  breakpoints: themeBreakpoints,
  base: customBase,
}) {
  const base =
    customBase || computeBreakpointsBase(breakpointValues, themeBreakpoints);
  const keys = Object.keys(base);

  if (keys.length === 0) {
    return breakpointValues;
  }

  let previous;

  return keys.reduce((acc, breakpoint, i) => {
    if (Array.isArray(breakpointValues)) {
      acc[breakpoint] =
        breakpointValues[i] != null
          ? breakpointValues[i]
          : breakpointValues[previous];
      previous = i;
    } else {
      acc[breakpoint] =
        breakpointValues[breakpoint] != null
          ? breakpointValues[breakpoint]
          : breakpointValues[previous] || breakpointValues;
      previous = breakpoint;
    }
    return acc;
  }, {});
}
