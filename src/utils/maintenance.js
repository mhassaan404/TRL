// Maintenance page rules (no React or API imports, so they are easy to test). Same rules as the API
// (BLL/MaintenanceService.cs, DAL/MaintenanceRepository.cs).

export const CATEGORIES = ['Plumbing', 'Electrical', 'AC', 'Carpentry', 'Painting', 'Cleaning', 'Other']
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
export const STATUSES = ['Open', 'In Progress', 'Completed', 'Cancelled']

const day = (d) => String(d || '').slice(0, 10)
export const isClosed = (job) => job.status === 'Completed' || job.status === 'Cancelled'

// Summary cards: open, in progress, urgent (still open or in progress), completed this month (YYYY-MM of today)
export const summarize = (jobs, today) => {
  const month = today.slice(0, 7)
  return {
    open: jobs.filter((j) => j.status === 'Open').length,
    inProgress: jobs.filter((j) => j.status === 'In Progress').length,
    urgent: jobs.filter((j) => j.priority === 'Urgent' && !isClosed(j)).length,
    completedThisMonth: jobs.filter((j) => j.status === 'Completed' && day(j.completedDate).slice(0, 7) === month).length,
  }
}

// Filters: status ('Active' = Open + In Progress, '' = all), building, unit, priority, and a text search
export const filterJobs = (jobs, { status = '', buildingId = '', unitId = '', priority = '', search = '' }) => {
  const q = search.trim().toLowerCase()
  return jobs.filter(
    (j) =>
      (!status || (status === 'Active' ? !isClosed(j) : j.status === status)) &&
      (!buildingId || String(j.buildingId) === String(buildingId)) &&
      (!unitId || String(j.unitId) === String(unitId)) &&
      (!priority || j.priority === priority) &&
      (!q ||
        [`#${j.id}`, j.title, j.category, j.tenantName, j.unitNumber, j.buildingName, j.assignedTo]
          .join(' ')
          .toLowerCase()
          .includes(q)),
  )
}

// Statuses a job can move to: Open <-> In Progress, and either to Completed or Cancelled (final)
export const nextStatuses = (job) => (isClosed(job) ? [] : STATUSES.filter((s) => s !== job.status))

// Why the Bill button is off, or null when the job can be billed
export const billBlockedReason = (job) => {
  if (job.status === 'Cancelled') return 'Cancelled jobs can\'t be billed.'
  if (!job.tenantId) return 'No tenant on this job. Edit it to add one.'
  if (job.isBilled) return `Already billed as invoice #${job.chargeInvoiceId}.`
  return null
}

// Why the location/tenant can't be changed in Edit, or null (same rule as the API)
export const locationLockReason = (job) => {
  if (!job?.id) return null
  if (job.isBilled) return 'Billed to the tenant, so the location and tenant are fixed.'
  if (job.markedUnit) return 'This job set the unit Under Maintenance, so the location is fixed until the job is closed.'
  return null
}
