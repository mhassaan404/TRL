// New-password rules for Change My Password: the same as the API (Helpers/PasswordPolicy.cs), which has the final say.
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64
const MAX_BYTES = 72 // BCrypt only uses the first 72 bytes

export const PASSWORD_HINT = `${PASSWORD_MIN}–${PASSWORD_MAX} characters, with at least one letter and one number.`

const byteLength = (s) => new TextEncoder().encode(s).length

// { current, next, confirm } -> { field: message } (empty object when valid)
export const validatePasswordChange = ({ current, next, confirm }, username = '') => {
  const e = {}
  if (!current) e.current = 'Please enter your current password.'
  if (!next) e.next = 'Please enter a new password.'
  else if (next.length < PASSWORD_MIN) e.next = `The new password must be at least ${PASSWORD_MIN} characters.`
  else if (next.length > PASSWORD_MAX || byteLength(next) > MAX_BYTES) e.next = `The new password can be at most ${PASSWORD_MAX} characters.`
  else if (/^\s|\s$/.test(next)) e.next = "The new password can't start or end with a space."
  else if (/[\u0000-\u001f\u007f]/.test(next)) e.next = "The new password contains characters that aren't allowed."
  else if (!/\p{L}/u.test(next) || !/\p{N}/u.test(next)) e.next = 'The new password must contain at least one letter and one number.'
  else if (username && next.toLowerCase() === username.toLowerCase()) e.next = "The new password can't be your username."
  else if (current && next === current) e.next = 'The new password must be different from your current password.'
  if (!confirm) e.confirm = 'Please confirm the new password.'
  else if (next && confirm !== next) e.confirm = "The new password and its confirmation don't match."
  return e
}
