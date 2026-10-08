import React from 'react'
import authService from '../../services/auth.service'
import { CAvatar, CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { cilAccountLogout } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const AppHeaderDropdown = () => {
  // Initials of the signed-in user (saved at login) instead of a picture
  const username = authService.getCurrentUser()?.username || ''
  const initials = username.slice(0, 2).toUpperCase() || '?'

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar color="primary" textColor="white" size="md" title={username}>
          {initials}
        </CAvatar>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownItem
          style={{ cursor: 'pointer' }}
          onClick={() => authService.logout()}
        >
          <CIcon icon={cilAccountLogout} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
