import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormCheck,
  CFormInput,
  CFormFeedback,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
} from "@coreui/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { toast } from 'react-toastify';

const Tenants = () => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJBbGkgUmF6YSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc2MTE5NTY4NCwiZXhwIjoxNzYxNzkwNTg0LCJpYXQiOjE3NjExOTU2ODQsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcyOTUiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3Mjk1In0.butWJIUMvib6Am9tsmdO3-MoN1EuLEiTzyjSLTusG8k";

  const emptyTenant = {
    name: "",
    email: "",
    phone: "",
    city: "",
    notes: "",
    buildingId: "",
    floorId: "",
    unitId: "",
    monthlyRent: 0,
    isActive: true,
  };

  const [tenants, setTenants] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [validated, setValidated] = useState(false);
  const [tenant, setTenant] = useState(emptyTenant);
  const [loading, setLoading] = useState(false);

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);

  const loadTenants = () => {
    setLoading(true);
    fetch("https://localhost:7295/api/Tenant/tenants", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTenants(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  // Load tenants
  useEffect(() => {
    loadTenants()
  }, []);

  // Load buildings
  useEffect(() => {
    setLoading(true);
    fetch("https://localhost:7295/api/Tenant/buildings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setBuildings)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Handle dropdown chaining
  const handleBuildingChange = (id) => {
    setTenant({ ...tenant, buildingId: id, floorId: "", unitId: "" });
    setFloors([]);
    setUnits([]);
    if (!id) return;

    setLoading(true);
    fetch(`https://localhost:7295/api/Tenant/floors?buildingId=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setFloors)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleFloorChange = (id) => {
    setTenant({ ...tenant, floorId: id, unitId: "" });
    setUnits([]);
    if (!id) return;

    setLoading(true);
    fetch(`https://localhost:7295/api/Tenant/units?floorId=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUnits)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUnitChange = (id) => {
    setTenant({ ...tenant, unitId: id });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setLoading(true)
    if (editData) {
      // Update existing tenant
      const updatedTenant = {
        TenantId: editData.TenantId,
        Name: tenant.name,
        BuildingId: tenant.buildingId,
        FloorId: tenant.floorId,
        UnitId: tenant.unitId,
        Contact: tenant.phone,
        Email: tenant.email,
        MonthlyRent: Number(tenant.monthlyRent),
        City: tenant.city,
        Notes: tenant.notes,
        IsActive: tenant.isActive
      };

      fetch("https://localhost:7295/api/Tenant/UpdateTenants", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTenant),
      })
        .then((res) => {
          if (!res.ok) toast.error("Failed to update tenant");
          return res.json();
        })
        .then((data) => {
          setTenants((prev) =>
            prev.map((t) =>
              t.TenantId === editData.TenantId ? data : t
            )
          );
          loadTenants();
          setEditData(null);
          setVisible(false);
          setTenant(emptyTenant);
          setValidated(false);
          if (data.success) {
            toast.success(data.message);
          }
          else {
            toast.error(data.errorMessage);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error updating tenant!");
        })
        .finally(() => setLoading(false));
    }
    else {
      // Add new tenant
      const newTenant = {
        Name: tenant.name,
        BuildingId: tenant.buildingId,
        FloorId: tenant.floorId,
        UnitId: tenant.unitId,
        Contact: tenant.phone,
        Email: tenant.email,
        MonthlyRent: Number(tenant.monthlyRent),
        City: tenant.city,
        Notes: tenant.notes,
        IsActive: tenant.isActive
      };

      fetch("https://localhost:7295/api/Tenant/SaveTenants", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTenant),
      })
        .then((res) => {
          if (!res.ok) toast.error("Failed to add tenant");
          return res.json();
        })
        .then((data) => {
          loadTenants();
          setVisible(false);
          setTenant(emptyTenant);
          setValidated(false);
          if (data.success) {
            toast.success(data.message);
          }
          else {
            toast.error(data.errorMessage);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error(data.errorMessage);
        })
        .finally(() => setLoading(false));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      setLoading(true);
      fetch(`https://localhost:7295/api/Tenant/DeleteTenants?tenantId=${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })
        .then((res) => {
          if (!res.ok) toast.error("Failed to delete tenant");
          return res.json();
        })
        .then((data) => {
          loadTenants();
          if (data.success) {
            toast.success(data.message);
          }
          else {
            toast.error(data.errorMessage);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error deleting tenant!");
        })
        .finally(() => {
          setLoading(false); // stop loader
        });
    }
  };

  const handleCancel = () => {
    setTenant(emptyTenant);
    setValidated(false);
    setEditData(null);
    setVisible(false);
  };

  const handleEdit = (t) => {
    setEditData(t);
    setTenant({
      name: t.Name,
      email: t.Email,
      phone: t.Contact,
      city: t.City,
      notes: t.Notes,
      buildingId: t.BuildingId || "",
      floorId: t.FloorId || "",
      unitId: t.UnitId || "",
      monthlyRent: t.MonthlyRent || 0,
      isActive: !!t.IsActive
    });
    setVisible(true);
  };

  // const handleDelete = (id) => {
  //   if (window.confirm("Are you sure you want to delete this tenant?")) {
  //     setTenants((prev) => prev.filter((t) => t.TenantId !== id));
  //   }
  // };

  const exportCSV = (columns, data, filename = "tenants.csv") => {
    const exportCols = columns.filter(
      (c) => c.accessorKey && c.accessorKey !== "actions"
    );
    const headers = exportCols.map((col) => col.header).join(",");
    const rows = data.map((row) =>
      exportCols.map((col) => row[col.accessorKey] ?? "").join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(
    () => [
      { accessorKey: "Name", header: "Name" },
      { accessorKey: "BuildingName", header: "Building Name" },
      { accessorKey: "FloorNumber", header: "Floor Number" },
      { accessorKey: "UnitNumber", header: "Unit Number" },
      { accessorKey: "Email", header: "Email" },
      { accessorKey: "Contact", header: "Phone" },
      { accessorKey: "City", header: "City" },
      { accessorKey: "MonthlyRent", header: "Monthly Rent" },
      { accessorKey: "CreatedBy", header: "Created By" },
      {
        accessorKey: "CreatedAt", header: "Created At", cell: ({ getValue }) => {
          const date = new Date(getValue());
          return date.toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
        },
      },
      {
        accessorKey: "IsActive",
        header: "Status",
        cell: ({ getValue }) => {
          const isActive = getValue() === true;
          return (
            <span
              style={{
                display: "inline-block",
                padding: "2px 6px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                color: "white",
                backgroundColor: isActive ? "green" : "grey",
              }}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
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
              onClick={() => handleDelete(row.original.TenantId)}
            >
              Delete
            </CButton>
          </>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: tenants,
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
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Tenants</strong>
              <div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  style={{ width: "200px", marginRight: "10px" }}
                />
                <CButton
                  color="success"
                  onClick={() => exportCSV(columns, tenants)}
                  className="me-2"
                >
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
              <table className="table table-bordered table-striped">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{ cursor: "pointer" }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted()] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Add/Edit Modal */}
        <CModal visible={visible} onClose={handleCancel} size="xl" backdrop="static">
          <CModalHeader>
            <CModalTitle>{editData ? "Edit Tenant" : "Add Tenant"}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CForm
              className="row g-3 needs-validation"
              noValidate
              validated={validated}
              onSubmit={handleSubmit}
            >
              <CCol md={4}>
                <CFormLabel htmlFor="tenantName">Name</CFormLabel>
                <CFormInput
                  id="tenantName"
                  value={tenant.name}
                  onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
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
                  onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                  placeholder="Enter Email"
                  required
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Phone</CFormLabel>
                <CFormInput
                  value={tenant.phone}
                  onChange={(e) => setTenant({ ...tenant, phone: e.target.value })}
                  placeholder="Enter Phone"
                  required
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Building</CFormLabel>
                <CFormSelect
                  value={tenant.buildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  required
                >
                  <option value="">Select Building</option>
                  {buildings.map((b) => (
                    <option key={b.BuildingId} value={b.BuildingId}>
                      {b.BuildingName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={4}>
                <CFormLabel>Floor</CFormLabel>
                <CFormSelect
                  value={tenant.floorId}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  disabled={!tenant.buildingId}
                  required
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => (
                    <option key={f.FloorId} value={f.FloorId}>
                      {f.FloorNumber}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={4}>
                <CFormLabel>Unit</CFormLabel>
                <CFormSelect
                  value={tenant.unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  disabled={!tenant.floorId}
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u.UnitId} value={u.UnitId}>
                      {u.UnitNumber}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={4}>
                <CFormLabel>City</CFormLabel>
                <CFormInput
                  value={tenant.city}
                  onChange={(e) => setTenant({ ...tenant, city: e.target.value })}
                  placeholder="Enter City"
                  required
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Monthly Rent</CFormLabel>
                <CFormInput
                  type="number"
                  min={1}
                  value={tenant.monthlyRent}
                  onChange={(e) => setTenant({ ...tenant, monthlyRent: e.target.value })}
                  required
                />
              </CCol>

              <CCol xs={12}>
                <CFormLabel>Notes</CFormLabel>
                <CFormTextarea
                  value={tenant.notes || ""}
                  onChange={(e) =>
                    setTenant({ ...tenant, notes: e.target.value })
                  }
                  placeholder="Enter Notes"
                />
              </CCol>

              <CCol xs={12}>
                <CFormCheck
                  id="agree"
                  label="Is Active"
                  checked={tenant.isActive}
                  onChange={(e) =>
                    setTenant({ ...tenant, isActive: e.target.checked })
                  }
                />
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2">
                <CButton color="warning" onClick={handleCancel}>
                  Cancel
                </CButton>
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
