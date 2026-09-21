import React, { useEffect, useState } from 'react'
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton, CFormInput } from '@coreui/react'
import { toast } from 'react-toastify'
import { rentService } from '../../services/rent.service'

const ManageTenantRentModal = ({ visible, onClose, isDark }) => {
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [edits, setEdits] = useState({})

  useEffect(() => {
    if (visible) {
      rentService.getTenantsWithRent().then((data) => {
        setTenants(data)
        setEdits({})
      })
    }
  }, [visible])

  const handleSave = async (tenantId) => {
    const newRent = Number(edits[tenantId])
    if (!newRent || newRent <= 0) {
      toast.error('Enter a valid rent amount')
      return
    }
    setSavingId(tenantId)
    try {
      await rentService.updateTenantMonthlyRent(tenantId, newRent)
      toast.success('Monthly rent updated')
      setTenants((prev) => prev.map((t) => (t.tenantId === tenantId ? { ...t, monthlyRent: newRent } : t)))
    } catch {
      toast.error('Failed to update rent')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = tenants.filter((t) => (t.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static" scrollable>
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>Manage Monthly Rent</strong>
      </CModalHeader>
      <CModalBody>
        <CFormInput
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        {filtered.map((t) => (
          <div key={t.tenantId} className="d-flex align-items-center gap-2 mb-2">
            <div className="flex-grow-1">{t.name}</div>
            <CFormInput
              type="number"
              size="sm"
              style={{ width: '140px' }}
              placeholder={String(t.monthlyRent)}
              value={edits[t.tenantId] ?? ''}
              onChange={(e) => setEdits((prev) => ({ ...prev, [t.tenantId]: e.target.value }))}
            />
            <CButton
              size="sm"
              color="primary"
              disabled={savingId === t.tenantId || !edits[t.tenantId]}
              onClick={() => handleSave(t.tenantId)}
            >
              {savingId === t.tenantId ? 'Saving...' : 'Save'}
            </CButton>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-muted text-center py-3">No tenants found.</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Close</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ManageTenantRentModal