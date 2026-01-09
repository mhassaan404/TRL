// src/components/rent/RentTable.jsx
import React from "react";
import { CButton } from "@coreui/react";
import { flexRender } from "@tanstack/react-table";
import CIcon from '@coreui/icons-react';
import { cilPlus, cilMinus } from '@coreui/icons';
import { formatDate } from "../../utils/rentUtils";

const RentTable = ({ table, expandedRows, toggleExpand, handleEdit, handleDelete }) => {
    const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1;

    return (
        <table className="table table-bordered table-striped">
            <thead>
                {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                        <th></th>
                        {hg.headers.map((header) => (
                            <th
                                key={header.id}
                                onClick={header.column.getToggleSortingHandler ? header.column.getToggleSortingHandler() : undefined}
                            >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getIsSorted
                                    ? header.column.getIsSorted() === "asc"
                                        ? " 🔼"
                                        : " 🔽"
                                    : null}
                            </th>
                        ))}
                        <th>Actions</th>
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.length === 0 && (
                    <tr>
                        <td colSpan={columnsLength + 2} className="text-center">
                            No records found.
                        </td>
                    </tr>
                )}

                {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.original.invoiceId}>
                        <tr>
                            {/* Expand/collapse button */}
                            <td>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={() => toggleExpand(row.original.invoiceId)}
                                >
                                    <CIcon icon={expandedRows[row.original.invoiceId] ? cilMinus : cilPlus} />
                                </button>
                            </td>

                            {row.getVisibleCells().map((cell) => {
                                return (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                );
                            })}

                            <td>
                                <CButton size="sm" color="info" onClick={() => handleEdit(row.original)}>
                                    Update
                                </CButton>{" "}
                                <CButton size="sm" color="danger" onClick={() => handleDelete(row.original)}>
                                    Delete
                                </CButton>
                            </td>
                        </tr>

                        {expandedRows[row.original.invoiceId] && (
                            <tr>
                                <td colSpan={columnsLength + 2}>
                                    <div>
                                        <strong>Last Payment Date:</strong> {formatDate(row.original.paymentDate?.slice(0, 10))}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};

export default RentTable;
