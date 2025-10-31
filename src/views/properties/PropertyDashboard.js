import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import { API_BASE_URL } from "../../config";
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

const Properties = () => {
    const [properties, setProperties] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(false);

    const loadProperties = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/Properties`, {
            method: 'GET',
            credentials: 'include',
        })
            .then((res) => res.json())
            .then(setProperties)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProperties();
    }, []);

    const [expandedRows, setExpandedRows] = useState({});
    const toggleExpand = (id) => {
        setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Columns definition
    const columns = useMemo(
        () => [
            {
                accessorKey: "expand",
                header: "",
                cell: ({ row }) => (
                    <CButton
                        color="secondary"
                        size="sm"
                        onClick={() => toggleExpand(row.original.UnitId)}
                    >
                        {expandedRows[row.original.UnitId] ? "-" : "+"}
                    </CButton>
                ),
            },
            { accessorKey: "BuildingName", header: "Building Name" },
            { accessorKey: "FloorNumber", header: "Floor Number" },
            { accessorKey: "UnitNumber", header: "Unit Number" },
            { accessorKey: "BaseRent", header: "Base Rent" },
            { accessorKey: "BuildingType", header: "Building Type" },
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
        ],
        [expandedRows]
    );

    // Filter data manually for status
    const filteredData = useMemo(() => {
        if (!statusFilter) return properties;
        return properties.filter((p) =>
            statusFilter === "Active" ? p.IsActive : !p.IsActive
        );
    }, [properties, statusFilter]);

    // Table setup
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
                                    {table.getRowModel().rows.map((row) => (
                                        <React.Fragment key={row.original.UnitId}>
                                            <tr>
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                            {expandedRows[row.original.UnitId] && (
                                                <tr>
                                                    <td colSpan={columns.length}>
                                                        <div>
                                                            <strong>Address:</strong> {row.original.Address}
                                                        </div>
                                                        <div>
                                                            <strong>City Name:</strong> {row.original.CityName}
                                                        </div>
                                                        <div>
                                                            <strong>Note:</strong> {row.original.Note}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
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
            </CRow>
        </>
    );
};

export default Properties;
