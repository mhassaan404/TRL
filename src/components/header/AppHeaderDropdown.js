import React from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../../services/auth.service'
import { CAvatar, CDropdown, CDropdownDivider, CDropdownHeader, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { cilAccountLogout, cilLockLocked } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
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
        <CDropdownHeader className="bg-body-secondary fw-semibold py-2">{username}</CDropdownHeader>
        <CDropdownItem style={{ cursor: 'pointer' }} onClick={() => navigate('/account/change-password')}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Change Password
        </CDropdownItem>
        <CDropdownDivider />
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
