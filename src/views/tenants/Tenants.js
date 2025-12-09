import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import api from "../../api/axios";
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
    // initial empty model
    const emptyTenant = {
        name: "", email: "", phone: "", notes: "",
        buildingId: "", floorId: "", unitId: "", cityId: "",
        monthlyRent: 0, isActive: true
    };

    /* ---------------------------
    - tenants: main list shown in table
    - visible: modal visibility for add/edit
    - editData: when set, modal works in edit mode
    - globalFilter: search text for table
    - validated: form validation flag for bootstrap/CoreUI validation
    - tenant: current form model for add/edit
    - loading / error: network UI states
    - statusFilter: "Active" | "Inactive" | ""
    - lookup lists: buildings, cities, floors, units
    --------------------------- */
    const [tenants, setTenants] = useState([]);
    const [visible, setVisible] = useState(false);
    const [editData, setEditData] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [validated, setValidated] = useState(false);
    const [tenant, setTenant] = useState(emptyTenant);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [error, setError] = useState(null);

    const [buildings, setBuildings] = useState([]);
    const [cities, setCities] = useState([]);
    const [floors, setFloors] = useState([]);
    const [units, setUnits] = useState([]);

    // Load tenants
    const loadTenants = async () => {
        try {
            setLoading(true);
            const res = await api.get("/Tenant/GetTenants");
            setTenants(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load tenants.");
        } finally {
            setLoading(false);
        }
    };

    // Load buildings
    const loadBuildings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/Tenant/GetBuildings");
            setBuildings(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load buildings.");
        } finally {
            setLoading(false);
        }
    };

    // Load cities
    const loadCities = async () => {
        try {
            setLoading(true);
            const res = await api.get("/Tenant/GetCities");
            setCities(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load cities.");
        } finally {
            setLoading(false);
        }
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

        try {
            setLoading(true);
            const res = await api.get(`/Tenant/GetFloorsByBuilding?buildingId=${id}`);
            setFloors(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load floors.");
        } finally {
            setLoading(false);
        }
    };

    // Handle floor selection
    const handleFloorChange = async (id) => {
        setTenant(p => ({ ...p, floorId: id, unitId: "" }));
        setUnits([]);
        if (!id) return;

        try {
            setLoading(true);
            const res = await api.get(`/Tenant/GetUnitsByFloor?floorId=${id}`);
            setUnits(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load units.");
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

        try {
            setLoading(true);

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

            let res;
            if (editData) {
                res = await api.put("/Tenant/Update", { TenantId: editData.TenantId, ...tenantData });
            } else {
                res = await api.post("/Tenant/Create", tenantData);
            }

            const data = res.data;
            if (data.isSuccess) toast.success(data.message);
            else toast.error(data.message || "Something went wrong");

            setError(null);
            await loadTenants();           // refresh table
            setVisible(false);             // close modal
            setTenant(emptyTenant);        // reset form
            setEditData(null);
            setValidated(false);

        } catch (err) {
            console.error(err);
            setError("Failed to save tenant.");
            toast.error("Error saving tenant!");
        } finally {
            setLoading(false);
        }
    };

    // Delete tenant
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tenant?")) return;

        try {
            setLoading(true);
            const res = await api.delete(`/Tenant/Delete?tenantId=${id}`);
            const data = res.data;

            if (data.isSuccess) toast.success(data.message);
            else toast.error(data.message);

            setError(null);
            loadTenants();
        } catch (err) {
            console.error(err);
            setError("Failed to delete tenant.");
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
                api.get(`/Tenant/GetFloorsByBuilding?buildingId=${t.BuildingId}`).then(r => r.data),
                api.get(`/Tenant/GetUnitsByFloor?floorId=${t.FloorId}`).then(r => r.data)
            ]);

            setFloors(floorsData);
            setUnits(unitsData);
            setTenant(p => ({ ...p, floorId: t.FloorId || "", unitId: t.UnitId || "" }));
            setError(null);

        } catch (err) {
            console.error(err);
            setError("Failed to load tenant details.");
            toast.error("Error loading tenant data!");
        } finally {
            setLoading(false);
        }
    };

    const [expandedRows, setExpandedRows] = useState({});
    const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    const columns = useMemo(() => [
        {
            accessorKey: "expand",
            header: "",
            cell: ({ row }) => <CButton color="secondary" size="sm" onClick={() => toggleExpand(row.original.TenantId)}>
                {expandedRows[row.original.TenantId] ? "-" : "+"}
            </CButton>
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

    const handleCancel = () => {
        setTenant(emptyTenant);
        setEditData(null);
        setValidated(false);
        setVisible(false);
        setError(null);
    };

    return (
        <>
            {loading && <Loader />}
            {error && <div className="text-danger mb-3">{error}</div>}

            <CRow>
                {/* Main Page */}
                <CCol xs={12}>
                    <CCard className="mb-4">
                        <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <strong>Tenants</strong>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <CButton color="success" className="me-2">Export CSV</CButton>
                                <CButton color="primary" onClick={() => {
                                    setEditData(null);
                                    setTenant(emptyTenant);
                                    setVisible(true);
                                }}>
                                    + Add Tenant
                                </CButton>
                            </div>
                        </CCardHeader>
                        <CCardBody>
                            <CRow className="align-items-center mb-2">

                                {/* Left: Show entries */}
                                <CCol xs={12} sm={6} md={4} className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                    <span>Show</span>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ maxWidth: "70px", flexGrow: 1 }}
                                        value={table.getState().pagination.pageSize}
                                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                    <span>entries</span>
                                </CCol>

                                {/* Right: Search + Status Filter */}
                                <CCol xs={12} sm={6} md={8} className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={globalFilter ?? ""}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        className="form-control"
                                        style={{ maxWidth: "220px", flexGrow: 1 }}
                                    />

                                    <CDropdown className="flex-shrink-0" style={{ minWidth: "150px" }}>
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

                            {/* Table */}
                            <div style={{ overflowX: "auto", width: "100%" }}>
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
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getIsSorted() ? (
                                                            header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽"
                                                        ) : null}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>

                                    <tbody>
                                        {table.getRowModel().rows.map(row => (
                                            <React.Fragment key={row.original.TenantId}>
                                                <tr>
                                                    {row.getVisibleCells().map(cell => (
                                                        <td key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </td>
                                                    ))}
                                                </tr>

                                                {expandedRows[row.original.TenantId] && (
                                                    <tr>
                                                        <td colSpan={columns.length}>
                                                            <div><strong>Phone:</strong> {row.original.Contact}</div>
                                                            <div><strong>City:</strong> {row.original.CityName}</div>
                                                            <div><strong>Monthly Rent:</strong> {row.original.MonthlyRent}</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">

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
                    <CModalHeader>
                        <CModalTitle>{editData ? "Edit Tenant" : "Add Tenant"}</CModalTitle>
                    </CModalHeader>
                    <CModalBody>

                        <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>

                            <CCol md={4}>
                                <CFormLabel>Name</CFormLabel>
                                <CFormInput
                                    value={tenant.name}
                                    onChange={e => setTenant(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Enter Name"
                                    required
                                />
                                <CFormFeedback invalid>Enter tenant name</CFormFeedback>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Email</CFormLabel>
                                <CFormInput
                                    type="email"
                                    value={tenant.email}
                                    onChange={e => setTenant(p => ({ ...p, email: e.target.value }))}
                                    placeholder="Enter Email"
                                    required
                                />
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Phone</CFormLabel>
                                <CFormInput
                                    value={tenant.phone}
                                    onChange={e => setTenant(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="Enter Phone"
                                    required
                                />
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Building</CFormLabel>
                                <CFormSelect
                                    value={tenant.buildingId}
                                    onChange={e => handleBuildingChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select Building</option>
                                    {buildings.map(b => (
                                        <option key={b.BuildingId} value={b.BuildingId}>{b.BuildingName}</option>
                                    ))}
                                </CFormSelect>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Floor</CFormLabel>
                                <CFormSelect
                                    value={tenant.floorId}
                                    onChange={e => handleFloorChange(e.target.value)}
                                    disabled={!tenant.buildingId}
                                    required
                                >
                                    <option value="">Select Floor</option>
                                    {floors.map(f => (
                                        <option key={f.FloorId} value={f.FloorId}>{f.FloorNumber}</option>
                                    ))}
                                </CFormSelect>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Unit</CFormLabel>
                                <CFormSelect
                                    value={tenant.unitId}
                                    onChange={e => handleUnitChange(e.target.value)}
                                    disabled={!tenant.floorId}
                                    required
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => (
                                        <option key={u.UnitId} value={u.UnitId}>{u.UnitNumber}</option>
                                    ))}
                                </CFormSelect>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>City</CFormLabel>
                                <CFormSelect
                                    value={tenant.cityId}
                                    onChange={e => setTenant(p => ({ ...p, cityId: e.target.value }))}
                                    required
                                >
                                    <option value="">Select City</option>
                                    {cities.map(c => (
                                        <option key={c.Id} value={c.Id}>{c.Name}</option>
                                    ))}
                                </CFormSelect>
                            </CCol>

                            <CCol md={4}>
                                <CFormLabel>Monthly Rent</CFormLabel>
                                <CFormInput
                                    type="number"
                                    min={1}
                                    value={tenant.monthlyRent}
                                    onChange={e => setTenant(p => ({ ...p, monthlyRent: e.target.value }))}
                                    required
                                />
                            </CCol>

                            <CCol xs={12}>
                                <CFormLabel>Notes</CFormLabel>
                                <CFormTextarea
                                    value={tenant.notes || ""}
                                    onChange={e => setTenant(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Enter Notes"
                                />
                            </CCol>

                            <CCol xs={12}>
                                <CFormCheck
                                    label="Is Active"
                                    checked={tenant.isActive}
                                    onChange={e => setTenant(p => ({ ...p, isActive: e.target.checked }))}
                                />
                            </CCol>

                            <CCol xs={12} className="d-flex justify-content-end gap-2">
                                <CButton color="warning" onClick={handleCancel}>Cancel</CButton>
                                <CButton color="primary" type="submit">
                                    {editData ? "Update Tenant" : "Add Tenant"}
                                </CButton>
                            </CCol>

                        </CForm>

                    </CModalBody>
                </CModal>
            </CRow>
        </>
    );
};

export default Tenants;