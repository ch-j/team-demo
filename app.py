import os
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd # Though pandas might not be heavily used by current functions

app = Flask(__name__, static_folder='frontend/dist/assets')
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DEFAULT_MOCK_FILE = "default_mock_data.json"

def load_benchmark_data(data_dir):
    user_data_loaded = []
    user_files_found = False # Tracks if any potential user json files (excluding default) were encountered

    print(f"--- Starting benchmark data load from directory: {os.path.abspath(data_dir)} ---")

    if not os.path.exists(data_dir):
        print(f"CRITICAL_WARNING: Data directory does not exist: {os.path.abspath(data_dir)}")
        print("--- Benchmark data load finished: No data directory ---")
        return []

    print(f"INFO: Scanning for user-provided data files (excluding '{DEFAULT_MOCK_FILE}')...")
    for filename in os.listdir(data_dir):
        if filename.endswith('.json') and filename != DEFAULT_MOCK_FILE:
            user_files_found = True
            filepath = os.path.join(data_dir, filename)
            print(f"INFO: Found potential user file: {filepath}")
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        if data: # Check if the list is not empty
                            print(f"INFO: Successfully loaded and extended user data from '{filename}'.")
                            user_data_loaded.extend(data)
                        else:
                            print(f"INFO: User file '{filename}' contained an empty list.")
                    else:
                        print(f"WARNING: User JSON file '{filename}' does not contain a list. Skipping.")
            except json.JSONDecodeError as e:
                print(f"ERROR: Error decoding JSON from user file '{filename}': {e}")
            except Exception as e:
                print(f"ERROR: An unexpected error occurred while processing user file '{filename}': {e}")

    if user_data_loaded: # If user_data_loaded list has actual items
        print(f"INFO: Prioritizing user-provided data. Total records loaded: {len(user_data_loaded)}.")
        print("--- Benchmark data load finished: User data served ---")
        return user_data_loaded

    # Fallback to default mock data if user_data_loaded is empty
    print("INFO: No user data loaded or user data was empty.")
    if not user_files_found:
        print(f"INFO: No user-specific JSON files were found in '{data_dir}'.")
    else:
        print(f"INFO: User-specific JSON files were found in '{data_dir}', but they yielded no data or were empty.")

    print(f"INFO: Attempting to load default data from '{DEFAULT_MOCK_FILE}'.")
    default_mock_filepath = os.path.join(data_dir, DEFAULT_MOCK_FILE)
    print(f"INFO: Expecting default mock file at absolute path: {os.path.abspath(default_mock_filepath)}")

    if os.path.exists(default_mock_filepath):
        print(f"INFO: File '{DEFAULT_MOCK_FILE}' exists at path: {os.path.abspath(default_mock_filepath)}")
        try:
            with open(default_mock_filepath, 'r') as f:
                default_data = json.load(f)
                if isinstance(default_data, list):
                    print(f"INFO: Successfully loaded and parsed '{DEFAULT_MOCK_FILE}'. Records: {len(default_data)}.")
                    print("--- Benchmark data load finished: Default mock data served ---")
                    return default_data
                else:
                    print(f"WARNING: Content of '{DEFAULT_MOCK_FILE}' is not a list. Cannot serve as default.")
        except json.JSONDecodeError as e:
            print(f"ERROR: Error decoding JSON from '{DEFAULT_MOCK_FILE}': {e}")
        except Exception as e:
            print(f"ERROR: An unexpected error occurred while processing '{DEFAULT_MOCK_FILE}': {e}")
    else:
        print(f"CRITICAL_WARNING: Default mock file not found at path: {os.path.abspath(default_mock_filepath)}")

    print("--- Benchmark data load finished: No data served (empty list) ---")
    return []

@app.route('/api/benchmarks')
def get_benchmarks():
    """
    API endpoint to get all benchmark data.
    Prioritizes user data; falls back to default_mock_data.json if no user data.
    """
    print("--- API endpoint /api/benchmarks called ---")
    benchmark_data = load_benchmark_data(DATA_DIR)
    if not benchmark_data:
        print("INFO: API /api/benchmarks is serving an empty list.")
    else:
        print(f"INFO: API /api/benchmarks is serving {len(benchmark_data)} records.")
    print("--- API endpoint /api/benchmarks request complete ---")
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
