import React, { useId } from 'react'
import PropTypes from 'prop-types'

// The Ledger (TRL) brand. The mark: a roof (property) over ledger lines (the books), the last entry ending in green
// (paid / balanced), on an indigo tile matching the app's primary colour. Drawn as inline SVG so it stays sharp at
// any size and works on light and dark backgrounds. The same artwork is in public/favicon.svg and the PNG icons.

export const TrlMark = ({ size = 32, className, title = 'The Ledger' }) => {
  const gradientId = `trl-mark-${useId().replace(/:/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d6bf2" />
          <stop offset="1" stopColor="#3d3bb5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gradientId})`} />
      <path d="M15 31 32 17 49 31" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 38.5H43" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M21 47H33" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M38.5 47H43" stroke="#4ade80" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

TrlMark.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
  title: PropTypes.string,
}

// Mark + "The Ledger" wordmark. The text uses the current text colour, so it follows the theme
// (white in the dark sidebar, body colour elsewhere).
export const TrlLogo = ({ size = 32, className = '' }) => (
  <span className={`d-inline-flex align-items-center ${className}`} style={{ gap: size * 0.3 }}>
    <TrlMark size={size} />
    <span style={{ fontSize: size * 0.58, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: 400, opacity: 0.85 }}>The </span>
      <span style={{ fontWeight: 700 }}>Ledger</span>
    </span>
  </span>
)

TrlLogo.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
}
