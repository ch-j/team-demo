import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, // For general categorical data on X-axis (like names, non-date strings)
  LinearScale,   // For Y-axis values
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,     // For date/time data on X-axis
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

// Helper to get nested values from an object based on a dot-separated path string
const getValueByPath = (obj, path) => {
  if (typeof path !== 'string') {
    console.warn('getValueByPath: path is not a string:', path, 'for object:', obj);
    return undefined;
  }
  return path.split('.').reduce((o, i) => (o && typeof o === 'object' && i in o ? o[i] : undefined), obj);
};

const lineColors = [
  'rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)',
  'rgb(255, 206, 86)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)',
  'rgb(199, 199, 199)', 'rgb(83, 102, 83)', 'rgb(0, 128, 128)',
  'rgb(233, 30, 99)', 'rgb(121, 85, 72)', 'rgb(0, 0, 0)'
];

function LineChartDisplay({ data, metricKey, xAxisKey, seriesKey }) {
  if (!data || data.length === 0) {
    return <div className="chart-placeholder"><p>No data available for the chart.</p></div>;
  }

  if (!metricKey || !xAxisKey || !seriesKey) {
    return <div className="chart-placeholder"><p>Please select metric, X-axis, and series to display the chart.</p></div>;
  }

  // Determine if X-axis is time-based
  // Simple heuristic: check if xAxisKey suggests dates and if values are valid date strings/numbers
  const isTimeScale = xAxisKey === 'benchmark_run_date' && data.every(item => !isNaN(new Date(getValueByPath(item, xAxisKey)).getTime()));

  // Extract unique X-axis labels and sort them
  let uniqueXAxisValues = [...new Set(data.map(item => getValueByPath(item, xAxisKey)))];

  if (isTimeScale) {
    uniqueXAxisValues.sort((a, b) => new Date(a) - new Date(b));
  } else {
    // Alphanumeric sort for other categorical data, ensuring consistent order
    uniqueXAxisValues.sort((a, b) => {
      if (a === null || a === undefined) return 1; // Push nulls/undefined to the end
      if (b === null || b === undefined) return -1;
      return String(a).localeCompare(String(b));
    });
  }

  // Group data by seriesKey
  const groupedData = data.reduce((acc, item) => {
    const seriesValue = getValueByPath(item, seriesKey);
    if (seriesValue === null || seriesValue === undefined) return acc; // Skip items with no series value
    (acc[seriesValue] = acc[seriesValue] || []).push(item);
    return acc;
  }, {});

  // Prepare datasets for Chart.js
  const preparedDatasets = Object.keys(groupedData).map((currentSeries, index) => {
    const seriesDataPoints = groupedData[currentSeries];
    const datasetValues = uniqueXAxisValues.map(xValue => {
      const point = seriesDataPoints.find(p => getValueByPath(p, xAxisKey) === xValue);
      return point ? getValueByPath(point, metricKey) : null; // Use null for missing points
    });

    return {
      label: currentSeries,
      data: datasetValues,
      borderColor: lineColors[index % lineColors.length],
      backgroundColor: lineColors[index % lineColors.length] + '80', // Add some transparency
      tension: 0.1, // Makes lines slightly curved
      fill: false,
    };
  });

  const chartData = {
    labels: uniqueXAxisValues.map(label => isTimeScale ? new Date(label) : label), // Use Date objects for TimeScale labels
    datasets: preparedDatasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { // More robust tooltip interaction
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} by ${xAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Grouped by ${seriesKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})`,
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(3); // Format to 3 decimal places, adjust as needed
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: isTimeScale ? 'time' : 'category',
        title: {
          display: true,
          text: xAxisKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        },
        ticks: {
          maxRotation: 45, // Rotate labels if they overlap
          minRotation: 0,
          autoSkip: true, // Skip labels if too many
          maxTicksLimit: 20, // Limit number of ticks
        },
        ...(isTimeScale && { time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' } }) // Example time config
      },
      y: {
        title: {
          display: true,
          text: metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        },
        beginAtZero: true, // Good default for many metrics
        ticks: {
          callback: function(value) { // Format Y-axis ticks if needed
            if (value >= 1000000) return (value / 1000000) + 'M';
            if (value >= 1000) return (value / 1000) + 'K';
            return value;
          }
        }
      },
    },
  };

  return (
    <div className="line-chart-container" style={{ height: '500px', marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <Line options={options} data={chartData} />
    </div>
  );
}

export default LineChartDisplay;
