import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CButton, CSpinner } from '@coreui/react'

// Page frame for printable documents (receipts, invoices): opened in its own tab, outside the app layout.
// Always light (paper) colours, a toolbar that never prints, and one A4 sheet per document (.print-sheet).
const PrintShell = ({ title, loading, error, children }) => {
  useEffect(() => {
    if (title) document.title = title
  }, [title])

  return (
    <div className="print-root" data-coreui-theme="light">
      <div className="print-toolbar no-print">
        <div className="fw-semibold text-truncate">{title}</div>
        <div className="d-flex gap-2">
          <CButton color="primary" size="sm" disabled={loading || !!error} onClick={() => window.print()}>
            Print
          </CButton>
          <CButton color="secondary" variant="outline" size="sm" onClick={() => window.close()}>
            Close
          </CButton>
        </div>
      </div>
      {loading && (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      )}
      {!loading && error && (
        <div className="print-sheet">
          <CAlert color="danger" className="mb-0">{error}</CAlert>
        </div>
      )}
      {!loading && !error && children}
    </div>
  )
}

PrintShell.propTypes = {
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node,
}

export default PrintShell
