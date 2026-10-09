import React, { useEffect, useRef, useState } from 'react'
import {
  CAlert, CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormFeedback, CFormInput, CFormLabel, CFormText,
  CFormTextarea, CRow, CSpinner,
} from '@coreui/react'
import { toast } from 'react-toastify'
import CompanyHeader from '../../components/common/CompanyHeader'
import { companyProfileService } from '../../services/settings.service'
import { setCompanyProfileCache } from '../../hooks/useCompanyProfile'
import { PHONE_HINT, isValidCnicNtn, isValidEmail, isValidPhone, maskCnicNtn, maskPhone } from '../../utils/validators'
import { prepareLogo } from '../../utils/logoImage'
import { formatDate } from '../../utils/rentUtils'

// Company Profile: the client's own details printed on receipts, invoices, statements and reports.
// Same limits as the API (CompanyProfileService). The company name comes from the client account and is read only.
const MAX_ADDRESS = 300
const MAX_WEBSITE = 150
const MAX_FOOTER = 200
const FIELDS = ['phone', 'email', 'ntn', 'address', 'website', 'footerNote']

const toForm = (p) => Object.fromEntries(FIELDS.map((f) => [f, p?.[f] || '']))

// A web address with or without http(s)://; other schemes are refused (same rule as the API)
const isWebsite = (v) => {
  if (/\s/.test(v)) return false
  const hasScheme = v.includes('://')
  if (hasScheme && !/^https?:\/\//i.test(v)) return false
  if (!hasScheme && v.includes(':')) return false
  try {
    const host = new URL(hasScheme ? v : `https://${v}`).hostname
    return host.includes('.') && !host.startsWith('.') && !host.endsWith('.')
  } catch {
    return false
  }
}

const validate = (f) => {
  const e = {}
  const t = (k) => f[k].trim()
  if (!t('phone')) e.phone = 'Please enter the company phone number.'
  else if (!isValidPhone(t('phone'))) e.phone = `Enter a valid Pakistani phone number, ${PHONE_HINT}.`
  if (t('email') && (t('email').length > 100 || !isValidEmail(t('email')))) e.email = 'Enter a valid email address, e.g. info@example.com.'
  if (t('ntn') && !isValidCnicNtn(t('ntn'), 'Company')) e.ntn = 'Enter the NTN as 1234567-8 (8 digits) or a CNIC as 12345-1234567-1.'
  if (t('address').length > MAX_ADDRESS) e.address = `Address can be at most ${MAX_ADDRESS} characters.`
  if (t('website') && (t('website').length > MAX_WEBSITE || !isWebsite(t('website')))) e.website = 'Enter a valid website, e.g. www.example.com.'
  if (t('footerNote').length > MAX_FOOTER) e.footerNote = `Footer note can be at most ${MAX_FOOTER} characters.`
  return e
}

const CompanyProfile = () => {
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [loadError, setLoadError] = useState('')
  const [saved, setSaved] = useState(null) // profile as last loaded from / saved to the server
  const [form, setForm] = useState(null)
  const [logo, setLogo] = useState({ dataUrl: null, changed: false }) // logo shown in the form
  const [logoBusy, setLogoBusy] = useState(false)
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false) // blocks a second Save before the first finishes
  const fileRef = useRef(null)

  const apply = (p) => {
    setSaved(p)
    setForm(toForm(p))
    setLogo({ dataUrl: p.logoDataUrl || null, changed: false })
    setTouched({})
  }

  const load = async () => {
    setStatus('loading')
    try {
      apply(await companyProfileService.get())
      setStatus('ready')
    } catch (err) {
      setLoadError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps -- load once when the page opens

  const errors = form ? validate(form) : {}
  const valid = Object.keys(errors).length === 0
  const changed = !!form && !!saved && (logo.changed || FIELDS.some((f) => form[f].trim() !== (saved[f] || '')))
  const showError = (k) => (touched[k] || touched.all) && errors[k]

  const set = (k, mask) => (e) => {
    const v = mask ? mask(e.target.value) : e.target.value
    setForm((p) => ({ ...p, [k]: v }))
  }
  const blur = (k) => () => setTouched((p) => ({ ...p, [k]: true }))

  const chooseLogo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // choosing the same file again still triggers a change
    if (!file) return
    setLogoBusy(true)
    try {
      setLogo({ dataUrl: await prepareLogo(file), changed: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLogoBusy(false)
    }
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    setTouched({ all: true })
    if (savingRef.current || !valid || !changed || logoBusy) return
    savingRef.current = true
    setSaving(true)
    try {
      const res = await companyProfileService.save({
        ...Object.fromEntries(FIELDS.map((f) => [f, form[f].trim() || null])),
        logo: logo.changed && logo.dataUrl ? logo.dataUrl : undefined,
        removeLogo: logo.changed && !logo.dataUrl,
      })
      toast.success(res?.message || 'Company profile saved')
      // Show what the server stored (formatted phone / NTN, who changed it) and use it for printing
      const p = await companyProfileService.get().catch(() => null)
      if (p) {
        apply(p)
        setCompanyProfileCache(p)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const preview = form && saved
    ? { ...Object.fromEntries(FIELDS.map((f) => [f, form[f].trim()])), companyName: saved.companyName, logoDataUrl: logo.dataUrl }
    : null

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="fw-semibold fs-5">Company Profile</div>
        <div className="small text-body-secondary">
          Your company&apos;s details, printed on receipts, invoices, statements and reports
        </div>
      </CCardHeader>
      <CCardBody className="px-4">
        {status === 'loading' && (
          <div className="text-center py-5">
            <CSpinner color="primary" />
            <div className="small text-body-secondary mt-2">Loading company profile...</div>
          </div>
        )}

        {status === 'error' && (
          <CAlert color="danger" className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-0">
            <span>{loadError || 'Failed to load company profile.'}</span>
            <CButton color="danger" variant="outline" size="sm" onClick={load}>Try Again</CButton>
          </CAlert>
        )}

        {status === 'ready' && form && (
          <CForm onSubmit={handleSave} noValidate>
            {!saved.phone && (
              <CAlert color="warning" className="small">
                Your company details are not set up yet. Fill them in so they appear on printed receipts and reports.
              </CAlert>
            )}
            <fieldset disabled={saving}>
              <CRow className="g-3">
                <CCol md={6}>
                  <div className="form-label">Company Name</div>
                  <div className="form-control-plaintext fw-semibold">{saved.companyName}</div>
                  <CFormText>Set on your TRL account. Contact your TRL provider to change it.</CFormText>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-phone">Phone <span className="text-danger">*</span></CFormLabel>
                  <CFormInput id="cp-phone" value={form.phone} placeholder="021-34567890" inputMode="tel"
                    invalid={!!showError('phone')} onChange={set('phone', maskPhone)} onBlur={blur('phone')} />
                  <CFormFeedback invalid>{errors.phone}</CFormFeedback>
                  {!showError('phone') && <CFormText>{PHONE_HINT}</CFormText>}
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-email">Email</CFormLabel>
                  <CFormInput id="cp-email" type="email" value={form.email} placeholder="info@example.com" maxLength={100}
                    invalid={!!showError('email')} onChange={set('email')} onBlur={blur('email')} />
                  <CFormFeedback invalid>{errors.email}</CFormFeedback>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-ntn">NTN</CFormLabel>
                  <CFormInput id="cp-ntn" value={form.ntn} placeholder="1234567-8" inputMode="numeric"
                    invalid={!!showError('ntn')} onChange={set('ntn', (v) => maskCnicNtn(v, 'Company'))} onBlur={blur('ntn')} />
                  <CFormFeedback invalid>{errors.ntn}</CFormFeedback>
                  {!showError('ntn') && <CFormText>NTN 1234567-8, or the owner&apos;s CNIC</CFormText>}
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-address">Office Address</CFormLabel>
                  <CFormTextarea id="cp-address" rows={2} value={form.address} maxLength={MAX_ADDRESS}
                    placeholder="Office, street, area, city" invalid={!!showError('address')}
                    onChange={set('address')} onBlur={blur('address')} />
                  <CFormFeedback invalid>{errors.address}</CFormFeedback>
                  <CFormText>Optional. Receipts also show the building address of the tenant&apos;s unit.</CFormText>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-website">Website</CFormLabel>
                  <CFormInput id="cp-website" value={form.website} placeholder="www.example.com" maxLength={MAX_WEBSITE}
                    invalid={!!showError('website')} onChange={set('website')} onBlur={blur('website')} />
                  <CFormFeedback invalid>{errors.website}</CFormFeedback>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-footer">Receipt Footer Note</CFormLabel>
                  <CFormTextarea id="cp-footer" rows={2} value={form.footerNote} maxLength={MAX_FOOTER}
                    placeholder="e.g. Thank you for your payment." invalid={!!showError('footerNote')}
                    onChange={set('footerNote')} onBlur={blur('footerNote')} />
                  <CFormFeedback invalid>{errors.footerNote}</CFormFeedback>
                  <CFormText>{form.footerNote.length}/{MAX_FOOTER}. Printed at the bottom of receipts and invoices.</CFormText>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="cp-logo">Logo</CFormLabel>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className="border rounded d-flex align-items-center justify-content-center bg-body-tertiary"
                      style={{ width: 160, height: 80 }}>
                      {logo.dataUrl
                        ? <img src={logo.dataUrl} alt="Company logo" style={{ maxWidth: 150, maxHeight: 70, objectFit: 'contain' }} />
                        : <span className="small text-body-secondary">No logo</span>}
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <input ref={fileRef} id="cp-logo" type="file" accept="image/png,image/jpeg" className="d-none" onChange={chooseLogo} />
                      <CButton size="sm" color="primary" variant="outline" disabled={logoBusy} onClick={() => fileRef.current?.click()}>
                        {logoBusy ? 'Preparing...' : logo.dataUrl ? 'Change Logo' : 'Upload Logo'}
                      </CButton>
                      {logo.dataUrl && (
                        <CButton size="sm" color="danger" variant="outline" disabled={logoBusy}
                          onClick={() => setLogo({ dataUrl: null, changed: !!saved.logoDataUrl })}>
                          Remove Logo
                        </CButton>
                      )}
                      {logo.changed && (
                        <CButton size="sm" color="secondary" variant="ghost" disabled={logoBusy}
                          onClick={() => setLogo({ dataUrl: saved.logoDataUrl || null, changed: false })}>
                          Undo logo change
                        </CButton>
                      )}
                    </div>
                  </div>
                  <CFormText>PNG or JPG. Large images are resized automatically (max 200 KB after resizing).</CFormText>
                </CCol>
              </CRow>

              <div className="mt-4">
                <div className="small fw-semibold text-body-secondary mb-2">Preview (top of printed documents)</div>
                <div className="border rounded p-3 bg-body">
                  <CompanyHeader profile={preview} title="Payment Receipt" />
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2 mt-4">
                <CButton type="submit" color="primary" disabled={saving || logoBusy || !changed || (touched.all && !valid)}>
                  {saving ? 'Saving...' : 'Save'}
                </CButton>
                <CButton color="secondary" variant="outline" disabled={saving || !changed} onClick={() => apply(saved)}>
                  Discard Changes
                </CButton>
                {saved.updatedAt && (
                  <span className="small text-body-secondary ms-auto">
                    Last saved {formatDate(saved.updatedAt)}{saved.updatedBy ? ` by ${saved.updatedBy}` : ''}
                  </span>
                )}
              </div>
            </fieldset>
          </CForm>
        )}
      </CCardBody>
    </CCard>
  )
}

export default CompanyProfile
