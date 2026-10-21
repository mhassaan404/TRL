import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CFormText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { usersService } from '../../services/users.service'
import { ACTIONS, PAGES, editOf, viewOf } from '../../permissions'
import { PASSWORD_HINT } from '../../utils/passwordPolicy'
import { formatDate } from '../../utils/rentUtils'

// Users (Super Admin only): add staff users, tick the pages each one can open (view or edit) and the risky actions
// they may do, switch users off, reset forgotten passwords. The Super Admin always has everything. Users are never
// deleted (their name stays on what they recorded): switch them off instead.

const GROUPS = [...new Set(PAGES.map((p) => p.group))]

// Stored permissions -> { page: 'none' | 'view' | 'edit' } and the ticked actions
const toForm = (permissions = []) => ({
  levels: Object.fromEntries(
    PAGES.map((p) => [
      p.key,
      permissions.includes(editOf(p.key))
        ? 'edit'
        : permissions.includes(viewOf(p.key))
          ? 'view'
          : 'none',
    ]),
  ),
  actions: ACTIONS.filter((a) => permissions.includes(a.key)).map((a) => a.key),
})

const toPermissions = ({ levels, actions }) => [
  ...PAGES.filter((p) => levels[p.key] !== 'none').map((p) =>
    levels[p.key] === 'edit' ? editOf(p.key) : viewOf(p.key),
  ),
  ...actions,
]

const summary = (u) => {
  if (u.isSuperAdmin) return 'Everything'
  const pages = PAGES.filter(
    (p) => u.permissions.includes(viewOf(p.key)) || u.permissions.includes(editOf(p.key)),
  ).length
  const actions = ACTIONS.filter((a) => u.permissions.includes(a.key)).length
  if (!pages) return 'No pages yet'
  return `${pages} page${pages === 1 ? '' : 's'}${actions ? `, ${actions} special action${actions === 1 ? '' : 's'}` : ''}`
}

const EMPTY = {
  userId: null,
  username: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  isActive: true,
  ...toForm([]),
}

