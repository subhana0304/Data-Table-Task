import React, { useState, useEffect, useRef } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
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
    const [inputValue, setInputValue] = useState<string>('');
    const overlayPanelRef = useRef<OverlayPanel>(null);

    // Fetch data from API
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

    // Handle selecting all rows
    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            // Create a new Set with the currently selected rows
            const updatedSelection = new Set<string>(selectedRows);

            // Add all keys from the current page
            const pageKeys = artworks.map((artwork) => artwork.title); // Assuming titles are unique row keys
            pageKeys.forEach((key: string) => {
                updatedSelection.add(key);
            });

            setSelectedRows(updatedSelection); // Update state with the new selection
        } else {
            setSelectedRows(new Set()); // Clear all selected rows
        }
        setIsHeaderChecked(selected); // Update header checkbox state
    };



    // Handle individual row selection
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

    // Calculate header checkbox state
    useEffect(() => {
        const allSelected = allRowKeys.length > 0 && allRowKeys.every((key) => selectedRows.has(key));
        setIsHeaderChecked(allSelected);
    }, [allRowKeys, selectedRows]);

    // Handle pagination change
    const onPageChange = (event: DataTablePageEvent) => {
        const nextPage = event.page ?? 0; // Ensure event.page is valid
        setCurrentPage(nextPage + 1); // Adjust for 1-based API pagination
        fetchData(nextPage + 1);
    };

    // Fetch data on initial load and when the page changes
    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    // Handle row selection using the OverlayPanel input value
    const handleOverlaySubmit = async () => {
        const numToSelect = parseInt(inputValue, 10);
        if (!numToSelect || numToSelect <= 0) {
            console.error('Invalid input value. Please enter a valid number.');
            return;
        }
    
        setLoading(true);
        const updatedSelectedRows = new Set<string>();
        let remainingToSelect = numToSelect;
    
        // Start by selecting rows from the current page
        const pageKeys = artworks.map((artwork) => artwork.title);
        for (let i = 0; i < pageKeys.length && remainingToSelect > 0; i++) {
            updatedSelectedRows.add(pageKeys[i]);
            remainingToSelect--;
        }
    
        // If there are still rows to select, fetch data from subsequent pages
        let currentPageNumber = currentPage;
        while (remainingToSelect > 0 && currentPageNumber <= Math.ceil(totalRecords / 10)) {
            // Fetch next page if not already fetched
            if (currentPageNumber !== currentPage) {
                const data = await fetchArtworks(currentPageNumber);
                const newKeys = data.data.map((item: any) => item.title);
                setAllRowKeys((prev) => Array.from(new Set([...prev, ...newKeys])));
                // Add rows from the newly fetched page until we reach the desired number
                for (let i = 0; i < newKeys.length && remainingToSelect > 0; i++) {
                    updatedSelectedRows.add(newKeys[i]);
                    remainingToSelect--;
                }
            }
            currentPageNumber++;
        }
    
        // Update the selected rows and hide the overlay
        setSelectedRows(updatedSelectedRows);
        overlayPanelRef.current?.hide();
        setLoading(false);
    };
    

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
                        <div style={{ display: 'flex', alignItems: 'center', }}>
                            <Checkbox
                                checked={isHeaderChecked}
                                onChange={(e: CheckboxChangeEvent) => handleSelectAll(e.checked ?? false)}
                            />
                            <FiChevronDown
                                style={{
                                    marginLeft: '5px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                }}
                                onClick={(e) => {
                                    if (overlayPanelRef.current?.isVisible()) {
                                        overlayPanelRef.current?.hide();
                                    } else {
                                        overlayPanelRef.current?.toggle(e);
                                    }
                                }}
                            />
                            <OverlayPanel ref={overlayPanelRef}>
                                <div
                                    style={{
                                        padding: '10px',
                                        width: '200px',
                                        margin: '140px 0 0 0',
                                        background: 'white',
                                        border: '1px solid black',
                                        borderRadius: '5px',
                                    }}
                                >
                                    <div className="p-field mb-3">
                                        <InputText
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Select Rows"
                                            className="w-full p-3 border rounded"
                                        />
                                    </div>
                                    <Button
                                        label="Submit"
                                        onClick={handleOverlaySubmit}
                                        className="text-white bg-sky-600 p-3 rounded text-center items-center justify-center"
                                    />
                                </div>
                            </OverlayPanel>
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