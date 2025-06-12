document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('benchmark-table');
    const tableHead = table.querySelector('thead tr');
    const tableBody = table.querySelector('tbody');
    const filterAlgorithmInput = document.getElementById('filterAlgorithm');
    const filterDatasetInput = document.getElementById('filterDataset');

    let originalData = [];
    let currentSort = { column: null, ascending: true };

    // Define which columns to display and their headers
    // Order matters here for display
    const columnConfig = [
        { key: 'algorithm_name', header: 'Algorithm', isPrimary: true },
        { key: 'algorithm_version', header: 'Version' },
        { key: 'dataset_name', header: 'Dataset', isPrimary: true },
        { key: 'benchmark_run_date', header: 'Run Date' },
        { path: ['speed_metrics', 'processing_time_seconds_total'], header: 'Total Time (s)' },
        { path: ['speed_metrics', 'processing_time_seconds_per_unit'], header: 'Time/Unit (s)' },
        { path: ['speed_metrics', 'units_per_second'], header: 'Units/s' },
        { path: ['accuracy_metrics', 'character_error_rate'], header: 'CER' },
        { path: ['accuracy_metrics', 'word_error_rate'], header: 'WER' },
        { path: ['accuracy_metrics', 'exact_match_accuracy'], header: 'Exact Match %' },
        { path: ['accuracy_metrics', 'detection_rate'], header: 'Detection Rate %' },
        { path: ['accuracy_metrics', 'average_corner_distance_error_pixels'], header: 'Avg Corner Error (px)' },
    ];

    function getValueByPath(obj, path) {
        if (!path) return obj;
        let current = obj;
        for (let i = 0; i < path.length; i++) {
            if (current && typeof current === 'object' && path[i] in current) {
                current = current[path[i]];
            } else {
                return undefined;
            }
        }
        return current;
    }

    function populateTable(data) {
        // Clear existing header and body
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // Create headers
        columnConfig.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.header;
            th.style.cursor = 'pointer';
            th.dataset.columnKey = col.key || (col.path ? col.path.join('.') : '');
            th.addEventListener('click', () => sortTable(col.key || col.path));
            tableHead.appendChild(th);
        });

        // Populate rows
        data.forEach(item => {
            const tr = document.createElement('tr');
            columnConfig.forEach(col => {
                const td = document.createElement('td');
                const value = col.path ? getValueByPath(item, col.path) : item[col.key];
                td.textContent = value !== undefined && value !== null ? value : '-';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    function sortTable(keyOrPath) {
        const columnKey = Array.isArray(keyOrPath) ? keyOrPath.join('.') : keyOrPath;

        if (currentSort.column === columnKey) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.column = columnKey;
            currentSort.ascending = true;
        }

        originalData.sort((a, b) => {
            const valA = Array.isArray(keyOrPath) ? getValueByPath(a, keyOrPath) : a[keyOrPath];
            const valB = Array.isArray(keyOrPath) ? getValueByPath(b, keyOrPath) : b[keyOrPath];

            if (valA === undefined && valB === undefined) return 0;
            if (valA === undefined) return currentSort.ascending ? 1 : -1;
            if (valB === undefined) return currentSort.ascending ? -1 : 1;

            if (typeof valA === 'string' && typeof valB === 'string') {
                return currentSort.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return currentSort.ascending ? valA - valB : valB - valA;
            }
        });
        populateTable(originalData);
        updateSortIndicators();
    }

    function updateSortIndicators() {
        tableHead.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.columnKey === currentSort.column) {
                th.classList.add(currentSort.ascending ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    function filterData() {
        const algoFilter = filterAlgorithmInput.value.toLowerCase();
        const datasetFilter = filterDatasetInput.value.toLowerCase();

        const filteredData = originalData.filter(item => {
            const algoMatch = item.algorithm_name ? item.algorithm_name.toLowerCase().includes(algoFilter) : true;
            const datasetMatch = item.dataset_name ? item.dataset_name.toLowerCase().includes(datasetFilter) : true;
            return algoMatch && datasetMatch;
        });
        populateTable(filteredData);
    }

    filterAlgorithmInput.addEventListener('input', filterData);
    filterDatasetInput.addEventListener('input', filterData);

    // Fetch data and initialize
    fetch('/api/benchmarks')
        .then(response => response.json())
        .then(data => {
            originalData = data;
            if (originalData.length > 0) {
                populateTable(originalData);
            } else {
                tableBody.innerHTML = '<tr><td colspan="' + columnConfig.length + '">No benchmark data found.</td></tr>';
                 // Still create headers if no data
                columnConfig.forEach(col => {
                    const th = document.createElement('th');
                    th.textContent = col.header;
                    tableHead.appendChild(th);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching benchmark data:', error);
            tableBody.innerHTML = '<tr><td colspan="' + columnConfig.length + '">Error loading data.</td></tr>';
        });
});
