// Printable documents: numbers, labels, amount in words and the links that open them.
// Self-contained (no React or API imports) so the rules are easy to test.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Receipt number = payment Id, invoice number = invoice Id: both already unique, so nothing extra is stored
export const receiptNo = (paymentId) => `RCT-${String(paymentId).padStart(6, '0')}`
export const invoiceNo = (invoiceId) => `INV-${String(invoiceId).padStart(6, '0')}`

// What an invoice is for: "Rent – October 2026" or the extra charge type ("Damage")
export const invoiceTitle = (inv) => {
  if (inv.chargeType) return inv.chargeType
  const [y, m] = String(inv.invoiceMonth || inv.invoiceDate || '').slice(0, 7).split('-')
  return y && m ? `Rent – ${MONTHS[Number(m) - 1]} ${y}` : 'Rent'
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const belowHundred = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`)
const belowThousand = (n) => {
  const h = Math.floor(n / 100)
  const r = n % 100
  return [h ? `${ONES[h]} Hundred` : '', r ? belowHundred(r) : ''].filter(Boolean).join(' ')
}

// Whole number in words, Pakistani style: Crore, Lakh, Thousand, Hundred (1,25,000 = One Lakh Twenty-Five Thousand)
export const numberToWords = (value) => {
  let n = Math.floor(Math.abs(Number(value) || 0))
  if (n === 0) return 'Zero'
  const parts = []
  const crore = Math.floor(n / 10000000)
  n %= 10000000
  if (crore) parts.push(`${numberToWords(crore)} Crore`)
  const lakh = Math.floor(n / 100000)
  n %= 100000
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`)
  const thousand = Math.floor(n / 1000)
  n %= 1000
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`)
  if (n) parts.push(belowThousand(n))
  return parts.join(' ')
}

// "Rupees Twenty-Five Thousand Only" / "Rupees Ten and Fifty Paisa Only"
export const amountInWords = (amount) => {
  const v = Math.round(Math.abs(Number(amount) || 0) * 100)
  const rupees = Math.floor(v / 100)
  const paisa = v % 100
  return `Rupees ${numberToWords(rupees)}${paisa ? ` and ${numberToWords(paisa)} Paisa` : ''} Only`
}

// Print pages open in a new tab (outside the app layout), from a click so the browser allows it
export const receiptsLink = (paymentIds) => `#/print/receipts/${[].concat(paymentIds).join(',')}`
export const invoiceLink = (invoiceId) => `#/print/invoice/${invoiceId}`
export const openReceipts = (paymentIds) => window.open(receiptsLink(paymentIds), '_blank', 'noopener')
export const openInvoice = (invoiceId) => window.open(invoiceLink(invoiceId), '_blank', 'noopener')

// Payments made at a move-out settlement that are not new money: paid from the security deposit, or a tenant credit
// moved into the deposit. They count against the invoice but have no receipt and are not cash received.
export const NON_CASH_METHODS = ['Security Deposit', 'Credit to Deposit']
export const isNonCashPayment = (p) => NON_CASH_METHODS.includes(p?.paymentMethod)
export const hasReceipt = (p) => Number(p?.paymentAmount) > 0 && !isNonCashPayment(p)
