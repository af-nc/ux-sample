import { API_CONFIG, unavailableEndpoints } from './config.js';
import { formatClinicName, formatDate, showApiStatus } from './utils.js';
import { showLoading, hideLoading } from './utils.js';
import { handleAvailabilityFeedback } from './feedback.js';

function updatePaginationControls(table, totalRecords) {
    if (!table || !table.page) return;

    const info = table.page.info();
    if (!info) return;

    const currentPage = Math.floor(info.start / info.length) + 1;
    const totalPages = Math.ceil(totalRecords / info.length);
    
    console.log('Pagination Update:', {
        currentPage,
        totalPages,
        totalRecords
    });
    
    $('#info').text(currentPage + ' of ' + (totalPages || 1));
    $('#pageLengthSelect').val(info.length);
}

export function initializeDoctorTable() {
    let currentPageSize = 10;
    let lastEvaluatedKey = null;
    let isFetching = false;
    let totalRecords = 0;

    const table = $('#doctorTable').DataTable({
        autoWidth: false,
        dom: 't',  // Only show the table
        pageLength: currentPageSize,
        processing: true,
        serverSide: false, // We'll handle data loading ourselves
        deferRender: true,
        columns: [
            { data: 'name' },
            {
                data: 'gender',
                render: function (data) {
                    return '<span class="banner-tag">' + data + '</span>';
                }
            },
            {
                data: 'clinicName',
                render: function (data) {
                    const className = data.toLowerCase().replace(/\s+/g, '-');
                    return '<span class="region-tag ' + className + '">' + formatClinicName(data) + '</span>';
                }
            },
            {
                data: 'accepting_patients',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'filter') {
                        return data ? 'IS ACCEPTING' : 'NOT ACCEPTING';
                    }
                    const className = data ? 'open' : 'closed';
                    return '<div class="status ' + className + '">' + (data ? 'IS ACCEPTING' : 'NOT ACCEPTING') + '</div>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    if (type === 'display') {
                        return `
                            <div class="availability-container">
                                <div class="availability-group">
                                    <button onclick="handleAvailabilityFeedback('${row.id}', true)" class="btn-agree">
                                        <i class="fas fa-thumbs-up"></i> Agree (${row.availability_agree})
                                    </button>
                                </div>
                                <div class="availability-group">
                                    <button onclick="handleAvailabilityFeedback('${row.id}', false)" class="btn-disagree">
                                        <i class="fas fa-thumbs-down"></i> Disagree (${row.availability_disagree})
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    return data.availability_agree + data.availability_disagree;
                }
            },
            {
                data: 'last_updated',
                render: function (data) {
                    return formatDate(data);
                }
            }
        ],
        order: [[0, 'asc']],
        ordering: true,
        responsive: true,
        drawCallback: function () {
            updatePaginationControls(this.api(), totalRecords);
        }
    });

    // Function to fetch data from the API
    async function fetchData(isNextPage = false) {
        if (isFetching) {
            console.log('Skipping fetch: request in progress');
            return;
        }

        console.log('Fetching data:', {
            pageSize: currentPageSize,
            lastEvaluatedKey,
            isNextPage
        });

        isFetching = true;
        showLoading('table');

        try {
            const params = new URLSearchParams({
                pageSize: currentPageSize.toString()
            });

            // Add lastEvaluatedKey if available and requesting next page
            if (isNextPage && lastEvaluatedKey) {
                params.append('lastEvaluatedKey', JSON.stringify(lastEvaluatedKey));
            } else if (!isNextPage) {
                // Reset lastEvaluatedKey if not requesting next page
                lastEvaluatedKey = null;
            }

            const fullUrl = `${API_CONFIG.baseUrl}/doctors?${params.toString()}`;
            console.log('Fetching from URL:', fullUrl);

            const response = await $.ajax({
                url: fullUrl,
                type: 'GET',
                headers: {
                    ...API_CONFIG.headers
                }
            });

            const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
            
            // Detailed logging of the response data
            console.log('API Response Full Data:', {
                meta: parsedResponse.meta,
                dataCount: parsedResponse.data?.length,
                firstRecord: parsedResponse.data?.[0],
                lastRecord: parsedResponse.data?.[parsedResponse.data.length - 1],
                nextKey: parsedResponse.meta?.lastEvaluatedKey
            });

            if (parsedResponse?.data?.length > 0) {
                // Clear table only if this is not a "next page" request
                if (!isNextPage) {
                    table.clear();
                }
                
                // Add new records to table
                table.rows.add(parsedResponse.data).draw(false);
                
                // Update total records and lastEvaluatedKey
                totalRecords = parsedResponse.meta?.total || 0;
                lastEvaluatedKey = parsedResponse.meta?.lastEvaluatedKey;
                
                console.log('Updated table state:', {
                    totalRecords,
                    lastEvaluatedKey,
                    currentPageSize,
                    tableRows: table.data().length,
                    hasNextPage: !!lastEvaluatedKey
                });

                // Update pagination controls
                $('#nextPage').prop('disabled', !lastEvaluatedKey);
                $('#prevPage').prop('disabled', !isNextPage);
                
                // Update info text to show current range
                const currentCount = table.data().length;
                const totalPages = Math.ceil(totalRecords / currentPageSize);
                const currentPage = Math.ceil(currentCount / currentPageSize);
                $('#info').text(`${currentPage} of ${totalPages} (${currentCount} of ${totalRecords} records)`);
            } else {
                console.log('No records received');
                if (!isNextPage) {
                    table.clear().draw();
                }
            }

            updatePaginationControls(table, totalRecords);

        } catch (error) {
            console.error('Error fetching data:', error);
            console.error('Error details:', {
                status: error.status,
                statusText: error.statusText,
                responseText: error.responseText
            });
            handleError();
        } finally {
            isFetching = false;
            hideLoading('table');
        }
    }

    // Error handling function
    function handleError() {
        console.log('Handling error');
        unavailableEndpoints.add('doctors data');
        showApiStatus();

        // Load fallback data only if no records loaded yet
        if (table.data().length === 0) {
            console.log('Loading fallback data');
            $.ajax({
                url: 'doctors.json',
                dataType: 'json',
                success: function (data) {
                    console.log('Fallback data loaded:', {
                        records: data.length,
                        firstRecord: data[0]?.name,
                        lastRecord: data[data.length - 1]?.name
                    });
                    table.clear().rows.add(data).draw();
                    totalRecords = data.length;
                    lastEvaluatedKey = null;
                    updatePaginationControls(table, totalRecords);
                },
                error: function (fallbackError) {
                    console.error('Error loading fallback data:', fallbackError);
                }
            });
        }
    }

    // Initialize shared pagination controls
    $('#pageLengthSelect').on('change', function() {
        currentPageSize = parseInt($(this).val());
        lastEvaluatedKey = null; // Reset pagination when changing page size
        fetchData(false);
    });

    $('#prevPage').on('click', function() {
        // For now, just reload first page since we don't track previous pages
        lastEvaluatedKey = null;
        fetchData(false);
    });

    $('#nextPage').on('click', function() {
        if (lastEvaluatedKey) {
            fetchData(true);
        }
    });

    // Initial data load
    console.log('Starting initial data fetch');
    fetchData(false);

    return table;
}

export function initializeClinicTable() {
    const table = $('#clinicTable').DataTable({
        autoWidth: false,
        dom: 't',  // Only show the table
        pageLength: 10,
        processing: true,
        serverSide: true,
        deferRender: true,
        ajax: {
            url: `${API_CONFIG.baseUrl}/clinics`,
            type: 'GET',
            data: function (d) {
                const page = (d.start / d.length) + 1;
                console.log('Requesting page:', page);
                return {
                    page: page,
                    per_page: d.length,
                    sort: d.columns[d.order[0].column].data,
                    order: d.order[0].dir
                };
            },
            beforeSend: function () {
                showLoading('table');
            },
            complete: function () {
                hideLoading('table');
            },
            dataSrc: function (response) {
                console.log('Received clinic data:', response);

                // Handle empty response by returning empty array and showing fallback
                if (!response || !response.data) {
                    console.log('No clinic data received, loading fallback');
                    loadFallbackClinicData();
                    return [];
                }

                return response.data;
            }
        },
        columns: [
            {
                data: 'name',
                render: function (data) {
                    const className = data.toLowerCase().replace(/\s+/g, '-');
                    return '<span class="region-tag ' + className + '">' + formatClinicName(data) + '</span>';
                }
            },
            {
                data: 'accepting_patients',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'filter') {
                        return data ? 'IS ACCEPTING' : 'NOT ACCEPTING';
                    }
                    const className = data ? 'open' : 'closed';
                    return '<div class="status ' + className + '">' + (data ? 'IS ACCEPTING' : 'NOT ACCEPTING') + '</div>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    if (type === 'display') {
                        return `
                            <div class="availability-container">
                                <div class="availability-group">
                                    <button class="btn-agree" onclick="handleAvailabilityFeedback('${data.id}', true)">
                                        <i class="fas fa-thumbs-up"></i> Agree (${data.availability_agree})
                                    </button>
                                </div>
                                <div class="availability-group">
                                    <button class="btn-disagree" onclick="handleAvailabilityFeedback('${data.id}', false)">
                                        <i class="fas fa-thumbs-down"></i> Disagree (${data.availability_disagree})
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    return data.availability_agree + data.availability_disagree;
                }
            },
            {
                data: 'last_updated',
                render: function (data) {
                    return formatDate(data);
                }
            }
        ],
        order: [[0, 'asc']],
        ordering: true,
        responsive: true,
        drawCallback: function () {
            updatePaginationControls(this.api());
        }
    });

    // Function to load fallback clinic data
    function loadFallbackClinicData() {
        $.ajax({
            url: 'clinics.json',
            dataType: 'json',
            success: function (data) {
                console.log('Loaded fallback clinic data:', data);
                // When using fallback, disable server-side processing
                table.settings()[0].oFeatures.bServerSide = false;
                table.clear().rows.add(data).draw();
            },
            error: function (fallbackError) {
                console.error('Error loading fallback clinic data:', fallbackError);
            }
        });
    }

    return table;
}

