// src/components/rent/RentListTable.jsx
import React from "react";
import { CButton } from "@coreui/react";
import { flexRender } from "@tanstack/react-table";

const RentListTable = ({ table, handleEdit, handleDelete }) => {
  const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1;

  return (
    <table className="table table-bordered table-striped">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((header) => (
              <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() ? header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽" : null}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length === 0 && (
          <tr>
            <td colSpan={columnsLength + 1} className="text-center">
              No records found.
            </td>
          </tr>
        )}
        {table.getRowModel().rows.map((row) => (
          <tr key={row.original.invoiceId}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
            <td>
              <CButton size="sm" color="info" onClick={() => handleEdit(row.original)}>
                Update
              </CButton>{" "}
              <CButton size="sm" color="danger" onClick={() => handleDelete(row.original)}>
                Delete
              </CButton>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default RentListTable;