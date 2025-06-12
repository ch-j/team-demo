import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './BenchmarkGraph.css'; // Import the CSS file

const PREDEFINED_BENCHMARK_AXES = ['algorithm_name', 'dataset_name'];
const BAR_WIDTH = 0.8;
const BAR_DEPTH = 0.5;
const BAR_SPACING = 1.5; // Spacing between the start of one bar to the start of the next
const Y_AXIS_SCALE_FACTOR = 10; // Adjust as needed to make bar heights reasonable

function BenchmarkGraph({ benchmarkData }) {
  const mountRef = useRef(null); // For the three.js canvas
  const sceneRef = useRef(null);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedBenchmarkAxis, setSelectedBenchmarkAxis] = useState(PREDEFINED_BENCHMARK_AXES[0]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [availableBenchmarkAxes] = useState(PREDEFINED_BENCHMARK_AXES);

  useEffect(() => {
    if (benchmarkData && benchmarkData.length > 0) {
      const firstItem = benchmarkData[0];
      const metrics = [];
      if (firstItem.speed_metrics) {
        Object.keys(firstItem.speed_metrics).forEach(key => metrics.push(`speed_metrics.${key}`));
      }
      if (firstItem.accuracy_metrics) {
        Object.keys(firstItem.accuracy_metrics).forEach(key => metrics.push(`accuracy_metrics.${key}`));
      }
      setAvailableMetrics(metrics);
      if (metrics.length > 0 && (!selectedMetric || !metrics.includes(selectedMetric))) {
        setSelectedMetric(metrics[0]);
      }
    } else {
      setAvailableMetrics([]);
      setSelectedMetric('');
    }
  }, [benchmarkData, selectedMetric]); // Keep selectedMetric dependency to ensure it updates if availableMetrics change

  useEffect(() => {
    const currentMount = mountRef.current; // Capture for use in this effect and its cleanup

    if (!currentMount) return;

    if (!benchmarkData || benchmarkData.length === 0 || !selectedMetric || !selectedBenchmarkAxis) {
      // If no data or selections, ensure the mount point is clear.
      // The main effect's cleanup (from a previous render with data) should handle its own canvas.
      // If this is the initial render or if data disappears, we want the placeholder message to show,
      // which is outside the mountRef. So, clearing mountRef ensures no old canvas lingers.
      currentMount.innerHTML = '';

      // Optionally, also clear Three.js scene objects if they persist via sceneRef
      if (sceneRef.current) {
        const objectsToRemove = [];
        sceneRef.current.traverse(child => { if (child.isMesh || child.isAxesHelper) objectsToRemove.push(child); });
        objectsToRemove.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose());
                else child.material.dispose();
            }
            sceneRef.current.remove(child);
        });
      }
      return;
    }

    // Scene setup (or clearing existing objects)
    if (!sceneRef.current) {
        sceneRef.current = new THREE.Scene();
        sceneRef.current.background = new THREE.Color(0xf0f0f0);
    } else {
        const objectsToRemove = [];
        sceneRef.current.traverse(child => { if (child.isMesh || child.isAxesHelper) objectsToRemove.push(child); });
        objectsToRemove.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                 if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose());
                 else child.material.dispose();
            }
            sceneRef.current.remove(child);
        });
    }
    const scene = sceneRef.current;

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);

    // Robustly clear the mount point and append the new canvas
    currentMount.innerHTML = '';
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const uniqueXValues = [...new Set(benchmarkData.map(item => item[selectedBenchmarkAxis]))].sort();
    let maxMetricValue = 0;
    const processedData = uniqueXValues.map(xAxisValue => {
        const item = benchmarkData.find(d => d[selectedBenchmarkAxis] === xAxisValue);
        let value = 0;
        if (item) {
            const metricPath = selectedMetric.includes('.') ? selectedMetric.split('.') : [selectedMetric];
            let currentVal = item;
            for (const key of metricPath) {
                currentVal = currentVal?.[key];
            }
            value = parseFloat(currentVal) || 0;
        }
        if (value > maxMetricValue) maxMetricValue = value;
        return { category: xAxisValue, value };
    });

    const dynamicScaleFactor = maxMetricValue > 0 ? (10 / maxMetricValue) : Y_AXIS_SCALE_FACTOR;

    processedData.forEach((dataPoint, index) => {
      const barHeight = Math.max(0.01, dataPoint.value * dynamicScaleFactor);
      const geometry = new THREE.BoxGeometry(BAR_WIDTH, barHeight, BAR_DEPTH);
      const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = index * BAR_SPACING - (uniqueXValues.length * BAR_SPACING) / 2 + BAR_SPACING / 2;
      bar.position.y = barHeight / 2;
      scene.add(bar);
    });

    const numBars = uniqueXValues.length;
    camera.position.x = 0;
    camera.position.y = Math.max(5, maxMetricValue * dynamicScaleFactor * 0.75);
    camera.position.z = Math.max(numBars * BAR_SPACING * 0.7, 10);
    const lookAtY = Math.max(0, maxMetricValue * dynamicScaleFactor / 3);
    camera.lookAt(0, lookAtY, 0);
    controls.target.set(0, lookAtY, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate(); // Call animate to start the loop

    // Store handle for cleanup
    const animationFrameId = requestAnimationFrame(animate);


    return () => {
      console.log("Cleaning up three.js resources for BenchmarkGraph");
      cancelAnimationFrame(animationFrameId); // Stop animation loop
      controls.dispose();
      renderer.dispose();
      // Only remove the specific domElement created by this effect run, if it's still part of currentMount
      if (currentMount && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      // Note: scene objects are cleared at the beginning of the effect if sceneRef.current exists.
      // If the component unmounts entirely, sceneRef.current might still hold references.
      // A more thorough cleanup for full component unmount might involve:
      // if (sceneRef.current) { /* dispose all geometries, materials, textures in sceneRef.current */ }
      // sceneRef.current = null;
      // However, the current approach of clearing at the start of the effect handles re-renders well.
    };
  }, [benchmarkData, selectedMetric, selectedBenchmarkAxis]); // Removed mountRef.current from dependencies

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  const handleBenchmarkAxisChange = (event) => {
    setSelectedBenchmarkAxis(event.target.value);
  };

  return (
    <div className="benchmark-graph-container">
      <div className="graph-controls">
        <div>
          <label htmlFor="metric-select">Select Metric: </label>
          <select id="metric-select" value={selectedMetric} onChange={handleMetricChange}>
            {availableMetrics.map(metric => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="benchmark-axis-select">Select Benchmark Axis: </label>
          <select id="benchmark-axis-select" value={selectedBenchmarkAxis} onChange={handleBenchmarkAxisChange}>
            {availableBenchmarkAxes.map(axis => (
              <option key={axis} value={axis}>{axis}</option>
            ))}
          </select>
        </div>
      </div>
      <div ref={mountRef} className="graph-canvas-container">
        {(!benchmarkData || benchmarkData.length === 0 || !selectedMetric || !selectedBenchmarkAxis) &&
          <p>No data available to display for the selected graph parameters.</p>
        }
      </div>
    </div>
  );
}

export default BenchmarkGraph;
