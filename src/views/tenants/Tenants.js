import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import { tenantService } from "../../services/tenant.service";
import {
    CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
    CButton, CCard, CCardBody, CCardHeader, CCol, CRow,
    CModal, CModalBody, CModalHeader, CModalTitle,
    CForm, CFormCheck, CFormInput, CFormFeedback,
    CFormLabel, CFormSelect, CFormTextarea
} from "@coreui/react";
import {
    useReactTable, getCoreRowModel, getSortedRowModel,
    getPaginationRowModel, getFilteredRowModel, flexRender
} from "@tanstack/react-table";
import { toast } from "react-toastify";
import { PageSizeSelect, TablePagination, tablePageProps, tablePageSizeProps, DEFAULT_PAGE_SIZE } from "../../components/common/TablePagination";
import {
    maskPhone, isValidPhone, PHONE_HINT,
    maskCnicNtn, isValidCnicNtn, cnicNtnHint, isValidEmail
} from "../../utils/validators";

const TENANT_TYPES = ["Company", "Individual"];

const emptyTenant = {
    name: "",
    tenantType: "",
    contactPerson: "",
    email: "",
    phone: "",
    cnicNtn: "",
    address: "",
    notes: "",
    isActive: true
};

// Field checks shown under each input; the API runs the same rules
const validateTenant = (t) => {
    const errors = {};
    if (!t.name.trim()) errors.name = "Enter the tenant or company name";
    else if (t.name.trim().length > 150) errors.name = "At most 150 characters";
    if (!TENANT_TYPES.includes(t.tenantType)) errors.tenantType = "Select Company or Individual";
    if (t.contactPerson.trim().length > 150) errors.contactPerson = "At most 150 characters";
    if (t.email.trim() && !isValidEmail(t.email)) errors.email = "Enter a valid email address, e.g. name@example.com";
    if (t.phone.trim() && !isValidPhone(t.phone)) errors.phone = `Enter a valid Pakistani number, ${PHONE_HINT}`;
    if (t.cnicNtn.trim() && !isValidCnicNtn(t.cnicNtn, t.tenantType))
        errors.cnicNtn = `Enter ${cnicNtnHint(t.tenantType)}`;
    if (t.address.trim().length > 500) errors.address = "At most 500 characters";
    return errors;
};

