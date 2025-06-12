import os
import json
import random # For mock data
from datetime import datetime, timedelta # For mock data
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd # Though pandas might not be heavily used by current functions

app = Flask(__name__, static_folder='frontend/dist/assets')
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

def load_benchmark_data(data_dir):
    all_data = []
    if not os.path.exists(data_dir):
        print(f"WARNING: Data directory '{data_dir}' not found at '{os.path.abspath(data_dir)}'.")
        return all_data

    print(f"INFO: Loading real data from: {os.path.abspath(data_dir)}")
    for filename in os.listdir(data_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(data_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_data.extend(data)
                    else:
                        print(f"WARNING: JSON file '{filename}' does not contain a list of records at its root. Skipping.")
            except json.JSONDecodeError as e:
                print(f"ERROR: Error decoding JSON from file '{filename}': {e}")
            except Exception as e:
                print(f"ERROR: An unexpected error occurred while processing file '{filename}': {e}")
    return all_data

def generate_mock_benchmark_data(num_records=8):
    mock_data = []

    algo_prefixes = ["Opti", "Quick", "Deep", "Vision", "Accu", "Fast", "Robo", "AI"]
    algo_suffixes = ["Scan", "Detect", "Flow", "Net", "Read", "Check", "Segment", "Classify"]

    dataset_prefixes = ["City", "Indoor", "Rural", "Synth", "Street", "Docu", "Bio", "Aerial"]
    dataset_suffixes = ["HD", "LowLight", "Noisy", "Clean", "V2", "Alpha", "Beta", "Final"]

    for i in range(num_records):
        algo_name = f"{random.choice(algo_prefixes)}{random.choice(algo_suffixes)}"
        dataset_name = f"{random.choice(dataset_prefixes)}{random.choice(dataset_suffixes)}"

        run_date = datetime.utcnow() - timedelta(days=random.randint(0, 365), hours=random.randint(0,23), minutes=random.randint(0,59))

        image_count = random.randint(10, 100)
        total_time = round(random.uniform(10.0, 300.0), 2)
        units_per_sec = round(random.uniform(0.1, 100.0), 2)
        time_per_unit = round(total_time / image_count, 3) if image_count > 0 else 0

        accuracy_metrics = {}
        dataset_type = "General"

        # Determine type for more relevant metrics
        if any(s.lower() in algo_name.lower() for s in ["Read", "Scan", "OCR"])):
            dataset_type = "OCR"
            accuracy_metrics["character_error_rate"] = round(random.uniform(0.01, 0.20), 3)
            accuracy_metrics["word_error_rate"] = round(random.uniform(0.05, 0.30), 3)
            accuracy_metrics["exact_match_accuracy"] = round(random.uniform(0.5, 0.9), 3)
        elif any(s.lower() in algo_name.lower() for s in ["Detect", "Check", "Segment", "Classify"])):
            dataset_type = "Detection"
            accuracy_metrics["detection_rate"] = round(random.uniform(0.70, 0.99), 3)
            accuracy_metrics["average_corner_distance_error_pixels"] = round(random.uniform(0.5, 5.0), 2)
        else:
            accuracy_metrics["mean_average_precision"] = round(random.uniform(0.6, 0.95), 3) # A general metric

        record = {
            "id": f"mock-item-{i+1}-{random.randint(1000,9999)}", # Unique ID for React keys
            "algorithm_name": algo_name,
            "algorithm_version": f"1.{random.randint(0,9)}.{random.randint(0,9)}",
            "dataset_name": dataset_name,
            "dataset_details": {
                "type": dataset_type,
                "image_count": image_count,
                "description": f"Mocked {dataset_type.lower()} dataset for {dataset_name}"
            },
            "execution_environment": {
                "cpu": "MockCPU v1",
                "gpu": random.choice(["MockGPU v1", "N/A"]),
                "ram_gb": random.choice([8, 16, 32]),
                "os": "MockOS vMajor.Minor"
            },
            "benchmark_run_date": run_date.isoformat(timespec='seconds') + 'Z',
            "speed_metrics": {
                "processing_time_seconds_total": total_time,
                "processing_time_seconds_per_unit": time_per_unit,
                "units_per_second": units_per_sec
            },
            "accuracy_metrics": accuracy_metrics,
            "additional_notes": f"This is auto-generated mock data record #{i+1}."
        }
        mock_data.append(record)
    return mock_data

@app.route('/api/benchmarks')
def get_benchmarks():
    """
    API endpoint to get all benchmark data.
    If no real data is found, serves mock data.
    """
    benchmark_data = load_benchmark_data(DATA_DIR)
    if not benchmark_data:
        print("INFO: No real benchmark data found in data/ directory. Serving generated mock data.")
        benchmark_data = generate_mock_benchmark_data() # Default 8 records
    return jsonify(benchmark_data)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """
    Serves the React application.
    """
    react_app_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend/dist')
    if path != "" and os.path.exists(os.path.join(react_app_dir, path)):
        return send_from_directory(react_app_dir, path)
    else:
        return send_from_directory(react_app_dir, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
