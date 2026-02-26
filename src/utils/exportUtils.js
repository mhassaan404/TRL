// src/utils/csvUtils.js
import { formatDate } from './rentUtils'

export const exportCSV = (columns, data) => {
  // 1. Build headers from columns
  const headerRow = columns.map((col) => col.header || col.accessorKey || col.id).join(',')

  // 2. Build data rows
  const csvRows = data.map((row) => {
    return columns
      .map((col) => {
        const key = col.accessorKey || col.id
        let value = row[key] ?? ''
        
        // Handle date formatting safely
        if (key === 'dueDate' || key === 'invoiceDate') {
          value = row[key] ? formatDate(row[key]) : ''
        }

        // Escape quotes and commas
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  })

  // 3. Combine
  const csvContent = [headerRow, ...csvRows].join('\n')

  // 4. Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'rent_collection.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
