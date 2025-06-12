import React from 'react';
import SortableHeaderCell from './SortableHeaderCell';

// Define which columns to display and their headers/accessors
const columnConfig = [
    { key: 'algorithm_name', header: 'Algorithm' },
    { key: 'algorithm_version', header: 'Version' },
    { key: 'dataset_name', header: 'Dataset' },
    // { key: 'dataset_details.type', header: 'Dataset Type'}, // Example of a deeper path
    { key: 'benchmark_run_date', header: 'Run Date' },
    { key: 'speed_metrics.processing_time_seconds_total', header: 'Total Time (s)' },
    { key: 'speed_metrics.processing_time_seconds_per_unit', header: 'Time/Unit (s)' },
    { key: 'speed_metrics.units_per_second', header: 'Units/s' },
    { key: 'accuracy_metrics.character_error_rate', header: 'CER' },
    { key: 'accuracy_metrics.word_error_rate', header: 'WER' },
    { key: 'accuracy_metrics.exact_match_accuracy', header: 'Exact Match %' },
    { key: 'accuracy_metrics.detection_rate', header: 'Detection Rate %' },
    { key: 'accuracy_metrics.average_corner_distance_error_pixels', header: 'Avg Corner Error (px)' },
];

// Helper to get nested values from an object based on a dot-separated path string
const getValueByPath = (obj, path) => {
    if (!path) return undefined;
    // Check if path is a string before calling split
    if (typeof path !== 'string') {
        // console.warn('getValueByPath: path is not a string:', path); // Already handled in App.jsx if passed down
        return undefined;
    }
    return path.split('.').reduce((o, i) => (o && o.hasOwnProperty(i) ? o[i] : undefined), obj);
};

function BenchmarkTable({ data, onSort, sortConfig }) {
  // data is now filteredAndSortedData from App.jsx
  if (!data) { // data might be null if error or not yet loaded, App handles this
    return <p>Loading data or data unavailable...</p>;
  }
  if (data.length === 0) {
    // This case is now handled in App.jsx to provide a more global message
    // return <p>No benchmark data to display with current filters.</p>;
    return null; // App.jsx will render the message
  }

  return (
    <table id="benchmark-table">
      <thead>
        <tr>
          {columnConfig.map(col => (
            <SortableHeaderCell
              key={col.key}
              columnKey={col.key}
              headerText={col.header}
              onSort={onSort}
              sortConfig={sortConfig}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          // Using a more robust key if items have unique IDs, otherwise index is fallback
          <tr key={item.id || `row-${index}`}>
            {columnConfig.map(col => (
              <td key={col.key}>
                {getValueByPath(item, col.key) !== undefined && getValueByPath(item, col.key) !== null
                 ? String(getValueByPath(item, col.key))
                 : '-'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BenchmarkTable;
