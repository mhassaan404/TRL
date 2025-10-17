import React, { useState } from 'react'
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CCol,
  CButton,
  CFormFeedback,
} from '@coreui/react'

const InvoiceForm = ({ onSubmit }) => {
  const [validated, setValidated] = useState(false)
  const [invoice, setInvoice] = useState({
    invoiceNo: '',
    tenant: '',
    unit: '',
    amount: '',
    issueDate: '',
    dueDate: '',
    status: '',
    notes: '',
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.stopPropagation()
    } else {
      onSubmit(invoice)
      setInvoice({
        invoiceNo: '',
        tenant: '',
        unit: '',
        amount: '',
        issueDate: '',
        dueDate: '',
        status: '',
        notes: '',
      })
    }
    setValidated(true)
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={6}>
        <CFormLabel htmlFor="invoiceNo">Invoice No</CFormLabel>
        <CFormInput
          id="invoiceNo"
          value={invoice.invoiceNo}
          onChange={(e) => setInvoice({ ...invoice, invoiceNo: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter invoice number.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="tenant">Tenant Name</CFormLabel>
        <CFormInput
          id="tenant"
          value={invoice.tenant}
          onChange={(e) => setInvoice({ ...invoice, tenant: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter tenant name.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="unit">Property / Unit</CFormLabel>
        <CFormInput
          id="unit"
          value={invoice.unit}
          onChange={(e) => setInvoice({ ...invoice, unit: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter property/unit.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="amount">Amount</CFormLabel>
        <CFormInput
          type="number"
          id="amount"
          value={invoice.amount}
          onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter amount.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="issueDate">Issue Date</CFormLabel>
        <CFormInput
          type="date"
          id="issueDate"
          value={invoice.issueDate}
          onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please select issue date.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="dueDate">Due Date</CFormLabel>
        <CFormInput
          type="date"
          id="dueDate"
          value={invoice.dueDate}
          onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please select due date.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="status">Status</CFormLabel>
        <CFormSelect
          id="status"
          value={invoice.status}
          onChange={(e) => setInvoice({ ...invoice, status: e.target.value })}
          required
        >
          <option value="">Select Status...</option>
          <option>Paid</option>
          <option>Unpaid</option>
          <option>Overdue</option>
        </CFormSelect>
        <CFormFeedback invalid>Please select status.</CFormFeedback>
      </CCol>

      <CCol xs={12}>
        <CFormLabel htmlFor="notes">Notes</CFormLabel>
        <CFormTextarea
          id="notes"
          value={invoice.notes}
          onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
          placeholder="Optional notes"
        />
      </CCol>

      <CCol xs={12}>
        <CButton color="primary" type="submit">
          Add Invoice
        </CButton>
      </CCol>
    </CForm>
  )
}

export default InvoiceForm