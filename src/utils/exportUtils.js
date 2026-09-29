import { formatDate } from './rentUtils'

// Downloads table rows as a CSV file. `columns` are react-table style column defs; only data columns are
// exported (action/selection/expand columns are skipped). Values are always quoted so commas and quotes in
// the data can't break the file; *Date fields are formatted for reading.
const NON_DATA_COLUMNS = ['actions', 'select', 'expand']

export const exportCSV = (columns, data, filename = 'export.csv') => {
  const cols = columns
    .map((col) => ({ key: col.accessorKey || col.id, header: typeof col.header === 'string' ? col.header : col.accessorKey || col.id }))
    .filter((col) => col.key && !NON_DATA_COLUMNS.includes(col.key))

  // Text starting with = + - @ (or tab/CR) would run as a formula in Excel, so it gets a leading apostrophe
  const safe = (value) => (typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value)
  const quote = (value) => `"${String(safe(value) ?? '').replace(/"/g, '""')}"`
  const cell = (row, key) => (/Date$/i.test(key) && row[key] ? formatDate(row[key]) : row[key])

  const csv = [cols.map((c) => quote(c.header)).join(','), ...data.map((row) => cols.map((c) => quote(cell(row, c.key))).join(','))].join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
