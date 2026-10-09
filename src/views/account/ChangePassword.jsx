import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert, CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormFeedback, CFormInput, CFormLabel, CFormText, CInputGroup,
  CInputGroupText, CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked } from '@coreui/icons'
import { toast } from 'react-toastify'
import authService from '../../services/auth.service'
import { PASSWORD_HINT, PASSWORD_MAX, validatePasswordChange } from '../../utils/passwordPolicy'

// Change My Password (account menu). The API has the final say on the rules and on the current password.
// After a change this browser stays signed in; every other session is signed out.
const EMPTY = { current: '', next: '', confirm: '' }

const PasswordField = ({ id, label, value, onChange, error, show, autoComplete }) => (
  <>
    <CFormLabel htmlFor={id}>{label} <span className="text-danger">*</span></CFormLabel>
    <CInputGroup className="has-validation">
      <CInputGroupText><CIcon icon={cilLockLocked} /></CInputGroupText>
      <CFormInput id={id} type={show ? 'text' : 'password'} value={value} maxLength={PASSWORD_MAX + 1}
        autoComplete={autoComplete} invalid={!!error} onChange={(e) => onChange(e.target.value)} />
      <CFormFeedback invalid>{error}</CFormFeedback>
    </CInputGroup>
  </>
)

PasswordField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  show: PropTypes.bool,
  autoComplete: PropTypes.string,
}

const ChangePassword = () => {
  const user = authService.getCurrentUser()
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState(false)
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const savingRef = useRef(false)

  const errors = validatePasswordChange(form, user?.username)
  const valid = Object.keys(errors).length === 0
  const shown = (k) => (touched ? errors[k] : undefined)
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setServerError('')
    setSuccess('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setServerError('')
    try {
      const res = await authService.changePassword({ currentPassword: form.current, newPassword: form.next, confirmPassword: form.confirm })
      setSuccess(res?.message || 'Your password has been changed.')
      toast.success('Password changed')
      setForm(EMPTY)
      setTouched(false)
      setShow(false)
    } catch (err) {
      setServerError(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={7} xl={6}>
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="py-3 px-4">
            <div className="fw-semibold fs-5">Change My Password</div>
            <div className="small text-body-secondary">
              Signed in as <b>{user?.username}</b>{user?.clientName ? ` · ${user.clientName}` : ''}
            </div>
          </CCardHeader>
          <CCardBody className="px-4">
            {success && <CAlert color="success">{success}</CAlert>}
            {serverError && <CAlert color="danger">{serverError}</CAlert>}
            <CForm onSubmit={submit} noValidate>
              <fieldset disabled={saving}>
                <div className="mb-3">
                  <PasswordField id="cp-current" label="Current Password" value={form.current} onChange={set('current')}
                    error={shown('current')} show={show} autoComplete="current-password" />
                </div>
                <div className="mb-3">
                  <PasswordField id="cp-new" label="New Password" value={form.next} onChange={set('next')}
                    error={shown('next')} show={show} autoComplete="new-password" />
                  {!shown('next') && <CFormText>{PASSWORD_HINT} It can&apos;t start or end with a space.</CFormText>}
                </div>
                <div className="mb-3">
                  <PasswordField id="cp-confirm" label="Confirm New Password" value={form.confirm} onChange={set('confirm')}
                    error={shown('confirm')} show={show} autoComplete="new-password" />
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="cp-show" checked={show} onChange={(e) => setShow(e.target.checked)} />
                  <label className="form-check-label" htmlFor="cp-show">Show passwords</label>
                </div>
                <CButton type="submit" color="primary" disabled={saving}>{saving ? 'Changing...' : 'Change Password'}</CButton>
              </fieldset>
            </CForm>
            <div className="small text-body-secondary mt-3">
              After the change you stay signed in on this device. Any other devices or browsers signed in to this account are
              signed out and need the new password.
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ChangePassword
