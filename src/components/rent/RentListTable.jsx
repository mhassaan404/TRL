// src/components/rent/RentListTable.jsx
import React, { useEffect, useRef } from 'react'
import { flexRender } from '@tanstack/react-table'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'
import { CFormCheck, CButton } from '@coreui/react'
import { fmt } from '../../utils/rentUtils'
import { TablePagination, tablePageProps } from '../common/TablePagination'

const RentListTable = ({ table, selectedIds, setSelectedIds, expandedRows, toggleExpand }) => {
  const isDark = useIsDarkMode()
  const columnsLength = table.getHeaderGroups()[0]?.headers.length || 1

  const selectAllRef = useRef(null)
  // Select-all covers every invoice matching the search (all pages), not only the page shown
  const rows = table.getPrePaginationRowModel().rows
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.original.invoiceId))
  const someSelected = selectedIds.length > 0 && !allSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  return (
    <>
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

              {/* Select All Checkbox */}
              <th className="text-center" style={{ width: '50px' }}>
                <CFormCheck
                  ref={selectAllRef}
                  checked={allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = rows.map((row) => row.original.invoiceId)
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
                                <strong>Paid:</strong> {fmt(row.original.paidAmount)}
                              </li>
                              <li>
                                <strong>Remaining:</strong> {fmt(row.original.remainingAmount)}
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
    <TablePagination {...tablePageProps(table)} />
    </>
  )
}

export default RentListTable
