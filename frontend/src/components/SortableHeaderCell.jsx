import React from 'react';

function SortableHeaderCell({ columnKey, headerText, onSort, sortConfig }) {
  const isSorted = sortConfig && sortConfig.key === columnKey;
  const sortIndicator = isSorted ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : '';

  return (
    <th onClick={() => onSort(columnKey)} style={{ cursor: 'pointer' }}>
      {headerText}{sortIndicator}
    </th>
  );
}

export default SortableHeaderCell;
