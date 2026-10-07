// Payment reminders: grouping, due states, phone numbers and the WhatsApp message.
// Self-contained (no React or API imports) so the rules are easy to test.

const DUE_SOON_DAYS = 3
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const day = (d) => String(d || '').slice(0, 10) // YYYY-MM-DD
const money = (v) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })

// "2026-10-06" -> "06 Oct 2026"
export const formatDay = (d) => {
  const [y, m, dd] = day(d).split('-')
  return y && m && dd ? `${dd} ${MONTHS[Number(m) - 1]} ${y}` : ''
}

const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// Overdue (due date passed), Due today, Due soon (next 3 days) or Upcoming
export const dueState = (dueDate, today) => {
  const due = day(dueDate)
  if (!due) return 'Upcoming'
  if (due < today) return 'Overdue'
  if (due === today) return 'Due today'
  if (due <= addDays(today, DUE_SOON_DAYS)) return 'Due soon'
  return 'Upcoming'
}

// What the invoice is for: the charge type for extra charges, otherwise the rent month ("Oct 2026")
export const invoiceLabel = (inv) => {
  if (inv.chargeType) return inv.chargeType
  const [y, m] = day(inv.invoiceMonth || inv.invoiceDate).split('-')
  return y && m ? `${MONTHS[Number(m) - 1]} ${y}` : 'Rent'
}

// Amount the tenant owes on an invoice now: balance (incl. a charged late fee) + open late fee
export const outstanding = (inv) => (Number(inv.balance) || 0) + (Number(inv.lateFee) || 0)

// Pakistani mobile number -> WhatsApp format: "0347-0377136" / "+92 347 0377136" -> "923470377136". null if not valid.
export const toWhatsAppNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (/^03\d{9}$/.test(digits)) return `92${digits.slice(1)}`
  if (/^923\d{9}$/.test(digits)) return digits
  if (/^3\d{9}$/.test(digits)) return `92${digits}`
  return null
}

// One group per tenant with their open invoices (earliest due first) and totals
export const groupByTenant = (rows, today) => {
  const map = new Map()
  rows.forEach((r) => {
    if (!map.has(r.tenantId)) {
      map.set(r.tenantId, { tenantId: r.tenantId, tenantName: r.tenantName, phone: r.phone, invoices: [] })
    }
    map.get(r.tenantId).invoices.push({ ...r, state: dueState(r.dueDate, today) })
  })
  return [...map.values()]
    .map((g) => {
      g.invoices.sort((a, b) => day(a.dueDate).localeCompare(day(b.dueDate)) || a.invoiceId - b.invoiceId)
      return {
        ...g,
        whatsApp: toWhatsAppNumber(g.phone),
        total: g.invoices.reduce((s, i) => s + outstanding(i), 0),
        states: new Set(g.invoices.map((i) => i.state)),
      }
    })
    .sort((a, b) => a.tenantName.localeCompare(b.tenantName))
}

// One message with all the tenant's open invoices. Firmer wording when any of them is overdue.
export const buildMessage = (group) => {
  const overdue = group.invoices.some((i) => i.state === 'Overdue')
  const lines = [
    `Dear ${group.tenantName},`,
    '',
    overdue ? 'Your rent payment is overdue. Outstanding invoices:' : 'This is a reminder of your outstanding rent:',
    '',
  ]
  group.invoices.forEach((i) => {
    const unit = i.unitNumber ? ` – Unit ${i.unitNumber}` : ''
    lines.push(`• Invoice #${i.invoiceId}${unit} – ${invoiceLabel(i)}`)
    lines.push(`  Balance: PKR ${money(i.balance)} | Due: ${formatDay(i.dueDate)}${i.state === 'Overdue' ? ' (overdue)' : ''}`)
    if (Number(i.lateFee) > 0) lines.push(`  Late fee so far: PKR ${money(i.lateFee)}`)
  })
  // Show how the total is made up when late fees are part of it
  const lateFees = group.invoices.reduce((s, i) => s + (Number(i.lateFee) || 0), 0)
  lines.push('')
  if (lateFees > 0) {
    lines.push(`Rent balance: PKR ${money(group.total - lateFees)}`, `Late fees: PKR ${money(lateFees)}`)
  }
  lines.push(`Total outstanding: PKR ${money(group.total)}`, '')
  lines.push(
    overdue
      ? 'Please clear the payment as soon as possible to avoid further late fees. Thank you.'
      : 'Please pay by the due date. Thank you.',
  )
  return lines.join('\n')
}

export const whatsAppLink = (group) =>
  group.whatsApp ? `https://wa.me/${group.whatsApp}?text=${encodeURIComponent(buildMessage(group))}` : null
