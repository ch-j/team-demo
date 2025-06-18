import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import BenchmarkTable from './components/BenchmarkTable';
import FilterControls from './components/FilterControls';
import BenchmarkGraph from './components/BenchmarkGraph'; // Import BenchmarkGraph
// import './style.css'; // Will be handled in styling step

// Helper to get nested values from an object based on a dot-separated path string
const getValueByPath = (obj, path) => {
    if (!path) return undefined;
    // Check if path is a string before calling split
    if (typeof path !== 'string') {
        console.warn('getValueByPath: path is not a string:', path);
        return undefined;
    }
    return path.split('.').reduce((o, i) => (o && o.hasOwnProperty(i) ? o[i] : undefined), obj);
};


function App() {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ algorithm: '', dataset: '' });
  // Initialize sortConfig with a default sort, e.g., by algorithm name
  const [sortConfig, setSortConfig] = useState({ key: 'algorithm_name', direction: 'ascending' });


  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:5000/api/benchmarks')
      .then(response => {
        setAllData(response.data || []); // Ensure response.data is an array
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching benchmark data:', error);
        setError('Failed to load benchmark data. Please try again later.');
        setIsLoading(false);
      });
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let data = [...allData];

    // Apply filters
    if (filters.algorithm) {
      data = data.filter(item =>
        item.algorithm_name && item.algorithm_name.toLowerCase().includes(filters.algorithm.toLowerCase())
      );
    }
    if (filters.dataset) {
      data = data.filter(item =>
        item.dataset_name && item.dataset_name.toLowerCase().includes(filters.dataset.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        const valA = getValueByPath(a, sortConfig.key);
        const valB = getValueByPath(b, sortConfig.key);

        // Handle undefined or null values by pushing them to the end
        if (valA === undefined || valA === null) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (valB === undefined || valB === null) return sortConfig.direction === 'ascending' ? -1 : 1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // For numbers or other types
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [allData, filters, sortConfig]);


  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      // Optional: third click removes sort or resets to default; for now, just toggle
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
    return <div className="App-feedback">Loading benchmark data...</div>;
  }

  if (error) {
    return <div className="App-feedback App-error">{error}</div>;
  }

  return (
    <div className="App">
      <h1>Computer Vision Algorithm Benchmarks (React)</h1>
      <FilterControls filters={filters} onFilterChange={handleFilterChange} />
      {filteredAndSortedData.length > 0 ? (
        <>
          <BenchmarkTable data={filteredAndSortedData} onSort={handleSort} sortConfig={sortConfig} />
          <BenchmarkGraph benchmarkData={filteredAndSortedData} />
        </>
      ) : (
        <p>No data matches your current filters, or no data is available.</p>
      )}
    </div>
  );
}

export default App;