// Initialize shared pagination controls
export function initializeSharedPagination(doctorTable, clinicTable) {
    $('#pageLengthSelect').on('change', function () {
        const pageLength = parseInt($(this).val());
        const activeTable = $('#doctorTab').hasClass('active') ? doctorTable : clinicTable;
        if (activeTable) {
            activeTable.page.len(pageLength).draw();
            updatePaginationControls(activeTable);
        }
    });

    $('#prevPage').on('click', function () {
        const activeTable = $('#doctorTab').hasClass('active') ? doctorTable : clinicTable;
        if (activeTable) {
            const currentPage = activeTable.page.info().page;
            if (currentPage > 0) {
                activeTable.page(currentPage - 1).draw(false);
                updatePaginationControls(activeTable);
            }
        }
    });

    $('#nextPage').on('click', function () {
        const activeTable = $('#doctorTab').hasClass('active') ? doctorTable : clinicTable;
        if (activeTable) {
            const currentPage = activeTable.page.info().page;
            const totalPages = activeTable.page.info().pages;
            if (currentPage < totalPages - 1) {
                activeTable.page(currentPage + 1).draw(false);
                updatePaginationControls(activeTable);
            }
        }
    });
}

// Load data with fallback
export async function loadDataWithFallback(apiUrl, fallbackFile, dataType) {
    showLoading('table');
    try {
        const response = await axios.get(apiUrl, {
            headers: API_CONFIG.headers
        });
        return response.data;
    } catch (error) {
        console.error(`Error loading ${dataType} from API:`, error);

        if (error.response) {
            switch (error.response.status) {
                case 429:
                    console.warn('Rate limit exceeded, using fallback data');
                    break;
                case 403:
                    console.error('API key invalid or missing');
                    break;
                case 401:
                    console.error('Unauthorized access');
                    break;
                default:
                    console.error(`API error: ${error.response.status}`);
            }
        }

        showApiStatus();
        const response = await axios.get(fallbackFile);
        return response.data;
    } finally {
        hideLoading('table');
    }
} 