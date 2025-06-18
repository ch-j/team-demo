import React from 'react';

function FilterControls({
  filters,
  onFilterChange,
  // Chart related props
  chartMetric,
  setChartMetric,
  availableChartMetrics,
  chartXAxisKey,
  setChartXAxisKey,
  availableXAxisKeys,
  chartSeriesKey,
  setChartSeriesKey,
  availableSeriesKeys,
}) {
  return (
    <div className="filter-controls-container">
      <div className="table-filters">
        <h3>Filter Table Data</h3>
        <input
          type="text"
          id="filterAlgorithm"
          placeholder="Filter by Algorithm Name..."
          value={filters.algorithm}
          onChange={(e) => onFilterChange('algorithm', e.target.value)}
        />
        <input
          type="text"
          id="filterDataset"
          placeholder="Filter by Dataset Name..."
          value={filters.dataset}
          onChange={(e) => onFilterChange('dataset', e.target.value)}
        />
      </div>

      <div className="chart-options">
        <h3>Chart Options</h3>
        <div>
          <label htmlFor="chartMetricSelect">Chart Metric:</label>
          <select
            id="chartMetricSelect"
            value={chartMetric}
            onChange={(e) => setChartMetric(e.target.value)}
            disabled={availableChartMetrics.length === 0}
          >
            {availableChartMetrics.length === 0 && <option value="">No numeric metrics available</option>}
            {availableChartMetrics.map(metric => (
              <option key={metric} value={metric}>{metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chartXAxisKeySelect">Chart X-Axis:</label>
          <select
            id="chartXAxisKeySelect"
            value={chartXAxisKey}
            onChange={(e) => setChartXAxisKey(e.target.value)}
          >
            {availableXAxisKeys.map(key => (
              <option key={key} value={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chartSeriesKeySelect">Chart Series (Group By):</label>
          <select
            id="chartSeriesKeySelect"
            value={chartSeriesKey}
            onChange={(e) => setChartSeriesKey(e.target.value)}
          >
            {availableSeriesKeys.map(key => (
              <option key={key} value={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FilterControls;
        id="filterAlgorithm"
        placeholder="Filter by Algorithm Name..."
        value={filters.algorithm}
        onChange={(e) => onFilterChange('algorithm', e.target.value)}
      />
      <input
        type="text"
        id="filterDataset"
        placeholder="Filter by Dataset Name..."
        value={filters.dataset}
        onChange={(e) => onFilterChange('dataset', e.target.value)}
      />
    </div>
  );
}

export default FilterControls;