const PermissionPicker = ({ form, setForm }) => {
  const setLevel = (key, level) => setForm((f) => ({ ...f, levels: { ...f.levels, [key]: level } }))
  const setAll = (level) =>
    setForm((f) => ({
      ...f,
      levels: Object.fromEntries(
        PAGES.map((p) => [p.key, level === 'edit' && !p.edit ? 'view' : level]),
      ),
    }))
  const toggleAction = (key) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.includes(key) ? f.actions.filter((a) => a !== key) : [...f.actions, key],
    }))

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <strong className="me-auto">Pages</strong>
        <CButton size="sm" color="secondary" variant="outline" onClick={() => setAll('view')}>
          View all
        </CButton>
        <CButton size="sm" color="secondary" variant="outline" onClick={() => setAll('edit')}>
          Edit all
        </CButton>
        <CButton size="sm" color="secondary" variant="outline" onClick={() => setAll('none')}>
          Clear
        </CButton>
      </div>
      <CTable small bordered responsive className="mb-3 align-middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Page</CTableHeaderCell>
            <CTableHeaderCell className="text-center">No access</CTableHeaderCell>
            <CTableHeaderCell className="text-center">View</CTableHeaderCell>
            <CTableHeaderCell className="text-center">Edit</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {GROUPS.map((g) => (
            <React.Fragment key={g}>
              <CTableRow>
                <CTableDataCell colSpan={4} className="bg-body-tertiary small fw-semibold">
                  {g}
                </CTableDataCell>
              </CTableRow>
              {PAGES.filter((p) => p.group === g).map((p) => (
                <CTableRow key={p.key}>
                  <CTableDataCell>{p.label}</CTableDataCell>
                  {['none', 'view', 'edit'].map((level) => (
                    <CTableDataCell key={level} className="text-center">
                      {level === 'edit' && !p.edit ? (
                        <span className="text-body-secondary small">—</span>
                      ) : (
                        <CFormCheck
                          type="radio"
                          name={`lvl-${p.key}`}
                          id={`lvl-${p.key}-${level}`}
                          aria-label={`${p.label}: ${level}`}
                          checked={form.levels[p.key] === level}
                          onChange={() => setLevel(p.key, level)}
                        />
                      )}
                    </CTableDataCell>
                  ))}
                </CTableRow>
              ))}
            </React.Fragment>
          ))}
        </CTableBody>
      </CTable>

      <strong>Special actions</strong>
      <div className="small text-body-secondary mb-2">
        Risky actions inside pages. Each also needs Edit on its page.
      </div>
      {ACTIONS.map((a) => (
        <CFormCheck
          key={a.key}
          id={`act-${a.key}`}
          checked={form.actions.includes(a.key)}
          onChange={() => toggleAction(a.key)}
          label={
            <>
              {a.label} <span className="text-body-secondary small">({a.hint})</span>
            </>
          }
        />
      ))}
    </>
  )
}

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null) // add / edit modal
  const [reset, setReset] = useState(null) // reset password modal
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await usersService.getAll())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const isNew = form && !form.userId
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const permissions = toPermissions(form)
      const res = isNew
        ? await usersService.create({ ...form, permissions })
        : await usersService.update({ ...form, permissions })
      toast.success(res?.message || 'Saved')
      setForm(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    setSaving(true)
    try {
      const res = await usersService.resetPassword(reset)
      toast.success(res?.message || 'Password changed')
      setReset(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sorted = useMemo(
    () => [...users].sort((a, b) => b.isSuperAdmin - a.isSuperAdmin || b.isActive - a.isActive),
    [users],
  )

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex flex-wrap align-items-center gap-2">
        <strong className="me-auto">Users</strong>
        <CButton color="primary" onClick={() => setForm({ ...EMPTY })}>
          Add user
        </CButton>
      </CCardHeader>
      <CCardBody>
        <p className="text-body-secondary small">
          Staff users see only the pages you tick for them. The Super Admin always has everything.
          Changes apply to a user&apos;s next click; switching a user off signs them out at once.
        </p>
        {error && <CAlert color="danger">{error}</CAlert>}
        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" size="sm" /> Loading…
          </div>
        ) : (
          <CTable hover responsive className="align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Username</CTableHeaderCell>
                <CTableHeaderCell>Contact</CTableHeaderCell>
                <CTableHeaderCell>Access</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {sorted.map((u) => (
                <CTableRow key={u.userId}>
                  <CTableDataCell>
                    {u.fullName || '—'}
                    {u.createdAt && (
                      <div className="small text-body-secondary">
                        Added {formatDate(u.createdAt)}
                      </div>
                    )}
                  </CTableDataCell>
                  <CTableDataCell>{u.username}</CTableDataCell>
                  <CTableDataCell className="small">
                    {[u.email, u.phone].filter(Boolean).join(' · ') || '—'}
                  </CTableDataCell>
                  <CTableDataCell>
                    {u.isSuperAdmin ? <CBadge color="primary">Super Admin</CBadge> : summary(u)}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={u.isActive ? 'success' : 'secondary'}>
                      {u.isActive ? 'Active' : 'Off'}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell className="text-end text-nowrap">
                    {u.isSuperAdmin ? (
                      <span className="small text-body-secondary">Can&apos;t be changed</span>
                    ) : (
                      <>
                        <CButton
                          size="sm"
                          color="primary"
                          variant="outline"
                          className="me-2"
                          onClick={() =>
                            setForm({
                              ...EMPTY,
                              userId: u.userId,
                              username: u.username,
                              fullName: u.fullName || '',
                              email: u.email || '',
                              phone: u.phone || '',
                              isActive: u.isActive,
                              ...toForm(u.permissions),
                            })
                          }
                        >
                          Edit
                        </CButton>
                        <CButton
                          size="sm"
                          color="secondary"
                          variant="outline"
                          onClick={() =>
                            setReset({
                              userId: u.userId,
                              username: u.username,
                              newPassword: '',
                              confirmPassword: '',
                            })
                          }
                        >
                          Reset password
                        </CButton>
                      </>
                    )}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>

      <CModal visible={!!form} onClose={() => !saving && setForm(null)} size="lg" backdrop="static">
        <CModalHeader>
          <CModalTitle>{isNew ? 'Add user' : `Edit user: ${form?.username}`}</CModalTitle>
        </CModalHeader>
        {form && (
          <CModalBody>
            <CRow className="g-3 mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="u-name">Name *</CFormLabel>
                <CFormInput
                  id="u-name"
                  value={form.fullName}
                  onChange={set('fullName')}
                  maxLength={100}
                />
              </CCol>
              {isNew && (
                <CCol md={6}>
                  <CFormLabel htmlFor="u-username">Username *</CFormLabel>
                  <CFormInput
                    id="u-username"
                    value={form.username}
                    onChange={set('username')}
                    maxLength={50}
                    autoComplete="off"
                  />
                  <CFormText>
                    Used to log in, with your company code. Can&apos;t be changed later.
                  </CFormText>
                </CCol>
              )}
              <CCol md={6}>
                <CFormLabel htmlFor="u-email">Email</CFormLabel>
                <CFormInput
                  id="u-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  maxLength={100}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="u-phone">Phone</CFormLabel>
                <CFormInput
                  id="u-phone"
                  value={form.phone}
                  onChange={set('phone')}
                  maxLength={20}
                />
              </CCol>
              {isNew ? (
                <>
                  <CCol md={6}>
                    <CFormLabel htmlFor="u-pass">Password *</CFormLabel>
                    <CFormInput
                      id="u-pass"
                      type="password"
                      value={form.password}
                      onChange={set('password')}
                      autoComplete="new-password"
                    />
                    <CFormText>{PASSWORD_HINT}</CFormText>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="u-pass2">Confirm password *</CFormLabel>
                    <CFormInput
                      id="u-pass2"
                      type="password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      autoComplete="new-password"
                    />
                  </CCol>
                </>
              ) : (
                <CCol xs={12}>
                  <CFormSwitch
                    id="u-active"
                    label={form.isActive ? 'Active (can log in)' : 'Off (can’t log in)'}
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                </CCol>
              )}
            </CRow>
            <PermissionPicker form={form} setForm={setForm} />
          </CModalBody>
        )}
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setForm(null)}
            disabled={saving}
          >
            Cancel
          </CButton>
          <CButton color="primary" onClick={save} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : isNew ? 'Add user' : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!reset} onClose={() => !saving && setReset(null)} backdrop="static">
        <CModalHeader>
          <CModalTitle>Reset password: {reset?.username}</CModalTitle>
        </CModalHeader>
        {reset && (
          <CModalBody>
            <CFormLabel htmlFor="r-pass">New password</CFormLabel>
            <CFormInput
              id="r-pass"
              type="password"
              value={reset.newPassword}
              onChange={(e) => setReset((r) => ({ ...r, newPassword: e.target.value }))}
              autoComplete="new-password"
            />
            <CFormText>{PASSWORD_HINT}</CFormText>
            <CFormLabel htmlFor="r-pass2" className="mt-3">
              Confirm new password
            </CFormLabel>
            <CFormInput
              id="r-pass2"
              type="password"
              value={reset.confirmPassword}
              onChange={(e) => setReset((r) => ({ ...r, confirmPassword: e.target.value }))}
              autoComplete="new-password"
            />
            <CFormText>They will be signed out and must log in with the new password.</CFormText>
          </CModalBody>
        )}
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setReset(null)}
            disabled={saving}
          >
            Cancel
          </CButton>
          <CButton color="primary" onClick={savePassword} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Change password'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default Users
