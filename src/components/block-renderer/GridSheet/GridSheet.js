import React, { useCallback, useEffect, useState } from "react";
import DataGrid, { TextEditor } from "react-data-grid";
import { Select, MenuItem, IconButton, Box } from "@material-ui/core";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import { read, utils, writeFile } from "xlsx";
import { ReactComponent as InsertRowIcon } from "../../../assets/images/insert-row-below.svg";
import { ReactComponent as InsertColumnIcon } from "../../../assets/images/insert-row-right.svg";
import Stack from "../../Stack";
import { getCorsProxyForUrl } from "../../../utils";

function getRowsCols(workBook) {
  const rows = utils.sheet_to_json(workBook, { header: 1 });
  let columns = [];

  rows.forEach((row) => {
    const keys = Object.keys(row);

    if (keys.length > columns.length) {
      columns = keys.map((key) => {
        return { key, name: utils.encode_col(+key), editor: TextEditor };
      });
    }
  });

  return { rows, columns };
}

const getCurrentWorkBook = (rows, columns) =>
  utils.json_to_sheet(rows, {
    header: columns.map((col) => col.key),
    skipHeader: true,
  });

export default function App({ csvPath }) {
  const url = getCorsProxyForUrl(new URL(csvPath, window.location.origin));
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [workBook, setWorkBook] = useState({});
  const [sheets, setSheets] = useState([]);
  const [current, setCurrent] = useState("none");
  const [gridPosition, setGridPosition] = useState(null);

  const selectSheet = useCallback(
    (name) => {
      const { rows: newRows, columns: newColumns } = getRowsCols(
        workBook[name]
      );

      setRows(newRows);
      setColumns(newColumns);
      setCurrent(name);
    },
    [workBook]
  );

  useEffect(() => {
    const getWorkBook = async () => {
      const buffer = await fetch(url).then((resp) => resp.arrayBuffer());
      const uiArr = new Uint8Array(buffer);
      const arr = [];
      for (let i = 0; i !== uiArr.length; i += 1)
        arr[i] = String.fromCharCode(uiArr[i]);
      const bstr = arr.join("");
      const data = read(bstr, { type: "binary" });
      setWorkBook(data.Sheets);
      setSheets(data.SheetNames);
    };

    if (url) {
      getWorkBook();
    }
  }, [url]);

  useEffect(() => {
    if (sheets.length > 0) {
      selectSheet(sheets[0]);
    }
  }, [sheets, selectSheet]);

  const handleChangeRows = (rowsChanged) => {
    setRows(rowsChanged);
    workBook[current] = utils.json_to_sheet(rowsChanged, {
      header: columns.map((col) => col.key),
      skipHeader: true,
    });
    setWorkBook({ ...workBook });
  };

  const saveFile = () => {
    const wb = utils.book_new();

    sheets.forEach((n) => {
      utils.book_append_sheet(wb, workBook[n], n);
    });

    writeFile(wb, "sheet.csv");
  };

  const handleAddRow = () => {
    let newRows = rows;
    if (gridPosition) {
      rows.splice(gridPosition[0], 0, []);
    } else {
      rows.push([]);
    }

    const currentWorkBook = getCurrentWorkBook(newRows, columns);
    newRows = getRowsCols(currentWorkBook).rows;
    setRows([...newRows]);
  };

  const handleAddColumn = useCallback(() => {
    let newColumns = columns;
    const newColumKey = `${+newColumns[newColumns.length - 1].key + 1}`;
    if (gridPosition) {
      newColumns.splice(gridPosition[1], 0, {
        key: newColumKey,
        name: utils.encode_col(newColumKey),
        editor: TextEditor,
      });
    } else {
      newColumns.push({
        key: newColumKey,
        name: utils.encode_col(newColumKey),
        editor: TextEditor,
      });
    }

    let newRows = rows.map((row) => {
      if (gridPosition) {
        row.splice(gridPosition[1], 0, "");
      } else {
        row.push("");
      }

      return row;
    });

    const currentWorkBook = getCurrentWorkBook(newRows, newColumns);
    newRows = getRowsCols(currentWorkBook).rows;
    newColumns = getRowsCols(currentWorkBook).columns;

    setRows([...newRows]);
    setColumns([...newColumns]);
  }, [columns, setColumns, gridPosition, rows]);

  return (
    <Stack>
      <Box
        justifyContent="space-between"
        display="flex"
        alignItems="center"
        py={1}
      >
        <Select
          variant="outlined"
          value={current}
          onChange={(e) => selectSheet(e.target.value)}
          margin="none"
          style={{ height: 40 }}
        >
          <MenuItem value="none" disabled>
            NONE
          </MenuItem>
          {sheets.map((sheetName) => (
            <MenuItem value={sheetName} key={sheetName}>
              {sheetName}
            </MenuItem>
          ))}
        </Select>
        <Stack direction="row" alignItems="center">
          <IconButton>
            <InsertRowIcon
              width={24}
              height={24}
              style={{ fill: "currentcolor" }}
              onClick={handleAddRow}
            />
          </IconButton>
          <IconButton>
            <InsertColumnIcon
              width={24}
              height={24}
              onClick={handleAddColumn}
              style={{ fill: "currentcolor" }}
            />
          </IconButton>
          <IconButton onClick={saveFile}>
            <GetAppOutlinedIcon />
          </IconButton>
        </Stack>
      </Box>
      {current !== "none" && (
        <DataGrid
          className="rdg-light"
          style={{ height: "100%" }}
          columns={columns}
          rows={rows}
          onRowsChange={handleChangeRows}
          onRowClick={(row, column) => {
            const idx = rows.indexOf(row);
            if (idx === -1) {
              setGridPosition(null);
            } else {
              setGridPosition([idx, column.idx]);
            }
          }}
        />
      )}
    </Stack>
  );
}
