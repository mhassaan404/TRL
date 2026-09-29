import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import { getErrorMessage } from "../../api/axios";
import { tenantService } from "../../services/tenant.service";
import { propertyService } from "../../services/property.service";
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

const Tenants = () => {
    const emptyTenant = {
        name: "",
        email: "",
        phone: "",
        notes: "",
        cityId: "",
        isActive: true
    };

    const [tenants, setTenants] = useState([]);
    const [visible, setVisible] = useState(false);
    const [editData, setEditData] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [validated, setValidated] = useState(false);
    const [tenant, setTenant] = useState(emptyTenant);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    const [cities, setCities] = useState([]);

    // Load tenants (the service shows load errors and returns [])
    const loadTenants = async () => {
        setLoading(true);
        setTenants(await tenantService.getTenants());
        setLoading(false);
    };

    // Load cities
    const loadCities = async () => {
        try {
            setCities(await propertyService.getCities());
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to load cities"));
        }
    };

    useEffect(() => {
        loadTenants();
        loadCities();
    }, []);

    // Save or update tenant. The form only closes when the save succeeds, so nothing typed is lost on an error.
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        try {
            setLoading(true);
            const res = await tenantService.save({
                Name: tenant.name,
                Contact: tenant.phone,
                Email: tenant.email,
                CityId: tenant.cityId,
                Notes: tenant.notes,
                IsActive: tenant.isActive,
            }, editData?.tenantId);

            toast.success(res.message);
            await loadTenants();
            setVisible(false);
            setTenant(emptyTenant);
            setEditData(null);
            setValidated(false);
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

    // Edit tenant
    const handleEdit = (t) => {
        setEditData(t);
        setVisible(true);

        setTenant({
            name: t.name || "",
            email: t.email || "",
            phone: t.contact || "",
            cityId: t.cityId || "",
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
            header: "Name"
        },
        {
            accessorKey: "email",
            header: "Email"
        },
        {
            accessorKey: "isActive",
            header: "Status",
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
    });

    const handleCancel = () => {
        setTenant(emptyTenant);
        setEditData(null);
        setValidated(false);
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
                                    <span>Show</span>

                                    <select
                                        className="form-select form-select-sm"
                                        style={{
                                            maxWidth: "70px",
                                            flexGrow: 1
                                        }}
                                        value={table.getState().pagination.pageSize}
                                        onChange={(e) =>
                                            table.setPageSize(Number(e.target.value))
                                        }
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>

                                    <span>entries</span>
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
                                                        style={{ cursor: "pointer" }}
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
                                                                <strong>Phone:</strong>{" "}
                                                                {row.original.contact}
                                                            </div>

                                                            <div>
                                                                <strong>City:</strong>{" "}
                                                                {row.original.cityName}
                                                            </div>

                                                            <div>
                                                                <strong>Notes:</strong>{" "}
                                                                {row.original.notes || "-"}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>

                                </table>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">

                                <div>
                                    Showing{" "}
                                    {filteredData.length === 0
                                        ? 0
                                        : table.getState().pagination.pageIndex *
                                              table.getState().pagination.pageSize +
                                          1}{" "}
                                    to{" "}
                                    {Math.min(
                                        (table.getState().pagination.pageIndex + 1) *
                                            table.getState().pagination.pageSize,
                                        filteredData.length
                                    )}{" "}
                                    of {filteredData.length} entries
                                </div>

                                <div className="d-flex gap-1 flex-wrap">

                                    <CButton
                                        color="secondary"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        Previous
                                    </CButton>

                                    {Array.from({
                                        length: table.getPageCount()
                                    }).map((_, i) => (
                                        <CButton
                                            key={i}
                                            color={
                                                i ===
                                                table.getState().pagination.pageIndex
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                table.setPageIndex(i)
                                            }
                                        >
                                            {i + 1}
                                        </CButton>
                                    ))}

                                    <CButton
                                        color="secondary"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        Next
                                    </CButton>

                                </div>
                            </div>

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
                            className="row g-3 needs-validation"
                            noValidate
                            validated={validated}
                            onSubmit={handleSubmit}
                        >

                            <CCol md={4}>
                                <CFormLabel>Name</CFormLabel>

                                <CFormInput
                                    value={tenant.name}
                                    onChange={e =>
                                        setTenant(p => ({
                                            ...p,
                                            name: e.target.value
                                        }))
                                    }
                                    placeholder="Enter Name"
                                    required
                                />

                                <CFormFeedback invalid>
                                    Enter tenant name
                                </CFormFeedback>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Email</CFormLabel>

                                <CFormInput
                                    type="email"
                                    value={tenant.email}
                                    onChange={e =>
                                        setTenant(p => ({
                                            ...p,
                                            email: e.target.value
                                        }))
                                    }
                                    placeholder="Enter Email"
                                    required
                                />
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Phone</CFormLabel>

                                <CFormInput
                                    value={tenant.phone}
                                    onChange={e =>
                                        setTenant(p => ({
                                            ...p,
                                            phone: e.target.value
                                        }))
                                    }
                                    placeholder="Enter Phone"
                                    required
                                />
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>City</CFormLabel>

                                <CFormSelect
                                    value={tenant.cityId}
                                    onChange={e =>
                                        setTenant(p => ({
                                            ...p,
                                            cityId: e.target.value
                                        }))
                                    }
                                    required
                                >
                                    <option value="">
                                        Select City
                                    </option>

                                    {cities.map(c => (
                                        <option
                                            key={c.id}
                                            value={c.id}
                                        >
                                            {c.name}
                                        </option>
                                    ))}
                                </CFormSelect>
                            </CCol>

                            <CCol xs={12}>
                                <CFormLabel>Notes</CFormLabel>

                                <CFormTextarea
                                    value={tenant.notes || ""}
                                    onChange={e =>
                                        setTenant(p => ({
                                            ...p,
                                            notes: e.target.value
                                        }))
                                    }
                                    placeholder="Enter Notes"
                                />
                            </CCol>

                            <CCol xs={12}>
                                <CFormCheck
                                    label="Is Active"
                                    checked={tenant.isActive}
                                    onChange={e =>
                                        setTenant(p => ({
                                            ...p,
                                            isActive: e.target.checked
                                        }))
                                    }
                                />
                            </CCol>

                            <CCol
                                xs={12}
                                className="d-flex justify-content-end gap-2"
                            >
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
                            </CCol>

                        </CForm>

                    </CModalBody>
                </CModal>
            </CRow>
        </>
    );
};

export default Tenants