import React, { useState, useEffect } from 'react';

const OCR_SPEED_METRICS = ['processing_time_seconds_total', 'processing_time_seconds_per_unit', 'units_per_second'];
const OCR_ACCURACY_METRICS = ['character_error_rate', 'word_error_rate', 'exact_match_accuracy'];
const CHECKERBOARD_SPEED_METRICS = ['processing_time_seconds_total', 'processing_time_seconds_per_unit', 'units_per_second'];
const CHECKERBOARD_ACCURACY_METRICS = ['detection_rate', 'average_corner_distance_error_pixels', 'average_reprojection_error_pixels'];

const initialFormData = {
  algorithm_name: '',
  algorithm_version: '',
  dataset_name: '',
  dataset_details: {
    type: '', // This will be 'OCR' or 'Checkerboard'
    image_count: '',
    description: ''
  },
  execution_environment: {
    cpu: '',
    gpu: '',
    ram_gb: '',
    os: ''
  },
  benchmark_run_date: '',
  speed_metrics: {},
  accuracy_metrics: {},
  additional_notes: ''
};

function AddBenchmarkForm({ onSubmit, onCancel }) {
  const [algorithmType, setAlgorithmType] = useState('OCR'); // Default to OCR
  const [formData, setFormData] = useState({
    ...initialFormData,
    dataset_details: { ...initialFormData.dataset_details, type: 'OCR' },
    speed_metrics: OCR_SPEED_METRICS.reduce((acc, metric) => ({ ...acc, [metric]: '' }), {}),
    accuracy_metrics: OCR_ACCURACY_METRICS.reduce((acc, metric) => ({ ...acc, [metric]: '' }), {}),
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dataset_details: {
        ...prev.dataset_details,
        type: algorithmType
      },
      speed_metrics: (algorithmType === 'OCR' ? OCR_SPEED_METRICS : CHECKERBOARD_SPEED_METRICS)
        .reduce((acc, metric) => ({ ...acc, [metric]: '' }), {}),
      accuracy_metrics: (algorithmType === 'OCR' ? OCR_ACCURACY_METRICS : CHECKERBOARD_ACCURACY_METRICS)
        .reduce((acc, metric) => ({ ...acc, [metric]: '' }), {}),
    }));
  }, [algorithmType]);

  const handleAlgorithmTypeChange = (e) => {
    setAlgorithmType(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    setFormData(prev => {
      let current = prev;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return { ...prev };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic data type conversion
    const processedData = {
      ...formData,
      dataset_details: {
        ...formData.dataset_details,
        image_count: formData.dataset_details.image_count ? parseInt(formData.dataset_details.image_count, 10) : undefined,
      },
      execution_environment: {
        ...formData.execution_environment,
        ram_gb: formData.execution_environment.ram_gb ? parseFloat(formData.execution_environment.ram_gb) : undefined,
      },
      speed_metrics: Object.entries(formData.speed_metrics).reduce((acc, [key, val]) => {
        acc[key] = val !== '' ? parseFloat(val) : undefined;
        return acc;
      }, {}),
      accuracy_metrics: Object.entries(formData.accuracy_metrics).reduce((acc, [key, val]) => {
        acc[key] = val !== '' ? parseFloat(val) : undefined;
        return acc;
      }, {}),
    };
    onSubmit(processedData);
  };

  const currentSpeedMetrics = algorithmType === 'OCR' ? OCR_SPEED_METRICS : CHECKERBOARD_SPEED_METRICS;
  const currentAccuracyMetrics = algorithmType === 'OCR' ? OCR_ACCURACY_METRICS : CHECKERBOARD_ACCURACY_METRICS;

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '15px' }}>
      <fieldset>
        <legend>Algorithm & Dataset General Info</legend>
        <div>
          <label htmlFor="algorithmType">Algorithm Type:</label>
          <select id="algorithmType" name="algorithmType" value={algorithmType} onChange={handleAlgorithmTypeChange} required>
            <option value="OCR">OCR</option>
            <option value="Checkerboard">Checkerboard Detection</option>
          </select>
        </div>
        <div>
          <label htmlFor="algorithm_name">Algorithm Name:</label>
          <input type="text" id="algorithm_name" name="algorithm_name" value={formData.algorithm_name} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="algorithm_version">Algorithm Version:</label>
          <input type="text" id="algorithm_version" name="algorithm_version" value={formData.algorithm_version} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="dataset_name">Dataset Name:</label>
          <input type="text" id="dataset_name" name="dataset_name" value={formData.dataset_name} onChange={handleChange} required />
        </div>
         <div>
          <label htmlFor="benchmark_run_date">Benchmark Run Date:</label>
          <input type="datetime-local" id="benchmark_run_date" name="benchmark_run_date" value={formData.benchmark_run_date} onChange={handleChange} required />
        </div>
      </fieldset>

      <fieldset>
        <legend>Dataset Details ({formData.dataset_details.type})</legend>
        <div>
          <label htmlFor="dataset_details.image_count">Image Count:</label>
          <input type="number" id="dataset_details.image_count" name="dataset_details.image_count" value={formData.dataset_details.image_count} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="dataset_details.description">Description:</label>
          <textarea id="dataset_details.description" name="dataset_details.description" value={formData.dataset_details.description} onChange={handleChange} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Execution Environment</legend>
        <div>
          <label htmlFor="execution_environment.cpu">CPU:</label>
          <input type="text" id="execution_environment.cpu" name="execution_environment.cpu" value={formData.execution_environment.cpu} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="execution_environment.gpu">GPU:</label>
          <input type="text" id="execution_environment.gpu" name="execution_environment.gpu" value={formData.execution_environment.gpu} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="execution_environment.ram_gb">RAM (GB):</label>
          <input type="number" step="any" id="execution_environment.ram_gb" name="execution_environment.ram_gb" value={formData.execution_environment.ram_gb} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="execution_environment.os">OS:</label>
          <input type="text" id="execution_environment.os" name="execution_environment.os" value={formData.execution_environment.os} onChange={handleChange} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Speed Metrics</legend>
        {currentSpeedMetrics.map(metric => (
          <div key={metric}>
            <label htmlFor={`speed_metrics.${metric}`}>{metric.replace(/_/g, ' ')}:</label>
            <input type="number" step="any" id={`speed_metrics.${metric}`} name={`speed_metrics.${metric}`} value={formData.speed_metrics[metric] || ''} onChange={handleChange} />
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Accuracy Metrics</legend>
        {currentAccuracyMetrics.map(metric => (
          <div key={metric}>
            <label htmlFor={`accuracy_metrics.${metric}`}>{metric.replace(/_/g, ' ')}:</label>
            <input type="number" step="any" id={`accuracy_metrics.${metric}`} name={`accuracy_metrics.${metric}`} value={formData.accuracy_metrics[metric] || ''} onChange={handleChange} />
          </div>
        ))}
      </fieldset>

      <div>
        <label htmlFor="additional_notes">Additional Notes:</label>
        <textarea id="additional_notes" name="additional_notes" value={formData.additional_notes} onChange={handleChange} />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button type="submit">Submit Benchmark</button>
        {onCancel && <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>Cancel</button>}
      </div>
    </form>
  );
}

export default AddBenchmarkForm;
