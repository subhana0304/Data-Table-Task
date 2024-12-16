import React, { useState, useEffect } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { fetchArtworks } from '../api';
import { FiChevronDown } from 'react-icons/fi';



interface Artwork {
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: string;
    date_end: string;
}

const DataTableComponent: React.FC = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [allRowKeys, setAllRowKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isHeaderChecked, setIsHeaderChecked] = useState(false);

    const fetchData = async (page: number) => {
        setLoading(true);
        try {
            const data = await fetchArtworks(page);
            const fetchedArtworks = data.data.map((item: any) => ({
                title: item.title,
                place_of_origin: item.place_of_origin,
                artist_display: item.artist_display,
                inscriptions: item.inscriptions,
                date_start: item.date_start,
                date_end: item.date_end,
            }));
            setArtworks(fetchedArtworks);
            setTotalRecords(data.pagination.total);
            const newRowKeys = data.data.map((item: any) => item.title);
            setAllRowKeys((prev) => {
                const newKeys = new Set([...prev, ...newRowKeys]);
                return Array.from(newKeys);
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedRows(new Set(allRowKeys));
        } else {
            setSelectedRows(new Set());
        }
        setIsHeaderChecked(selected);
    };



    const handleRowSelection = (selected: boolean, rowKey: string) => {
        setSelectedRows((prev) => {
            const updatedSelection = new Set(prev);
            if (selected) {
                updatedSelection.add(rowKey);
            } else {
                updatedSelection.delete(rowKey);
            }
            return updatedSelection;
        });
    };

    useEffect(() => {
        const allSelected = allRowKeys.length > 0 && allRowKeys.every((key) => selectedRows.has(key));
        setIsHeaderChecked(allSelected);
    }, [allRowKeys, selectedRows]);

    const onPageChange = (event: DataTablePageEvent) => {
        const nextPage = event.page ?? 0; // Ensure event.page is valid
        setCurrentPage(nextPage + 1); // Adjust for 1-based API pagination
        fetchData(nextPage + 1);
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    return (
        <div className="datatable">
            <h2 className="text-center text-3xl md:text-5xl font-bold">Data Table</h2>
            <DataTable
                value={artworks}
                paginator
                rows={10}
                totalRecords={totalRecords}
                lazy
                loading={loading}
                onPage={onPageChange}
                className="rounded-lg shadow-lg px-5 custom-pagination"
                rowClassName={() => 'border-b border-gray-300'}
            >
                <Column
                    header={() => (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={isHeaderChecked}
                                onChange={(e: CheckboxChangeEvent) => handleSelectAll(e.checked ?? false)}
                            />
                            <FiChevronDown
                                style={{
                                    marginLeft: '5px',
                                    fontSize: '16px', // Adjust size as needed
                                    cursor: 'pointer', // Makes the arrow clickable
                                }}
                            />
                        </div>
                    )}
                    body={(rowData) => (
                        <Checkbox
                            checked={selectedRows.has(rowData.title)}
                            onChange={(e: CheckboxChangeEvent) => handleRowSelection(e.checked ?? false, rowData.title)}
                        />
                    )}
                    headerStyle={{ width: '3em' }}
                />
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
