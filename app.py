import os
import json
# random and datetime, timedelta are no longer needed for mock data generation here
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd # Though pandas might not be heavily used by current functions

app = Flask(__name__, static_folder='frontend/dist/assets')
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DEFAULT_MOCK_FILE = "default_mock_data.json"

def load_benchmark_data(data_dir):
    user_data_loaded = []
    user_files_found = False

    if not os.path.exists(data_dir):
        print(f"WARNING: Data directory '{data_dir}' not found at '{os.path.abspath(data_dir)}'.")
        # Try to load default mock data even if DATA_DIR itself is missing, assuming it might be in a known path
        # However, for consistency, let's assume default_mock_data.json should also be in data_dir.
        # So if data_dir doesn't exist, nothing can be loaded.
        return []

    print(f"INFO: Scanning for user-provided data in: {os.path.abspath(data_dir)}")
    for filename in os.listdir(data_dir):
        if filename.endswith('.json') and filename != DEFAULT_MOCK_FILE:
            user_files_found = True
            filepath = os.path.join(data_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        print(f"INFO: Successfully loaded user data from '{filename}'.")
                        user_data_loaded.extend(data)
                    else:
                        print(f"WARNING: User JSON file '{filename}' does not contain a list. Skipping.")
            except json.JSONDecodeError as e:
                print(f"ERROR: Error decoding JSON from user file '{filename}': {e}")
            except Exception as e:
                print(f"ERROR: An unexpected error occurred while processing user file '{filename}': {e}")

    if user_data_loaded:
        print("INFO: Serving combined user-provided data.")
        return user_data_loaded

    # If no user data was loaded, or no user files (other than default) were found
    if not user_files_found: # This condition means only default_mock_data.json could be there, or dir is empty of other jsons
        print(f"INFO: No user-provided data files found or loaded. Attempting to load '{DEFAULT_MOCK_FILE}'.")
    else: # User files were found but perhaps all were invalid or empty lists
        print(f"INFO: User-provided data files were found but resulted in no data. Attempting to load '{DEFAULT_MOCK_FILE}'.")

    default_mock_filepath = os.path.join(data_dir, DEFAULT_MOCK_FILE)
    if os.path.exists(default_mock_filepath):
        try:
            with open(default_mock_filepath, 'r') as f:
                default_data = json.load(f)
                if isinstance(default_data, list):
                    print(f"INFO: Successfully loaded '{DEFAULT_MOCK_FILE}'.")
                    return default_data
                else:
                    print(f"WARNING: '{DEFAULT_MOCK_FILE}' does not contain a list. Cannot serve default mock data.")
        except json.JSONDecodeError as e:
            print(f"ERROR: Error decoding JSON from '{DEFAULT_MOCK_FILE}': {e}")
        except Exception as e:
            print(f"ERROR: An unexpected error occurred while processing '{DEFAULT_MOCK_FILE}': {e}")
    else:
        print(f"INFO: '{DEFAULT_MOCK_FILE}' not found. No data will be served.")

    return [] # Return empty if no user data and default mock also fails or not found

@app.route('/api/benchmarks')
def get_benchmarks():
    """
    API endpoint to get all benchmark data.
    Prioritizes user data; falls back to default_mock_data.json if no user data.
    """
    benchmark_data = load_benchmark_data(DATA_DIR)
    # Log message about what's being served is now handled within load_benchmark_data
    if not benchmark_data:
        print("INFO: API is serving an empty list as no user data or default mock data could be loaded.")
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
