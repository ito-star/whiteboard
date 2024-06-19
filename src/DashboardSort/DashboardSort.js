import React, { useState } from "react";
// import PropTypes from 'prop-types'
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

function DashboardSort(props) {
  const [sortBy, setSortBy] = useState("ALL");
  const handleBoardFilterChange = (e) => {
    setSortBy(e.target.value);
    props.onSelectSortDropdown(e.target.value);
  };

  return (
    <div className="dashboard-sort">
      <Select
        labelId="dashboard-filters--label"
        id="dashboard-filters--label"
        className="dashboard-filters--dropdown"
        variant="outlined"
        value={sortBy}
        onChange={handleBoardFilterChange}
      >
        <MenuItem value="ALL">Sort by</MenuItem>
        <MenuItem value="A-TO-Z">A - Z</MenuItem>
        <MenuItem value="Z-TO-A">Z - A</MenuItem>
        <MenuItem value="BOARD-OLDEST-FIRST">Oldest first</MenuItem>
        <MenuItem value="BOARD-NEWEST-FIRST">Newest first</MenuItem>
        <MenuItem value="COLORS">Colors</MenuItem>
      </Select>
    </div>
  );
}

DashboardSort.propTypes = {};

export default DashboardSort;
