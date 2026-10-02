import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { getErrorMessage } from "../../api/axios";
import { propertyService } from "../../services/property.service";
import { leaseService } from "../../services/rent.service";
import TenantFilter from "../../components/rent/TenantFilter";
import { unitStatusOf } from "../../utils/unitStatus";
import { fmt } from "../../utils/rentUtils";
import { PageSizeSelect, TablePagination, tablePageProps, tablePageSizeProps, DEFAULT_PAGE_SIZE } from "../../components/common/TablePagination";
import {
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
} from "@coreui/react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";

// Current unit status (see utils/unitStatus) -> badge colour
const statusColor = (status) =>
    ({ Available: "#2eb85c", Occupied: "#0d6efd", "Under Maintenance": "#e0a800", Reserved: "#fd7e14" })[status] || "grey";

const STATUS_FILTERS = ["Available", "Occupied", "Under Maintenance"];

const PropertyDashboard = () => {
    const [properties, setProperties] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [tenantFilter, setTenantFilter] = useState(""); // "" = all tenants
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    // propertyService returns normalised rows: id, buildingName, floorNumber, unitNumber, baseRent,
    // propertyType, cityName, status, note
    const loadProperties = async () => {
        try {
            setLoading(true);
            // currentStatus is what the table shows, searches and filters on.
            // tenantName = the tenant of the unit's open lease (one per unit), from the lease list
            const [rows, leases] = await Promise.all([propertyService.getAllProperties(), leaseService.getAll()]);
            const tenantByUnit = new Map(leases.filter((l) => l.isActive).map((l) => [l.unitId, l.tenantName]));
            setProperties(rows.map((p) => ({ ...p, currentStatus: unitStatusOf(p), tenantName: tenantByUnit.get(p.id) || "" })));
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to load properties"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProperties();
    }, []);

    const toggleExpand = (id) =>
        setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

    const columns = useMemo(
        () => [
            {
                accessorKey: "expand",
                header: "",
                cell: ({ row }) => (
                    <CButton color="secondary" size="sm" onClick={() => toggleExpand(row.original.id)}>
                        {expandedRows[row.original.id] ? "-" : "+"}
                    </CButton>
                ),
            },
            { accessorKey: "buildingName", header: "Building Name" },
            { accessorKey: "floorNumber", header: "Floor" },
            { accessorKey: "unitNumber", header: "Unit" },
            { accessorKey: "tenantName", header: "Tenant", cell: ({ getValue }) => getValue() || "—" },
            { accessorKey: "baseRent", header: "Base Rent", cell: ({ getValue }) => fmt(getValue()) },
            { accessorKey: "propertyType", header: "Property Type" },
            {
                accessorKey: "currentStatus",
                header: "Status",
                cell: ({ getValue }) => (
                    <span
                        style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            color: "white",
                            backgroundColor: statusColor(getValue()),
                        }}
                    >
                        {getValue() || "Unknown"}
                    </span>
                ),
            },
        ],
        [expandedRows]
    );

    const filteredData = useMemo(
        () =>
            properties.filter(
                (p) => (!statusFilter || p.currentStatus === statusFilter) && (!tenantFilter || p.tenantName === tenantFilter)
            ),
        [properties, statusFilter, tenantFilter]
    );

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


    return (
        <>
            {loading && <Loader />}

            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4">
                        <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <strong>Properties</strong>
                        </CCardHeader>
                        <CCardBody>
                            <CRow className="align-items-center mb-2">
                                {/* Left: Show entries */}
                                <CCol xs={12} sm={6} md={4} className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                    <PageSizeSelect {...tablePageSizeProps(table)} />
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
                                    <div style={{ minWidth: "240px", maxWidth: "260px" }} title="Tenant / Company">
                                        <TenantFilter
                                            names={properties.map((p) => p.tenantName)}
                                            value={tenantFilter}
                                            onChange={setTenantFilter}
                                        />
                                    </div>
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
                                            {STATUS_FILTERS.map((s) => (
                                                <CDropdownItem key={s} onClick={() => setStatusFilter(s)}>{s}</CDropdownItem>
                                            ))}
                                        </CDropdownMenu>
                                    </CDropdown>
                                </CCol>
                            </CRow>

                            <div style={{ overflowX: "auto", width: "100%" }}>
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
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getIsSorted()
                                                            ? header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽"
                                                            : null}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.map((row) => (
                                            <React.Fragment key={row.original.id}>
                                                <tr>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <td key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </td>
                                                    ))}
                                                </tr>
                                                {expandedRows[row.original.id] && (
                                                    <tr>
                                                        <td colSpan={columns.length}>
                                                            <div>
                                                                <strong>City:</strong> {row.original.cityName || "—"}
                                                            </div>
                                                            <div>
                                                                <strong>Note:</strong> {row.original.note || "—"}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <TablePagination {...tablePageProps(table)} />
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </>
    );
};

export default PropertyDashboard;
