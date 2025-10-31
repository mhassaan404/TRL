import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import { API_BASE_URL } from "../../config";
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
        name: "", email: "", phone: "", notes: "",
        buildingId: "", floorId: "", unitId: "", cityId: "",
        monthlyRent: 0, isActive: true
    };

    const [tenants, setTenants] = useState([]);
    const [visible, setVisible] = useState(false);
    const [editData, setEditData] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [validated, setValidated] = useState(false);
    const [tenant, setTenant] = useState(emptyTenant);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    const [buildings, setBuildings] = useState([]);
    const [cities, setCities] = useState([]);
    const [floors, setFloors] = useState([]);
    const [units, setUnits] = useState([]);

    // Load tenants
    const loadTenants = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/Tenant/GetTenants`, {
            method: "GET",
            credentials: "include",
        })
            .then(res => res.json())
            .then(setTenants)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    // Load buildings
    const loadBuildings = async () => {
        const res = await fetch(`${API_BASE_URL}/Tenant/GetBuildings`, {
            method: "GET",
            credentials: "include",
        });
        const data = await res.json();
        setBuildings(data);
    };

    // Load cities
    const loadCities = async () => {
        const res = await fetch(`${API_BASE_URL}/Tenant/GetCities`, {
            method: "GET",
            credentials: "include",
        });
        const data = await res.json();
        setCities(data);
    };

    useEffect(() => {
        loadTenants();
        loadBuildings();
        loadCities();
    }, []);

    // Handle building selection
    const handleBuildingChange = async (id) => {
        setTenant(p => ({ ...p, buildingId: id, floorId: "", unitId: "" }));
        setFloors([]); setUnits([]);
        if (!id) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/Tenant/GetFloorsByBuilding?buildingId=${id}`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            setFloors(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle floor selection
    const handleFloorChange = async (id) => {
        setTenant(p => ({ ...p, floorId: id, unitId: "" }));
        setUnits([]);
        if (!id) return;

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/Tenant/GetUnitsByFloor?floorId=${id}`, {
                method: "GET", credentials: "include"
            });
            const data = await res.json();
            setUnits(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnitChange = (id) => setTenant(p => ({ ...p, unitId: id }));

    // Save or update tenant
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);
        try {
            const url = editData ? `${API_BASE_URL}/Tenant/Update` : `${API_BASE_URL}/Tenant/Create`;
            const method = editData ? "PUT" : "POST";

            const tenantData = {
                Name: tenant.name,
                BuildingId: tenant.buildingId,
                FloorId: tenant.floorId,
                UnitId: tenant.unitId,
                Contact: tenant.phone,
                Email: tenant.email,
                MonthlyRent: Number(tenant.monthlyRent),
                CityId: tenant.cityId,
                Notes: tenant.notes,
                IsActive: tenant.isActive,
            };

            const body = editData
                ? JSON.stringify({ TenantId: editData.TenantId, ...tenantData })
                : JSON.stringify(tenantData);

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body,
            });

            const data = await res.json();
            if (data.success) toast.success(data.message);
            else toast.error(data.errorMessage || "Something went wrong");

            loadTenants();
            setVisible(false);
            setTenant(emptyTenant);
            setEditData(null);
            setValidated(false);
        } catch (err) {
            console.error(err);
            toast.error("Error saving tenant!");
        } finally {
            setLoading(false);
        }
    };

    // Delete tenant
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tenant?")) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/Tenant/Delete?tenantId=${id}`, {
                method: "DELETE", credentials: "include"
            });
            const data = await res.json();
            if (data.success) toast.success(data.message);
            else toast.error(data.errorMessage);
            loadTenants();
        } catch (err) {
            console.error(err);
            toast.error("Error deleting tenant!");
        } finally {
            setLoading(false);
        }
    };

    // Edit tenant
    const handleEdit = async (t) => {
        setEditData(t);
        setVisible(true);

        if (buildings.length === 0) await loadBuildings();
        setTenant({
            name: t.Name, email: t.Email, phone: t.Contact,
            cityId: t.CityId, notes: t.Notes,
            buildingId: t.BuildingId || "", floorId: "", unitId: "",
            monthlyRent: t.MonthlyRent || 0, isActive: !!t.IsActive,
        });

        try {
            setLoading(true);
            const [floorsData, unitsData] = await Promise.all([
                fetch(`${API_BASE_URL}/Tenant/GetFloorsByBuilding?buildingId=${t.BuildingId}`, { method: 'GET', credentials: 'include' }).then(r => r.json()),
                fetch(`${API_BASE_URL}/Tenant/GetUnitsByFloor?floorId=${t.FloorId}`, { method: 'GET', credentials: 'include' }).then(r => r.json())
            ]);

            setFloors(floorsData); setUnits(unitsData);
            setTenant(p => ({ ...p, floorId: t.FloorId || "", unitId: t.UnitId || "" }));

        } catch (err) {
            console.error(err);
            toast.error("Error deleting tenant!");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setTenant(emptyTenant);
        setEditData(null);
        setValidated(false);
        setVisible(false);
    };

    const [expandedRows, setExpandedRows] = useState({});
    const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    const columns = useMemo(() => [
        {
            accessorKey: "expand",
            header: "",
            cell: ({ row }) => <CButton color="secondary" size="sm" onClick={() => toggleExpand(row.original.TenantId)}>
                {expandedRows[row.original.TenantId] ? "-" : "+"}</CButton>
        },
        { accessorKey: "Name", header: "Name" },
        { accessorKey: "BuildingName", header: "Building Name" },
        { accessorKey: "FloorNumber", header: "Floor Number" },
        { accessorKey: "UnitNumber", header: "Unit Number" },
        { accessorKey: "Email", header: "Email" },
        {
            accessorKey: "IsActive", header: "Status",
            cell: ({ getValue }) => <span style={{
                display: "inline-block", padding: "2px 6px",
                borderRadius: "12px", fontSize: "0.85rem",
                color: "white", backgroundColor: getValue() ? "green" : "grey"
            }}>{getValue() ? "Active" : "Inactive"}</span>
        },
        {
            accessorKey: "actions", header: "Actions",
            cell: ({ row }) => <>
                <CButton size="sm" color="info" className="me-2" onClick={() => handleEdit(row.original)}>Edit</CButton>
                <CButton size="sm" color="danger" onClick={() => handleDelete(row.original.TenantId)}>Delete</CButton>
            </>
        },
    ], [expandedRows]);

    // Filter data manually for status
    const filteredData = useMemo(() => {
        if (!statusFilter) return tenants;
        return tenants.filter((p) =>
            statusFilter === "Active" ? p.IsActive : !p.IsActive
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

    return (
        <>
            {loading && <Loader />}
            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4">
                        <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <strong>Properties</strong>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <CButton color="success" className="me-2" onClick={() => {
                                }}>Export CSV</CButton>
                                <CButton color="primary" onClick={() => { setEditData(null); setTenant(emptyTenant); setVisible(true); }}>
                                    + Add Tenant
                                </CButton>
                            </div>
                        </CCardHeader>
                        <CCardBody>
                            <CRow className="align-items-center mb-2">
                                <CCol md={1}>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span>Show</span>
                                        <select
                                            className="form-select form-select-sm"
                                            value={table.getState().pagination.pageSize}
                                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                                        >
                                            {[5, 10, 20, 50].map((size) => (
                                                <option key={size} value={size}>
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <span>entries</span>
                                    </div>
                                </CCol>

                                <CCol md={8} className="d-flex align-items-center justify-content-end gap-2 flex-wrap ms-auto">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={globalFilter ?? ""}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        className="form-control"
                                        style={{ width: "180px" }}
                                    />
                                    <CDropdown className="flex-shrink-0" style={{ minWidth: "160px" }}>
                                        <CDropdownToggle
                                            as="div"
                                            color="info"
                                            variant="outline"
                                            className="w-100 text-center"
                                            style={{ cursor: "pointer" }}
                                        >
                                            {statusFilter || "All"}
                                        </CDropdownToggle>
                                        <CDropdownMenu className="w-100 text-center" style={{ cursor: "pointer" }}>
                                            <CDropdownItem onClick={() => setStatusFilter("")}>All</CDropdownItem>
                                            <CDropdownItem onClick={() => setStatusFilter("Active")}>Active</CDropdownItem>
                                            <CDropdownItem onClick={() => setStatusFilter("Inactive")}>Inactive</CDropdownItem>
                                        </CDropdownMenu>
                                    </CDropdown>
                                </CCol>
                            </CRow>

                            <table className="table table-bordered table-striped">
                                <thead>
                                    {table.getHeaderGroups().map(hg => <tr key={hg.id}>
                                        {hg.headers.map(header => <th key={header.id} onClick={header.column.getToggleSortingHandler()} style={{ cursor: "pointer" }}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() ? (header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽") : null}
                                        </th>)}
                                    </tr>)}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map(row => <React.Fragment key={row.original.TenantId}>
                                        <tr>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                                        {expandedRows[row.original.TenantId] && (
                                            <tr><td colSpan={columns.length}>
                                                <div><strong>Phone:</strong> {row.original.Contact}</div>
                                                <div><strong>City:</strong> {row.original.CityName}</div>
                                                <div><strong>Monthly Rent:</strong> {row.original.MonthlyRent}</div>
                                            </td></tr>
                                        )}
                                    </React.Fragment>)}
                                </tbody>
                            </table>

                            {/* Bottom: entries info and pagination */}
                            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                                {/* Bottom left: Showing X to Y of Z */}
                                <div>
                                    Showing{" "}
                                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{" "}
                                    to{" "}
                                    {Math.min(
                                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                        filteredData.length
                                    )}{" "}
                                    of {filteredData.length} entries
                                </div>

                                {/* Bottom right: Pagination buttons */}
                                <div className="d-flex gap-1 flex-wrap">
                                    <CButton
                                        color="secondary"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        Previous
                                    </CButton>

                                    {Array.from({ length: table.getPageCount() }).map((_, i) => (
                                        <CButton
                                            key={i}
                                            color={i === table.getState().pagination.pageIndex ? "primary" : "secondary"}
                                            size="sm"
                                            onClick={() => table.setPageIndex(i)}
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
                <CModal visible={visible} onClose={handleCancel} size="xl" backdrop="static">
                    <CModalHeader><CModalTitle>{editData ? "Edit Tenant" : "Add Tenant"}</CModalTitle></CModalHeader>
                    <CModalBody>
                        <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
                            {/* Name, Email, Phone */}
                            <CCol md={4}><CFormLabel>Name</CFormLabel>
                                <CFormInput value={tenant.name} onChange={e => setTenant(p => ({ ...p, name: e.target.value }))} placeholder="Enter Name" required />
                                <CFormFeedback invalid>Enter tenant name</CFormFeedback>
                            </CCol>
                            <CCol md={4}><CFormLabel>Email</CFormLabel>
                                <CFormInput type="email" value={tenant.email} onChange={e => setTenant(p => ({ ...p, email: e.target.value }))} placeholder="Enter Email" required />
                            </CCol>
                            <CCol md={4}><CFormLabel>Phone</CFormLabel>
                                <CFormInput value={tenant.phone} onChange={e => setTenant(p => ({ ...p, phone: e.target.value }))} placeholder="Enter Phone" required />
                            </CCol>

                            {/* Building / Floor / Unit */}
                            <CCol md={4}><CFormLabel>Building</CFormLabel>
                                <CFormSelect value={tenant.buildingId} onChange={e => handleBuildingChange(e.target.value)} required>
                                    <option value="">Select Building</option>
                                    {buildings.map(b => <option key={b.BuildingId} value={b.BuildingId}>{b.BuildingName}</option>)}
                                </CFormSelect>
                            </CCol>
                            <CCol md={4}><CFormLabel>Floor</CFormLabel>
                                <CFormSelect value={tenant.floorId} onChange={e => handleFloorChange(e.target.value)} disabled={!tenant.buildingId} required>
                                    <option value="">Select Floor</option>
                                    {floors.map(f => <option key={f.FloorId} value={f.FloorId}>{f.FloorNumber}</option>)}
                                </CFormSelect>
                            </CCol>
                            <CCol md={4}><CFormLabel>Unit</CFormLabel>
                                <CFormSelect value={tenant.unitId} onChange={e => handleUnitChange(e.target.value)} disabled={!tenant.floorId} required>
                                    <option value="">Select Unit</option>
                                    {units.map(u => <option key={u.UnitId} value={u.UnitId}>{u.UnitNumber}</option>)}
                                </CFormSelect>
                            </CCol>

                            <CCol md={4}><CFormLabel>City</CFormLabel>
                                <CFormSelect value={tenant.cityId} onChange={e => setTenant(p => ({ ...p, cityId: e.target.value }))} required>
                                    <option value="">Select City</option>
                                    {cities.map(c => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
                                </CFormSelect>
                            </CCol>

                            <CCol md={4}><CFormLabel>Monthly Rent</CFormLabel>
                                <CFormInput type="number" min={1} value={tenant.monthlyRent} onChange={e => setTenant(p => ({ ...p, monthlyRent: e.target.value }))} required />
                            </CCol>
                            <CCol xs={12}><CFormLabel>Notes</CFormLabel>
                                <CFormTextarea value={tenant.notes || ""} onChange={e => setTenant(p => ({ ...p, notes: e.target.value }))} placeholder="Enter Notes" />
                            </CCol>

                            <CCol xs={12}><CFormCheck label="Is Active" checked={tenant.isActive} onChange={e => setTenant(p => ({ ...p, isActive: e.target.checked }))} /></CCol>

                            <CCol xs={12} className="d-flex justify-content-end gap-2">
                                <CButton color="warning" onClick={handleCancel}>Cancel</CButton>
                                <CButton color="primary" type="submit">{editData ? "Update Tenant" : "Add Tenant"}</CButton>
                            </CCol>
                        </CForm>
                    </CModalBody>
                </CModal>
            </CRow>
        </>
    );
};

export default Tenants;