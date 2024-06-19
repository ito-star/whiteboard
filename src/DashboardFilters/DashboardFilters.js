import React, { useState } from "react";
import PropTypes from "prop-types";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";

import "./DashboardFilters.scss";

const DashboardFilters = (props) => {
  const [searchKey, setSearchKey] = useState("");
  const [filterBy, setFilterBy] = useState("ALL");
  const handleBoardSearch = (e) => {
    setSearchKey(e.target.value.toLowerCase());
    props.onFilterSearch(e.target.value.toLowerCase());
  };

  const handleBoardFilterChange = (e) => {
    setFilterBy(e.target.value);
    props.onSelectFilterDropdown(e.target.value);
  };

  return (
    <div className="dashboard-filters">
      <TextField
        label="Search Boards"
        size="small"
        type="search"
        variant="outlined"
        className="search-input--primary"
        onChange={handleBoardSearch}
        value={searchKey}
      />
      <div>
        <Select
          labelId="dashboard-filters--label"
          id="dashboard-filters--label"
          className="dashboard-filters--dropdown"
          variant="outlined"
          value={filterBy}
          onChange={handleBoardFilterChange}
        >
          <MenuItem value="ALL">Active</MenuItem>
          <MenuItem value="VIEWED">Viewed</MenuItem>
          <MenuItem value="MODIFIED">Modified</MenuItem>
          <MenuItem value="LOCKED">Locked</MenuItem>
          <MenuItem value="PUBLIC">Public</MenuItem>
          <MenuItem value="SHAREDBYYOU">Shared by you</MenuItem>
          <MenuItem value="SHAREDWITHYOU">Shared with you</MenuItem>
          <MenuItem value="ARCHIVED">Archived</MenuItem>
        </Select>
      </div>
    </div>
  );
};

DashboardFilters.propTypes = {
  onFilterSearch: PropTypes.func.isRequired,
  onSelectFilterDropdown: PropTypes.func.isRequired,
};

export default DashboardFilters;
