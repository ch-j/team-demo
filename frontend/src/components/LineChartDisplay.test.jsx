import React from 'react';
import { render, screen } from '@testing-library/react';
import LineChartDisplay from './LineChartDisplay';
// It's good practice to have this for .toBeInTheDocument() and other matchers,
// assuming jest-dom is set up in the project's test configuration.
// import '@testing-library/jest-dom';

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: jest.fn(() => <canvas data-testid="mocked-line-chart" />),
}));

// Mock chartjs-adapter-date-fns
jest.mock('chartjs-adapter-date-fns', () => ({
  // This module typically doesn't export anything directly but registers an adapter.
  // For unit tests of components using Chart.js, its side effect of registration
  // is usually not an issue, or Chart.js itself might need to be more deeply mocked
  // if adapter interactions were problematic. For these tests, an empty mock is fine.
}));

// Mock ChartJS.register, as it's called at the module level in LineChartDisplay
// and might cause issues if not all its arguments (scales, etc.) are fully mocked.
// A simpler approach is to mock ChartJS itself if its internal workings are not being tested.
jest.mock('chart.js', () => {
  const originalChartJS = jest.requireActual('chart.js');
  return {
    ...originalChartJS,
    Chart: {
      ...originalChartJS.Chart,
      register: jest.fn(), // Mock the register function
    },
    // If other specific Chart.js components are directly used and cause issues,
    // they might need individual mocks here too.
  };
});


const mockDataValid = [
  { id: 1, algorithm_name: 'AlgoA', dataset_name: 'Set1', benchmark_run_date: '2023-01-01', speed_metrics: { time: 10 }, accuracy_metrics: { cer: 0.1 } },
  { id: 2, algorithm_name: 'AlgoB', dataset_name: 'Set1', benchmark_run_date: '2023-01-05', speed_metrics: { time: 12 }, accuracy_metrics: { cer: 0.12 } },
  { id: 3, algorithm_name: 'AlgoA', dataset_name: 'Set2', benchmark_run_date: '2023-01-10', speed_metrics: { time: 8 }, accuracy_metrics: { cer: 0.08 } },
];
const mockMetricKeyValid = 'speed_metrics.time';
const mockXAxisKeyValid = 'benchmark_run_date';
const mockSeriesKeyValid = 'algorithm_name';

describe('LineChartDisplay Component', () => {
  // Test 1: Renders "No data" message
  test('renders "No data" message when data array is empty', () => {
    render(
      <LineChartDisplay
        data={[]}
        metricKey={mockMetricKeyValid}
        xAxisKey={mockXAxisKeyValid}
        seriesKey={mockSeriesKeyValid}
      />
    );
    expect(screen.getByText('No data available for the chart.')).toBeInTheDocument();
  });

  test('renders "No data" message when data prop is null', () => {
    render(
      <LineChartDisplay
        data={null}
        metricKey={mockMetricKeyValid}
        xAxisKey={mockXAxisKeyValid}
        seriesKey={mockSeriesKeyValid}
      />
    );
    expect(screen.getByText('No data available for the chart.')).toBeInTheDocument();
  });

  // Test 2: Renders "Please select" message for missing keys
  test('renders "Please select" message if metricKey is missing', () => {
    render(
      <LineChartDisplay
        data={mockDataValid}
        metricKey=""
        xAxisKey={mockXAxisKeyValid}
        seriesKey={mockSeriesKeyValid}
      />
    );
    expect(screen.getByText('Please select metric, X-axis, and series to display the chart.')).toBeInTheDocument();
  });

  test('renders "Please select" message if xAxisKey is missing', () => {
    render(
      <LineChartDisplay
        data={mockDataValid}
        metricKey={mockMetricKeyValid}
        xAxisKey=""
        seriesKey={mockSeriesKeyValid}
      />
    );
    expect(screen.getByText('Please select metric, X-axis, and series to display the chart.')).toBeInTheDocument();
  });

  test('renders "Please select" message if seriesKey is missing', () => {
    render(
      <LineChartDisplay
        data={mockDataValid}
        metricKey={mockMetricKeyValid}
        xAxisKey={mockXAxisKeyValid}
        seriesKey=""
      />
    );
    expect(screen.getByText('Please select metric, X-axis, and series to display the chart.')).toBeInTheDocument();
  });

  // Test 3: Renders the mocked chart when all props are valid
  test('renders the mocked Line chart when all props are valid', () => {
    // Clear any previous console warnings/errors from ChartJS mocks if necessary
    // console.warn = jest.fn();
    // console.error = jest.fn();

    render(
      <LineChartDisplay
        data={mockDataValid}
        metricKey={mockMetricKeyValid}
        xAxisKey={mockXAxisKeyValid}
        seriesKey={mockSeriesKeyValid}
      />
    );
    // Check for the mocked canvas
    expect(screen.getByTestId('mocked-line-chart')).toBeInTheDocument();

    // The title is part of chart.js options, so it won't be directly in the DOM
    // unless our mock for <Line /> specifically rendered it, which it doesn't.
    // Testing the title would require a more complex mock or integration test.
  });

  // Test 4: Handles different xAxisKey types (simple check for non-date)
  test('renders with non-date xAxisKey', () => {
    render(
      <LineChartDisplay
        data={mockDataValid}
        metricKey={mockMetricKeyValid}
        xAxisKey="dataset_name"
        seriesKey={mockSeriesKeyValid}
      />
    );
    expect(screen.getByTestId('mocked-line-chart')).toBeInTheDocument();
  });

});
