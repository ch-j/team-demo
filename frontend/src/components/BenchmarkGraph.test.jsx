import React from 'react';
import { render, screen } from '@testing-library/react';
import BenchmarkGraph from './BenchmarkGraph';

// Mock three.js OrbitControls
jest.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    enableDamping: false,
    dampingFactor: 0,
    update: jest.fn(),
    dispose: jest.fn(),
    target: { set: jest.fn() }, // Mock target.set if called during camera setup
  })),
}));

// Mock parts of three.js that might cause issues in JSDOM
jest.mock('three', () => {
  const originalThree = jest.requireActual('three');
  return {
    ...originalThree,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      render: jest.fn(),
      domElement: document.createElement('canvas'), // Provide a mock DOM element
      dispose: jest.fn(),
    })),
    // Scene.dispose and other related .dispose() methods might not exist on mock objects
    // if not explicitly mocked. For now, this is a basic mock.
    // We might need to add more mocks if specific tests fail due to THREE internals.
    Scene: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(), // Add traverse if it's called during cleanup
        background: null, // Mock background property
        // Mock other Scene methods/properties as needed
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
        position: { set: jest.fn(), x:0, y:0, z:5 },
        lookAt: jest.fn(),
        // Mock other Camera methods/properties as needed
    })),
    AmbientLight: jest.fn(),
    DirectionalLight: jest.fn(),
    AxesHelper: jest.fn(),
    BoxGeometry: jest.fn(),
    MeshStandardMaterial: jest.fn(),
    Mesh: jest.fn(),
    Color: jest.fn(), // Mock THREE.Color
  };
});


const mockBenchmarkDataEmpty = [];

const mockBenchmarkDataFull = [
  {
    run_id: 'run1',
    algorithm_name: 'Algo1',
    dataset_name: 'DatasetA',
    speed_metrics: { processing_time_seconds_total: 10, units_per_second: 100 },
    accuracy_metrics: { CER: 0.1, WER: 0.2 },
    other_parameters: { param_x: 'value_x1', param_y: 'value_y1' }
  },
  {
    run_id: 'run2',
    algorithm_name: 'Algo2',
    dataset_name: 'DatasetB',
    speed_metrics: { processing_time_seconds_total: 5, units_per_second: 200 },
    accuracy_metrics: { CER: 0.05, WER: 0.1 },
    other_parameters: { param_x: 'value_x2', param_y: 'value_y2' }
  },
  {
    run_id: 'run3',
    algorithm_name: 'Algo1', // Same algo, different dataset
    dataset_name: 'DatasetC',
    speed_metrics: { processing_time_seconds_total: 12, units_per_second: 80 },
    accuracy_metrics: { CER: 0.12, WER: 0.22 },
    other_parameters: { param_x: 'value_x3', param_y: 'value_y3' }
  },
];

describe('BenchmarkGraph Component', () => {
  // Test 1: Component Renders with no data
  test('renders without crashing with no data', () => {
    render(<BenchmarkGraph benchmarkData={mockBenchmarkDataEmpty} />);
    // Check for a known static element or text when no data
    expect(screen.getByText(/No data available to display/i)).toBeInTheDocument();
  });

  // Test 2: Component Renders with data and shows graph placeholder (or canvas)
  test('renders with data and shows graph canvas container', () => {
    render(<BenchmarkGraph benchmarkData={mockBenchmarkDataFull} />);
    // The canvas itself is hard to test directly for content with RTL,
    // but we can check if its container div is there.
    // The div has class graph-canvas-container and a ref 'mountRef'
    // We also check for the select elements.
    expect(screen.getByLabelText(/Select Metric:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Benchmark Axis:/i)).toBeInTheDocument();
  });

  // Test 3: Dropdowns are present and populated
  test('renders dropdowns and they are populated based on mock data', () => {
    render(<BenchmarkGraph benchmarkData={mockBenchmarkDataFull} />);

    const metricSelect = screen.getByLabelText(/Select Metric:/i);
    expect(metricSelect).toBeInTheDocument();
    // Check for options based on mockBenchmarkDataFull
    // Example: 'speed_metrics.processing_time_seconds_total' should be an option
    expect(screen.getByRole('option', { name: 'speed_metrics.processing_time_seconds_total' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'accuracy_metrics.CER' })).toBeInTheDocument();

    const axisSelect = screen.getByLabelText(/Select Benchmark Axis:/i);
    expect(axisSelect).toBeInTheDocument();
    // Check for predefined axis options
    expect(screen.getByRole('option', { name: 'algorithm_name' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'dataset_name' })).toBeInTheDocument();
  });

  // Test 4: Default selections are made
  test('selects default metric and benchmark axis when data is provided', () => {
    render(<BenchmarkGraph benchmarkData={mockBenchmarkDataFull} />);

    const metricSelect = screen.getByLabelText(/Select Metric:/i);
    // Default metric should be the first one from speed_metrics if available
    expect(metricSelect.value).toBe('speed_metrics.processing_time_seconds_total');

    const axisSelect = screen.getByLabelText(/Select Benchmark Axis:/i);
    // Default axis is 'algorithm_name'
    expect(axisSelect.value).toBe('algorithm_name');
  });

  // Add more tests as needed, e.g., for interactions, though that's harder with three.js
  // For example, testing that changing a dropdown calls the three.js rendering logic
  // would require more involved mocking of the three.js parts or visual regression.

});
