import React, { useState, useEffect, useCallback } from "react";
import _difference from "lodash/difference";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { useControlled } from "@material-ui/core";
import { useSnackbar } from "notistack";
import { getCallableFbFunction } from "../utils";

const AddressAutoComplete = (props) => {
  const {
    excludeEmails = [],
    defaultValue = [],
    value: valueProp,
    onChange,
  } = props;

  const [userAddressBook, setUserAddressBook] = React.useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = React.useState("");
  const { enqueueSnackbar } = useSnackbar();

  const [emails, setEmails] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: "AddressAutoComplete",
  });

  const handleChange = useCallback(
    (event, value, reason) => {
      setEmails(value);

      if (onChange) {
        onChange(event, value, reason);
      }
    },
    [onChange, setEmails]
  );

  useEffect(() => {
    const getUserAddressBook = async () => {
      try {
        const userAddressBookFunc = await getCallableFbFunction(
          "users-getAddressBookForUser"
        );
        let emailAddresses = [];

        const res = await userAddressBookFunc();

        Object.keys(res.data).forEach((key) => {
          emailAddresses.push(res.data[key]);
        });

        emailAddresses = _difference(emailAddresses, excludeEmails);

        setUserAddressBook(emailAddresses);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);

        enqueueSnackbar(e.toString(), {
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    getUserAddressBook();
  }, [enqueueSnackbar, excludeEmails]);

  // For some reason, `onInputChange` doesn't trigger
  // when the user hits the Space bar. So, we need this
  // to detect when this happens.
  const handleKeyDown = (event) => {
    if (event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      const newValue = event.target.value.trim();

      if (newValue) {
        // eslint-disable-next-line no-param-reassign
        event.target.value = newValue;

        if (event.target.reportValidity()) {
          handleChange(event, [...emails, newValue], "create-option");
        }
      }
    }
  };

  const handleInputChange = (event, newInputValue) => {
    if (newInputValue.endsWith(",")) {
      event.preventDefault();
      event.stopPropagation();
      const newValue = newInputValue.slice(0, -1).trim();

      if (newValue) {
        // eslint-disable-next-line no-param-reassign
        event.target.value = newValue;

        if (event.target.reportValidity()) {
          handleChange(event, [...emails, newValue], "create-option");
        }
      }
    } else {
      setInputValue(newInputValue);
    }
  };

  const handleBlur = (event) => {
    if (event.target.value && event.target.reportValidity()) {
      handleChange(event, [...emails, event.target.value], "create-option");
    }
  };

  return (
    <Autocomplete
      loading={isLoading}
      freeSolo
      disableClearable
      disableCloseOnSelect
      fullWidth
      value={emails}
      inputValue={inputValue}
      multiple
      onChange={handleChange}
      onInputChange={handleInputChange}
      options={userAddressBook}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            label="Email Address"
            autoComplete="off"
            name="email"
            type="email"
            required={emails.length === 0}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            helperText='Enter one or more email addresses, separated by spaces (" ") or commas (",")'
          />
        );
      }}
    />
  );
};

export default AddressAutoComplete;
