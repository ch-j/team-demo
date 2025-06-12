import React from 'react';

function FilterControls({ filters, onFilterChange }) {
  return (
    <div className="filters">
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
  );
}

export default FilterControls;
