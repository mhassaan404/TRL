// src/components/common/CurrencyInput.jsx
import React from 'react'
import PropTypes from 'prop-types'
import { CFormInput } from '@coreui/react'

// Amount input that shows thousands separators while typing ("20000" is shown as "20,000") but hands the
// parent the plain number text ("20000"), so form state and API payloads stay numeric.
// Only digits and (optionally) one decimal point with up to 2 decimals can be typed; negatives are not allowed.
export const toPlainAmount = (text, allowDecimal = true) => {
  let s = String(text ?? '').replace(/[^\d.]/g, '')
  if (!allowDecimal) return s.replace(/\./g, '')
  const dot = s.indexOf('.')
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  return s
}

export const formatAmountText = (plain) => {
  if (plain === '' || plain == null) return ''
  const [int, dec] = String(plain).split('.')
  const grouped = (int.replace(/^0+(?=\d)/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${grouped}.${dec}` : grouped
}

const CurrencyInput = ({ value, onValueChange, allowDecimal = true, max, ...rest }) => {
  const handleChange = (e) => {
    let plain = toPlainAmount(e.target.value, allowDecimal)
    if (max !== undefined && plain !== '' && Number(plain) > Number(max)) plain = String(max)
    onValueChange(plain)
  }

  return (
    <CFormInput
      {...rest}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={formatAmountText(value === 0 ? '0' : value)}
      onChange={handleChange}
    />
  )
}

CurrencyInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onValueChange: PropTypes.func.isRequired,
  allowDecimal: PropTypes.bool,
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default CurrencyInput
