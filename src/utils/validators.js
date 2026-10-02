// Input masks and checks for tenant contact details. Same rules as the API (Helpers/TenantValidation.cs).

const digitsOf = (v) => String(v ?? '').replace(/\D/g, '')

// Pakistani phone, formatted while typing:
//   mobile   03XX-XXXXXXX   (+92 / 0092 / 92 prefixes are turned into 0)
//   landline 0XX-XXXXXXXX
export const maskPhone = (value) => {
  let d = digitsOf(value)
  if (d.startsWith('0092')) d = '0' + d.slice(4)
  else if (d.startsWith('92')) d = '0' + d.slice(2)
  if (d.startsWith('03')) {
    d = d.slice(0, 11)
    return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d
  }
  d = d.slice(0, 11)
  return d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d
}

export const isValidPhone = (value) => {
  const d = digitsOf(maskPhone(value))
  return /^03\d{9}$/.test(d) || /^0[124-9]\d{8,9}$/.test(d)
}

export const PHONE_HINT = 'e.g. 0300-1234567 or 021-34567890'

// CNIC 12345-1234567-1 (individuals); NTN 1234567-8 or a CNIC (companies)
export const maskCnicNtn = (value, tenantType) => {
  const d = digitsOf(value).slice(0, 13)
  if (tenantType === 'Company' && d.length <= 8) {
    return d.length > 7 ? `${d.slice(0, 7)}-${d.slice(7)}` : d
  }
  if (d.length > 12) return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`
  return d
}

export const isValidCnicNtn = (value, tenantType) => {
  const d = digitsOf(value)
  return d.length === 13 || (tenantType === 'Company' && d.length === 8)
}

export const cnicNtnHint = (tenantType) =>
  tenantType === 'Company' ? 'NTN 1234567-8 or CNIC 12345-1234567-1' : 'CNIC 12345-1234567-1'

export const isValidEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(value ?? '').trim())
