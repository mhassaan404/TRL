import React from 'react'
import PropTypes from 'prop-types'
import authService from '../../services/auth.service'
import { useCompanyProfile } from '../../hooks/useCompanyProfile'

// Company letterhead for printed documents: logo, name, address and contact details from the Company Profile.
// printOnly: hidden on screen, shown when printing (reports); otherwise always shown (statements, receipts).
// profile: show these details instead of the saved profile (the Company Profile page's live preview).
const CompanyHeader = ({ title, subtitle, printOnly = false, profile: preview }) => {
  const saved = useCompanyProfile()
  const profile = preview || saved
  const name = profile?.companyName || authService.getCurrentUser()?.clientName || ''
  const contacts = [
    profile?.phone && `Phone: ${profile.phone}`,
    profile?.email && `Email: ${profile.email}`,
    profile?.website,
    profile?.ntn && `NTN: ${profile.ntn}`,
  ].filter(Boolean)

  return (
    <div className={`${printOnly ? 'd-none d-print-block ' : ''}company-header border-bottom pb-2 mb-3`}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div className="d-flex align-items-center gap-3">
          {profile?.logoDataUrl && (
            <img src={profile.logoDataUrl} alt="" style={{ maxHeight: 64, maxWidth: 160, objectFit: 'contain' }} />
          )}
          <div>
            {name && <div className="fw-bold fs-5">{name}</div>}
            {profile?.address && <div className="small text-body-secondary" style={{ whiteSpace: 'pre-line' }}>{profile.address}</div>}
          </div>
        </div>
        {contacts.length > 0 && (
          <div className="small text-body-secondary text-end">
            {contacts.map((c) => <div key={c}>{c}</div>)}
          </div>
        )}
      </div>
      {(title || subtitle) && (
        <div className="mt-2">
          {title && <div className="fw-semibold fs-6">{title}</div>}
          {subtitle && <div className="small text-body-secondary">{subtitle}</div>}
        </div>
      )}
    </div>
  )
}

CompanyHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  printOnly: PropTypes.bool,
  profile: PropTypes.object,
}

export default CompanyHeader
