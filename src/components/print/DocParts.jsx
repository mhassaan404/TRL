import React from 'react'
import PropTypes from 'prop-types'
import { useCompanyProfile } from '../../hooks/useCompanyProfile'

// Shared blocks for printed receipts and invoices

// "Received from" / "Bill to": the tenant's details
export const PartyBlock = ({ heading, doc }) => (
  <div className="doc-box h-100">
    <div className="doc-label">{heading}</div>
    <div className="fw-bold">{doc.tenantName}</div>
    {doc.contactPerson && <div>Attn: {doc.contactPerson}</div>}
    {doc.contact && <div>Phone: {doc.contact}</div>}
    {doc.email && <div>{doc.email}</div>}
    {doc.cnicNtn && <div>{doc.tenantType === 'Company' ? 'NTN/CNIC' : 'CNIC'}: {doc.cnicNtn}</div>}
    {doc.tenantAddress && <div className="text-pre-line">{doc.tenantAddress}</div>}
  </div>
)

PartyBlock.propTypes = { heading: PropTypes.string.isRequired, doc: PropTypes.object.isRequired }

// The rented unit and its building address
export const PropertyBlock = ({ doc, children }) => (
  <div className="doc-box h-100">
    <div className="doc-label">Property</div>
    {doc.unitNumber ? (
      <div className="fw-bold">{doc.buildingName} – Unit {doc.unitNumber}</div>
    ) : (
      <div className="fw-bold">{doc.buildingName || '—'}</div>
    )}
    {doc.floorNumber && <div>Floor {doc.floorNumber}</div>}
    {doc.buildingAddress && <div className="text-pre-line">{doc.buildingAddress}</div>}
    {children}
  </div>
)

PropertyBlock.propTypes = { doc: PropTypes.object.isRequired, children: PropTypes.node }

// Footer: the company's note, signatures and a computer-generated notice
export const DocFooter = ({ leftSignature, rightSignature }) => {
  const profile = useCompanyProfile()
  return (
    <div className="doc-footer">
      <div className="d-flex justify-content-between gap-4 mt-5">
        <div className="doc-signature">{leftSignature}</div>
        <div className="doc-signature">{rightSignature}</div>
      </div>
      {profile?.footerNote && <div className="text-center fw-semibold mt-4">{profile.footerNote}</div>}
      <div className="text-center small text-body-secondary mt-2">This is a computer-generated document.</div>
    </div>
  )
}

DocFooter.propTypes = { leftSignature: PropTypes.node, rightSignature: PropTypes.node }