const Required = () => <span className="text-danger">*</span>;

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [visible, setVisible] = useState(false);
    const [editData, setEditData] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    // Field errors are shown once the user has tried to save
    const [submitted, setSubmitted] = useState(false);
    const [tenant, setTenant] = useState(emptyTenant);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    const errors = useMemo(() => (submitted ? validateTenant(tenant) : {}), [submitted, tenant]);
    const set = (field, value) => setTenant((p) => ({ ...p, [field]: value }));

    // Load tenants (the service shows load errors and returns [])
    const loadTenants = async () => {
        setLoading(true);
        setTenants(await tenantService.getTenants());
        setLoading(false);
    };

    useEffect(() => {
        loadTenants();
    }, []);

    // Save or update tenant. The form only closes when the save succeeds, so nothing typed is lost on an error.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (Object.keys(validateTenant(tenant)).length) return;

        try {
            setLoading(true);
            const res = await tenantService.save({
                Name: tenant.name.trim(),
                TenantType: tenant.tenantType,
                ContactPerson: tenant.contactPerson.trim() || null,
                Email: tenant.email.trim() || null,
                Contact: tenant.phone.trim() || null,
                CnicNtn: tenant.cnicNtn.trim() || null,
                Address: tenant.address.trim() || null,
                Notes: tenant.notes,
                IsActive: tenant.isActive,
            }, editData?.tenantId);

            toast.success(res.message);
            await loadTenants();
            setVisible(false);
            setTenant(emptyTenant);
            setEditData(null);
            setSubmitted(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete tenant
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tenant?")) return;

        try {
            setLoading(true);
            const res = await tenantService.remove(id);
            toast.success(res.message);
            await loadTenants();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Edit tenant. Older records are shown in the new formats where they match (e.g. 03001234567 -> 0300-1234567).
    const handleEdit = (t) => {
        const tenantType = TENANT_TYPES.includes(t.tenantType) ? t.tenantType : "Individual";
        setEditData(t);
        setSubmitted(false);
        setVisible(true);

        setTenant({
            name: t.name || "",
            tenantType,
            contactPerson: t.contactPerson || "",
            email: t.email || "",
            phone: t.contact ? (isValidPhone(t.contact) ? maskPhone(t.contact) : t.contact) : "",
            cnicNtn: t.cnicNtn || "",
            address: t.address || "",
            notes: t.notes || "",
            isActive: !!t.isActive,
        });
    };

    const [expandedRows, setExpandedRows] = useState({});

    const toggleExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const columns = useMemo(() => [
        {
            accessorKey: "expand",
            header: "",
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <CButton
                    color="secondary"
                    size="sm"
                    onClick={() => toggleExpand(row.original.tenantId)}
                >
                    {expandedRows[row.original.tenantId] ? "-" : "+"}
                </CButton>
            )
        },
        {
            accessorKey: "name",
            header: "Tenant / Company"
        },
        {
            accessorKey: "tenantType",
            header: "Type",
            cell: ({ getValue }) => (
                <span className={`badge ${getValue() === "Company" ? "bg-info" : "bg-secondary"}`}>
                    {getValue() || "Individual"}
                </span>
            )
        },
        {
            accessorKey: "contactPerson",
            header: "Contact Person",
            cell: ({ getValue }) => getValue() || "-"
        },
        {
            accessorKey: "contact",
            header: "Phone",
            cell: ({ getValue }) => getValue() || "-"
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ getValue }) => getValue() || "-"
        },
        {
            accessorKey: "isActive",
            header: "Status",
            enableGlobalFilter: false,
            cell: ({ getValue }) => (
                <span
                    style={{
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        color: "white",
                        backgroundColor: getValue() ? "green" : "grey"
                    }}
                >
                    {getValue() ? "Active" : "Inactive"}
                </span>
            )
        },
        {
            accessorKey: "actions",
            header: "Actions",
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <>
                    <CButton
                        size="sm"
                        color="info"
                        className="me-2"
                        onClick={() => handleEdit(row.original)}
                    >
                        Edit
                    </CButton>

                    <CButton
                        size="sm"
                        color="danger"
                        onClick={() => handleDelete(row.original.tenantId)}
                    >
                        Delete
                    </CButton>
                </>
            )
        },
    ], [expandedRows]);

    // Filter data manually for status
    const filteredData = useMemo(() => {
        if (!statusFilter) return tenants;

        return tenants.filter((p) =>
            statusFilter === "Active"
                ? p.isActive
                : !p.isActive
        );
    }, [tenants, statusFilter]);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: "includesString",
        initialState: { pagination: { pageSize: DEFAULT_PAGE_SIZE } },
    });

    // Rows left after the status filter and the search box
    const shownCount = table.getFilteredRowModel().rows.length;

    const handleCancel = () => {
        setTenant(emptyTenant);
        setEditData(null);
        setSubmitted(false);
        setVisible(false);
    };

    return (
        <>
            {loading && <Loader />}

            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4">

                        <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <strong>Tenants</strong>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <CButton color="success" className="me-2">
                                    Export CSV
                                </CButton>

                                <CButton
                                    color="primary"
                                    onClick={() => {
                                        setEditData(null);
                                        setTenant(emptyTenant);
                                        setSubmitted(false);
                                        setVisible(true);
                                    }}
                                >
                                    + Add Tenant
                                </CButton>
                            </div>
                        </CCardHeader>

                        <CCardBody>

                            <CRow className="align-items-center mb-2">

                                <CCol
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    className="d-flex align-items-center gap-2 flex-wrap mb-2"
                                >
                                    <PageSizeSelect {...tablePageSizeProps(table)} />
                                </CCol>

                                <CCol
                                    xs={12}
                                    sm={6}
                                    md={8}
                                    className="d-flex align-items-center justify-content-end gap-2 flex-wrap"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={globalFilter ?? ""}
                                        onChange={(e) =>
                                            setGlobalFilter(e.target.value)
                                        }
                                        className="form-control"
                                        style={{
                                            maxWidth: "220px",
                                            flexGrow: 1
                                        }}
                                    />

                                    <CDropdown
                                        className="flex-shrink-0"
                                        style={{ minWidth: "150px" }}
                                    >
                                        <CDropdownToggle
                                            as="div"
                                            color="info"
                                            variant="outline"
                                            className="w-100 text-center"
                                            style={{ cursor: "pointer" }}
                                        >
                                            {statusFilter || "All"}
                                        </CDropdownToggle>

                                        <CDropdownMenu
                                            className="w-100 text-center"
                                            style={{ cursor: "pointer" }}
                                        >
                                            <CDropdownItem
                                                onClick={() => setStatusFilter("")}
                                            >
                                                All
                                            </CDropdownItem>

                                            <CDropdownItem
                                                onClick={() =>
                                                    setStatusFilter("Active")
                                                }
                                            >
                                                Active
                                            </CDropdownItem>

                                            <CDropdownItem
                                                onClick={() =>
                                                    setStatusFilter("Inactive")
                                                }
                                            >
                                                Inactive
                                            </CDropdownItem>
                                        </CDropdownMenu>
                                    </CDropdown>
                                </CCol>
                            </CRow>

                            <div
                                style={{
                                    overflowX: "auto",
                                    width: "100%"
                                }}
                            >
                                <table className="table table-bordered table-striped">

                                    <thead>
                                        {table.getHeaderGroups().map(hg => (
                                            <tr key={hg.id}>
                                                {hg.headers.map(header => (
                                                    <th
                                                        key={header.id}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}

                                                        {header.column.getIsSorted()
                                                            ? header.column.getIsSorted() === "asc"
                                                                ? " 🔼"
                                                                : " 🔽"
                                                            : null}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>

                                    <tbody>
                                        {table.getRowModel().rows.map(row => (
                                            <React.Fragment
                                                key={row.original.tenantId}
                                            >
                                                <tr>
                                                    {row.getVisibleCells().map(cell => (
                                                        <td key={cell.id}>
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>

                                                {expandedRows[row.original.tenantId] && (
                                                    <tr>
                                                        <td colSpan={columns.length}>
                                                            <div>
                                                                <strong>CNIC / NTN:</strong>{" "}
                                                                {row.original.cnicNtn || "-"}
                                                            </div>

                                                            <div>
                                                                <strong>Address:</strong>{" "}
                                                                {row.original.address || "-"}
                                                            </div>

                                                            {row.original.cityName && (
                                                                <div>
                                                                    <strong>City:</strong>{" "}
                                                                    {row.original.cityName}
                                                                </div>
                                                            )}

                                                            <div>
                                                                <strong>Notes:</strong>{" "}
                                                                {row.original.notes || "-"}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}

                                        {shownCount === 0 && (
                                            <tr>
                                                <td colSpan={columns.length} className="text-center text-muted py-3">
                                                    No tenants found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                </table>
                            </div>

                            <TablePagination {...tablePageProps(table)} />

                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Modal */}
                <CModal
                    visible={visible}
                    onClose={handleCancel}
                    size="xl"
                    backdrop="static"
                >
                    <CModalHeader>
                        <CModalTitle>
                            {editData ? "Edit Tenant" : "Add Tenant"}
                        </CModalTitle>
                    </CModalHeader>

                    <CModalBody>

                        <CForm
                            className="row g-3"
                            noValidate
                            onSubmit={handleSubmit}
                        >

                            <CCol md={6}>
                                <CFormLabel htmlFor="tenant-name">
                                    Tenant / Company Name <Required />
                                </CFormLabel>
                                <CFormInput
                                    id="tenant-name"
                                    value={tenant.name}
                                    maxLength={150}
                                    onChange={e => set("name", e.target.value)}
                                    placeholder="e.g. Ali Khan or Al-Noor Traders"
                                    invalid={!!errors.name}
                                />
                                <CFormFeedback invalid>{errors.name}</CFormFeedback>
                            </CCol>

                            <CCol md={3}>
                                <CFormLabel htmlFor="tenant-type">
                                    Tenant Type <Required />
                                </CFormLabel>
                                <CFormSelect
                                    id="tenant-type"
                                    value={tenant.tenantType}
                                    onChange={e => {
                                        const tenantType = e.target.value;
                                        // Re-format an entered CNIC/NTN for the new type
                                        setTenant(p => ({ ...p, tenantType, cnicNtn: maskCnicNtn(p.cnicNtn, tenantType) }));
                                    }}
                                    invalid={!!errors.tenantType}
                                >
                                    <option value="">Select type...</option>
                                    {TENANT_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </CFormSelect>
                                <CFormFeedback invalid>{errors.tenantType}</CFormFeedback>
                            </CCol>

                            <CCol md={3}>
                                <CFormLabel htmlFor="tenant-contact-person">Contact Person</CFormLabel>
                                <CFormInput
                                    id="tenant-contact-person"
                                    value={tenant.contactPerson}
                                    maxLength={150}
                                    onChange={e => set("contactPerson", e.target.value)}
                                    placeholder="Name of contact person"
                                    invalid={!!errors.contactPerson}
                                />
                                <CFormFeedback invalid>{errors.contactPerson}</CFormFeedback>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel htmlFor="tenant-email">Email</CFormLabel>
                                <CFormInput
                                    id="tenant-email"
                                    type="email"
                                    value={tenant.email}
                                    maxLength={100}
                                    onChange={e => set("email", e.target.value)}
                                    placeholder="name@example.com"
                                    invalid={!!errors.email}
                                />
                                <CFormFeedback invalid>{errors.email}</CFormFeedback>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel htmlFor="tenant-phone">Phone</CFormLabel>
                                <CFormInput
                                    id="tenant-phone"
                                    type="tel"
                                    inputMode="tel"
                                    value={tenant.phone}
                                    onChange={e => set("phone", maskPhone(e.target.value))}
                                    placeholder="0300-1234567"
                                    invalid={!!errors.phone}
                                />
                                <CFormFeedback invalid>{errors.phone}</CFormFeedback>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel htmlFor="tenant-cnic">CNIC / NTN</CFormLabel>
                                <CFormInput
                                    id="tenant-cnic"
                                    inputMode="numeric"
                                    value={tenant.cnicNtn}
                                    onChange={e => set("cnicNtn", maskCnicNtn(e.target.value, tenant.tenantType))}
                                    placeholder={tenant.tenantType === "Company" ? "1234567-8" : "12345-1234567-1"}
                                    invalid={!!errors.cnicNtn}
                                />
                                <CFormFeedback invalid>{errors.cnicNtn}</CFormFeedback>
                            </CCol>

                            <CCol xs={12}>
                                <CFormLabel htmlFor="tenant-address">Address</CFormLabel>
                                <CFormInput
                                    id="tenant-address"
                                    value={tenant.address}
                                    maxLength={500}
                                    onChange={e => set("address", e.target.value)}
                                    placeholder="House / office, street, area, city"
                                    invalid={!!errors.address}
                                />
                                <CFormFeedback invalid>{errors.address}</CFormFeedback>
                            </CCol>

                            <CCol xs={12}>
                                <CFormLabel htmlFor="tenant-notes">Notes</CFormLabel>
                                <CFormTextarea
                                    id="tenant-notes"
                                    value={tenant.notes || ""}
                                    onChange={e => set("notes", e.target.value)}
                                    placeholder="Enter Notes"
                                />
                            </CCol>

                            <CCol xs={12}>
                                <CFormCheck
                                    id="tenant-active"
                                    label="Is Active"
                                    checked={tenant.isActive}
                                    onChange={e => set("isActive", e.target.checked)}
                                />
                            </CCol>

                            <CCol
                                xs={12}
                                className="d-flex justify-content-between align-items-center gap-2"
                            >
                                <small className="text-muted"><Required /> Required field</small>

                                <div className="d-flex gap-2">
                                    <CButton
                                        color="warning"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </CButton>

                                    <CButton
                                        color="primary"
                                        type="submit"
                                    >
                                        {editData
                                            ? "Update Tenant"
                                            : "Add Tenant"}
                                    </CButton>
                                </div>
                            </CCol>

                        </CForm>

                    </CModalBody>
                </CModal>
            </CRow>
        </>
    );
};

export default Tenants
