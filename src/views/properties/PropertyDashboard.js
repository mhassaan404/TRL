import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { getErrorMessage } from "../../api/axios";
import { propertyService } from "../../services/property.service";
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

// Unit status (Available / Rented / Reserved / Under Maintenance) -> badge colour
const statusColor = (status) =>
    ({ Available: "green", Rented: "#0d6efd", Reserved: "#fd7e14" })[status] || "grey";

const PropertyDashboard = () => {
    const [properties, setProperties] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    // propertyService returns normalised rows: id, buildingName, floorNumber, unitNumber, baseRent,
    // propertyType, cityName, status, note
    const loadProperties = async () => {
        try {
            setLoading(true);
            setProperties(await propertyService.getAllProperties());
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

    const statuses = useMemo(
        () => [...new Set(properties.map((p) => p.status).filter(Boolean))].sort(),
        [properties]
    );

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
            { accessorKey: "floorNumber", header: "Floor Number" },
            { accessorKey: "unitNumber", header: "Unit Number" },
            { accessorKey: "baseRent", header: "Base Rent" },
            { accessorKey: "propertyType", header: "Property Type" },
            {
                accessorKey: "status",
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
        () => (statusFilter ? properties.filter((p) => p.status === statusFilter) : properties),
        [properties, statusFilter]
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
        initialState: { pagination: { pageSize: 10 } },
    });

    const { pageIndex, pageSize } = table.getState().pagination;

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
                                    <span>Show</span>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ maxWidth: "70px", flexGrow: 1 }}
                                        value={pageSize}
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
                                            {statuses.map((s) => (
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

                            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                                <div>
                                    Showing {filteredData.length ? pageIndex * pageSize + 1 : 0} to{" "}
                                    {Math.min((pageIndex + 1) * pageSize, filteredData.length)} of {filteredData.length} entries
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
                                            color={i === pageIndex ? "primary" : "secondary"}
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
            </CRow>
        </>
    );
};

export default PropertyDashboard;
