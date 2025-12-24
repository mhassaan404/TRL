// // src/components/rent/RentTable.jsx
// import React from "react";
// import { CButton } from "@coreui/react";
// import { flexRender } from "@tanstack/react-table";

// const RentTable = ({ table, expandedRows, toggleExpand, handleEdit, handleDelete }) => {
//   const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1;

//   return (
//     <table className="table table-bordered table-striped">
//       <thead>
//         {table.getHeaderGroups().map(hg => (
//           <tr key={hg.id}>
//             {hg.headers.map(header => (
//               <th key={header.id} onClick={header.column.getToggleSortingHandler ? header.column.getToggleSortingHandler() : undefined}>
//                 {flexRender(header.column.columnDef.header, header.getContext())}
//                 {header.column.getIsSorted ? (header.column.getIsSorted() ? (header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽") : null) : null}
//               </th>
//             ))}
//           </tr>
//         ))}
//       </thead>
//       <tbody>
//         {table.getRowModel().rows.map(row => (
//           <React.Fragment key={row.original.Id}>
//             <tr>
//               {row.getVisibleCells().map(cell => (
//                 <td key={cell.id}>
//                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                 </td>
//               ))}
//             </tr>
//             {expandedRows[row.original.Id] && (
//               <tr>
//                 <td colSpan={columnsLength}>
//                   <div><strong>Tenant:</strong> {row.original.TenantName}</div>
//                   <div><strong>Building:</strong> {row.original.BuildingName}</div>
//                   <div><strong>Unit:</strong> {row.original.UnitNumber}</div>
//                   <div><strong>Monthly Rent:</strong> {row.original.MonthlyRent}</div>
//                 </td>
//               </tr>
//             )}
//           </React.Fragment>
//         ))}
//         {table.getRowModel().rows.length === 0 && (
//           <tr><td colSpan={columnsLength} className="text-center">No records found.</td></tr>
//         )}
//       </tbody>
//     </table>
//   );
// };

// export default RentTable;




// src/components/rent/RentTable.jsx
import React from "react";
import { CButton } from "@coreui/react";
import { flexRender } from "@tanstack/react-table";

const RentTable = ({ table, expandedRows, toggleExpand, handleEdit, handleDelete }) => {
    const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1;

    return (
        <table className="table table-bordered table-striped">
            <thead>
                {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                        {hg.headers.map((header) => (
                            <th
                                key={header.id}
                                onClick={
                                    header.column.getToggleSortingHandler
                                        ? header.column.getToggleSortingHandler()
                                        : undefined
                                }
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
                        <td colSpan={columnsLength + 1} className="text-center">
                            No records found.
                        </td>
                    </tr>
                )}

                {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.original.InvoiceId}>
                        <tr>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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
                        {expandedRows[row.original.InvoiceId] ? (
                            <tr>
                                <td colSpan={columnsLength + 1}>
                                    <div>
                                        <strong>Tenant:</strong> {row.original.TenantName}
                                    </div>
                                    <div>
                                        <strong>Building:</strong> {row.original.BuildingName}
                                    </div>
                                    <div>
                                        <strong>Unit:</strong> {row.original.UnitNumber}
                                    </div>
                                    <div>
                                        <strong>Monthly Rent:</strong> {row.original.MonthlyRent}
                                    </div>
                                </td>
                            </tr>
                        ) : null}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};

export default RentTable;
