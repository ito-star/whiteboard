import React, { useCallback } from "react";
import PropTypes from "prop-types";
import * as PropTypesExtra from "prop-types-extra";
import TextField from "@material-ui/core/TextField";
import _omit from "lodash/omit";
import { withHttp } from "../utils";

const UrlField = React.forwardRef(function UrlField(props, ref) {
  const {
    inputProps: inputPropsProp = {},
    helperText = "Example: http://www.google.com",
    onChange: onChangeProp,
    allowedSchemes,
    ...other
  } = props;

  const onBlur = useCallback(
    (event) => {
      const linkified = withHttp(event.target.value);

      if (event.target.value !== linkified) {
        // eslint-disable-next-line no-param-reassign
        event.target.value = linkified;

        if (onChangeProp) {
          onChangeProp(event);
        }
      }

      if (inputPropsProp.onBlur) {
        inputPropsProp.onBlur(event);
      }
    },
    [onChangeProp, inputPropsProp]
  );

  const handleTextFieldKeyDown = (event) => {
    switch (event.key) {
      case "Enter":
        onBlur(event);
        break;
      default:
        break;
    }
  };

  let pattern;

  if (allowedSchemes.length) {
    const schemePattern = allowedSchemes
      .map((scheme) => {
        return Array.from(scheme)
          .map((letter) => {
            return `[${letter.toLowerCase()}${letter.toUpperCase()}]`;
          })
          .join("");
      })
      .join("|");
    pattern = `(?:${schemePattern}):.*`;
  }

  const inputProps = {
    ...inputPropsProp,
    pattern,
    onBlur,
  };

  return (
    <TextField
      {...other}
      onChange={onChangeProp}
      helperText={helperText}
      inputProps={inputProps}
      type="url"
      ref={ref}
      onKeyDown={handleTextFieldKeyDown}
    />
  );
});

UrlField.defaultProps = {
  allowedSchemes: ["http", "https", "ftp", "ftps"],
};

UrlField.propTypes = {
  ..._omit(TextField.propTypes, "type"),
  allowedSchemes: PropTypes.arrayOf(
    PropTypesExtra.all(
      PropTypes.string,
      (propValue, key, componentName, location, propFullName) => {
        const scheme = propValue[key];
        const isScheme = /^[a-z][a-z0-9+-.]*$/i;

        if (!isScheme.test(scheme)) {
          return new Error(
            `Invalid ${location} \`${propFullName}\` supplied to \`${componentName}\`: ${scheme} is not a valid URI scheme.`
          );
        }

        return null;
      }
    )
  ),
};

export default UrlField;
