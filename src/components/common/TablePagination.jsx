// src/components/common/TablePagination.jsx
import React from 'react'
import PropTypes from 'prop-types'
import { CButton } from '@coreui/react'

// One pagination style for every list page (the pattern from Tenants / Property Dashboard):
//   top-left:     Show [5|10|20|50] entries
//   bottom-left:  Showing X to Y of N entries
//   bottom-right: Previous  1 2 3 …  Next   (current page highlighted)
export const PAGE_SIZES = [5, 10, 20, 50]
export const DEFAULT_PAGE_SIZE = 10

export const PageSizeSelect = ({ pageSize, onChange }) => (
  <div className="d-flex align-items-center gap-2 flex-wrap">
    <span>Show</span>
    <select
      className="form-select form-select-sm"
      style={{ maxWidth: '70px' }}
      value={pageSize}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {PAGE_SIZES.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
    <span>entries</span>
  </div>
)

PageSizeSelect.propTypes = {
  pageSize: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
}

// Page numbers to show: all of them up to 7 pages, otherwise first, last and the pages around the current one
const pageNumbers = (pageIndex, pageCount) => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i)
  const pages = new Set([0, pageCount - 1, pageIndex - 1, pageIndex, pageIndex + 1])
  const list = [...pages].filter((p) => p >= 0 && p < pageCount).sort((a, b) => a - b)
  return list.flatMap((p, i) => (i > 0 && p - list[i - 1] > 1 ? ['gap' + p, p] : [p]))
}

export const TablePagination = ({ pageIndex, pageSize, total, onPageChange }) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
      <div>
        Showing {from} to {to} of {total} entries
      </div>
      <div className="d-flex gap-1 flex-wrap">
        <CButton color="secondary" size="sm" onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex <= 0}>
          Previous
        </CButton>
        {pageNumbers(pageIndex, pageCount).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 align-self-center">
              …
            </span>
          ) : (
            <CButton
              key={p}
              color={p === pageIndex ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </CButton>
          ),
        )}
        <CButton
          color="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
        >
          Next
        </CButton>
      </div>
    </div>
  )
}

TablePagination.propTypes = {
  pageIndex: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
}

// Props for a TanStack table: totals count the rows left after filters/search, before paging
export const tablePageProps = (table) => ({
  pageIndex: table.getState().pagination.pageIndex,
  pageSize: table.getState().pagination.pageSize,
  total: table.getPrePaginationRowModel().rows.length,
  onPageChange: (i) => table.setPageIndex(i),
})

export const tablePageSizeProps = (table) => ({
  pageSize: table.getState().pagination.pageSize,
  onChange: (size) => table.setPageSize(size),
})
