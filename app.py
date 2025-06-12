import os
import json
from flask import Flask, jsonify, send_from_directory, render_template
from flask_cors import CORS # Import CORS
import pandas as pd

app = Flask(__name__, static_folder='frontend/dist/assets')
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Enable CORS for API routes, allowing all origins for simplicity in dev.
                                                 # For production, you might restrict this to your frontend's domain.

# The DATA_DIR should point to the existing 'data' directory at the root of the project
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')


def load_benchmark_data(data_dir):
    """
    Loads all benchmark data from JSON files in the specified directory.
    Each JSON file is expected to contain a list of benchmark records.
    """
    all_data = []
    if not os.path.exists(data_dir):
        print(f"Data directory '{data_dir}' not found at '{os.path.abspath(data_dir)}'.")
        return all_data

    print(f"Loading data from: {os.path.abspath(data_dir)}")
    for filename in os.listdir(data_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(data_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_data.extend(data)
                    else:
                        print(f"Warning: JSON file '{filename}' does not contain a list of records at its root. Skipping.")
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from file '{filename}': {e}")
            except Exception as e:
                print(f"An unexpected error occurred while processing file '{filename}': {e}")
    return all_data

@app.route('/api/benchmarks')
def get_benchmarks():
    """
    API endpoint to get all benchmark data.
    """
    benchmark_data = load_benchmark_data(DATA_DIR)
    return jsonify(benchmark_data)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """
    Serves the React application.
    For the root path, it serves 'index.html'.
    For other paths (client-side routes), it also serves 'index.html'
    to let React Router handle them.
    Static assets are handled by Flask's static_folder configuration.
    """
    react_app_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend/dist')

    if path != "" and os.path.exists(os.path.join(react_app_dir, path)):
        # This condition is mostly for other static files that might be in 'dist' but not in 'dist/assets'
        # However, Vite usually puts everything under 'assets' or referenced from index.html.
        return send_from_directory(react_app_dir, path)
    else:
        # Serve index.html for the root or any path not found (for client-side routing)
        return send_from_directory(react_app_dir, 'index.html')


if __name__ == '__main__':
    # Note: For development with Vite, you'd run Flask and Vite dev server separately.
    # Flask serves the API, Vite serves the frontend with HMR.
    # For production, Flask serves the built React app from frontend/dist.
    app.run(debug=True, port=5000)
