// // src/components/rent/RentListTable.jsx
// import React from 'react'
// import { CButton } from '@coreui/react'
// import { flexRender } from '@tanstack/react-table'

// const RentListTable = ({ table, handleEdit, handleDelete }) => {
//   const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1

//   return (
//     <div
//       className="table-responsive"
//       style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '8px' }}
//     >
//       <table className="table table-bordered table-hover">
//         <thead>
//           {table.getHeaderGroups().map((hg) => (
//             <tr key={hg.id}>
//               {hg.headers.map((header) => (
//                 <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
//                   {flexRender(header.column.columnDef.header, header.getContext())}
//                   {header.column.getIsSorted()
//                     ? header.column.getIsSorted() === 'asc'
//                       ? ' 🔼'
//                       : ' 🔽'
//                     : null}
//                 </th>
//               ))}
//               <th>Actions</th>
//             </tr>
//           ))}
//         </thead>
//         <tbody>
//           {table.getRowModel().rows.length === 0 && (
//             <tr>
//               <td colSpan={columnsLength + 1} className="text-center">
//                 No records found.
//               </td>
//             </tr>
//           )}
//           {table.getRowModel().rows.map((row) => (
//             <tr key={row.original.invoiceId}>
//               {row.getVisibleCells().map((cell) => (
//                 <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
//               ))}
//               <td>
//                 <CButton size="sm" color="info" onClick={() => handleEdit(row.original)}>
//                   Update
//                 </CButton>{' '}
//                 <CButton size="sm" color="danger" onClick={() => handleDelete(row.original)}>
//                   Delete
//                 </CButton>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// export default RentListTable

// src/components/rent/RentListTable.jsx
// import React from 'react'
// import { flexRender } from '@tanstack/react-table'
// import { useIsDarkMode } from '../../hooks/useIsDarkMode'
// import { CFormCheck } from '@coreui/react'

// const RentListTable = ({ table, selectedIds, setSelectedIds }) => {
//   const isDark = useIsDarkMode()
//   const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1

//   return (
//     <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
//       <table className="table table-bordered table-hover mb-0">
//         <thead
//           className={`position-sticky top-0 ${isDark ? 'bg-[#3e4655] text-white' : 'table-light text-dark'}`}
//         >
//           {table.getHeaderGroups().map((headerGroup) => (
//             <tr key={headerGroup.id}>
//               {/* Select All Checkbox */}
//               <th className="text-center" style={{ width: '50px' }}>
//                 <CFormCheck
//                   checked={
//                     table.getRowModel().rows.length > 0 &&
//                     table.getRowModel().rows.every((row) => selectedIds.includes(row.original.invoiceId))
//                   }
//                   indeterminate={
//                     selectedIds.length > 0 && selectedIds.length < table.getRowModel().rows.length
//                   }
//                   onChange={(e) => {
//                     const checked = e.target.checked
//                     if (checked) {
//                       // Select ALL
//                       const allIds = table.getRowModel().rows.map((row) => row.original.invoiceId)
//                       setSelectedIds(allIds)
//                     } else {
//                       // Uncheck ALL
//                       setSelectedIds([])
//                     }
//                   }}
//                 />
//               </th>

//               {/* Other headers */}
//               {headerGroup.headers.map((header) => (
//                 <th
//                   key={header.id}
//                   onClick={header.column.getToggleSortingHandler()}
//                   style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
//                   className="text-center" // change to text-end for numeric columns if needed
//                 >
//                   {flexRender(header.column.columnDef.header, header.getContext())}
//                   {header.column.getIsSorted()
//                     ? header.column.getIsSorted() === 'asc'
//                       ? ' 🔼'
//                       : ' 🔽'
//                     : null}
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>

//         <tbody>
//           {table.getRowModel().rows.length === 0 ? (
//             <tr>
//               <td colSpan={columnsLength + 1} className="text-center py-4 text-muted">
//                 No records found.
//               </td>
//             </tr>
//           ) : (
//             table.getRowModel().rows.map((row) => {
//               const rowId = row.original.invoiceId
//               const isSelected = selectedIds.includes(rowId)

//               return (
//                 <tr key={row.id}>
//                   <td className="text-center" style={{ width: '50px' }}>
//                     <CFormCheck
//                       checked={isSelected}
//                       onChange={(e) => {
//                         setSelectedIds((prev) => {
//                           if (e.target.checked) {
//                             return [...prev, rowId]
//                           } else {
//                             return prev.filter((id) => id !== rowId)
//                           }
//                         })
//                       }}
//                     />
//                   </td>

//                   {/* Other cells */}
//                   {row.getVisibleCells().map((cell) => (
//                     <td key={cell.id}>
//                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     </td>
//                   ))}
//                 </tr>
//               )
//             })
//           )}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// export default RentListTable

// src/components/rent/RentListTable.jsx
import React from 'react'
import { flexRender } from '@tanstack/react-table'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'
import { CFormCheck, CButton } from '@coreui/react'

const RentListTable = ({ table, selectedIds, setSelectedIds, expandedRows, toggleExpand }) => {
  const isDark = useIsDarkMode()
  const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1

  return (
    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table-hover mb-0">
        <thead
          // className={`position-sticky top-0 ${isDark ? 'bg-[#3e4655] text-white' : 'table-light text-dark'}`}
          className={`position-sticky top-0 table-head-dark`}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {/* Expand Header */}
              <th className="text-center" style={{ width: '50px' }}></th>

              {/* Select All Checkbox */}
              <th className="text-center" style={{ width: '50px' }}>
                <CFormCheck
                  checked={
                    table.getRowModel().rows.length > 0 &&
                    table
                      .getRowModel()
                      .rows.every((row) => selectedIds.includes(row.original.invoiceId))
                  }
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < table.getRowModel().rows.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = table.getRowModel().rows.map((row) => row.original.invoiceId)
                      setSelectedIds(allIds)
                    } else {
                      setSelectedIds([])
                    }
                  }}
                />
              </th>

              {/* Other headers */}
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  className="text-center" // change to text-end for numeric columns if needed
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted()
                    ? header.column.getIsSorted() === 'asc'
                      ? ' 🔼'
                      : ' 🔽'
                    : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columnsLength + 2} className="text-center py-4 text-muted">
                No records found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const rowId = row.original.invoiceId
              const isSelected = selectedIds.includes(rowId)
              const isExpanded = expandedRows[rowId]

              return (
                <React.Fragment key={row.id}>
                  <tr>
                    {/* Expand Button */}
                    <td className="text-center" style={{ width: '50px' }}>
                      <CButton
                        color="secondary"
                        size="sm"
                        // variant="ghost"
                        onClick={() => toggleExpand(rowId)}
                      >
                        {isExpanded ? '−' : '+'}
                      </CButton>
                    </td>

                    {/* Row Checkbox */}
                    <td className="text-center" style={{ width: '50px' }}>
                      <CFormCheck
                        checked={isSelected}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            if (e.target.checked) {
                              return [...prev, rowId]
                            } else {
                              return prev.filter((id) => id !== rowId)
                            }
                          })
                        }}
                      />
                    </td>

                    {/* Other cells */}
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={columnsLength + 2} className="p-3 bg-dark-subtle">
                        <div className="row">
                          <div className="col-12">
                            <ul className="list-unstyled mt-2">
                              <li>
                                <strong>Paid:</strong> {row.original.paidAmount || '0'}
                              </li>
                              <li>
                                <strong>Remaining:</strong> {row.original.remainingAmount || '0'}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default RentListTable
