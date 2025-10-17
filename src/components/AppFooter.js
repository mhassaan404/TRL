import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        {/* <span className="ms-1">&copy; 2025 Building Management System</span> */}
      </div>
      <div className="ms-auto">
        <span className="me-1">Powered by CoreUi</span>
        {/* <a href="https://coreui.io/react" target="_blank" rel="noopener noreferrer">
          The Rent Ledger
        </a> */}
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
