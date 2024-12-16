import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { fetchArtworks } from '../api'; // Fetch API logic defined earlier

interface Artwork {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: string;
    date_end: string;
}

const DataTableComponent: React.FC = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]); // Holds the current page's data
    const [selectedRows, setSelectedRows] = useState<{ [key: number]: boolean }>({}); // Stores selected rows by ID
    const [loading, setLoading] = useState(false); // Loading state for table
    const [totalRecords, setTotalRecords] = useState(0); // Total records for pagination
    const [currentPage, setCurrentPage] = useState(1); // Tracks the current page

    // Fetch data for the table
    const fetchData = async (page: number) => {
        setLoading(true); // Show loading spinner
        try {
            const data = await fetchArtworks(page);
            setArtworks(
                data.data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    place_of_origin: item.place_of_origin,
                    artist_display: item.artist_display,
                    inscriptions: item.inscriptions,
                    date_start: item.date_start,
                    date_end: item.date_end,
                }))
            );
            setTotalRecords(data.pagination.total);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false); // Hide loading spinner
    };

    // Persist row selection across pages
    const handleRowSelection = (selected: boolean, rowId: number) => {
        setSelectedRows((prev) => ({
            ...prev,
            [rowId]: selected,
        }));
    };

    // Event handler for PrimeReact paginator
    const onPageChange = (event: any) => {
        const nextPage = event.page + 1; // PrimeReact uses zero-based indexing
        setCurrentPage(nextPage);
        fetchData(nextPage); // Fetch data for the new page
    };

    // Load data when the component mounts or page changes
    useEffect(() => {
        fetchData(currentPage);
    }, []);

    return (
        <div className="datatable">
            <h2 className='text-center text-3xl md:text-5xl font-bold'>Data Table</h2>
            <DataTable
                value={artworks}
                paginator
                rows={10}
                totalRecords={totalRecords}
                lazy
                loading={loading}
                onPage={onPageChange} // Handles page changes
                className="rounded-lg shadow-lg px-5 custom-pagination"
                rowClassName={() => "border-b border-gray-300"}
            >
                    {/* Selection Checkbox Column */}
                <Column
                    selectionMode="multiple"
                    headerStyle={{ width: '3em' }}
                    body={(rowData) => (
                        <Checkbox
                            checked={!!selectedRows[rowData.id]}
                            onChange={(e: any) => handleRowSelection(e.target.checked, rowData.id)}
                        />

                    )}
                />
                {/* Table Columns */}
                <Column field="title" header="Title" />
                <Column field="place_of_origin" header="Place of Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Date Start" />
                <Column field="date_end" header="Date End" />
            </DataTable>

        </div>
    );
};

export default DataTableComponent;
