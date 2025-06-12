import os
import json
import shutil
import tempfile
import unittest
import sys

# Add project root to Python path to allow direct import of app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Assuming app is the Flask instance from your app.py
from app import app, load_benchmark_data

class TestBenchmarkApp(unittest.TestCase):

    def setUp(self):
        # Temp directory for testing load_benchmark_data directly
        self.direct_load_temp_dir = tempfile.mkdtemp()

        # Store the original app.DATA_DIR to restore it in tearDown
        self.original_app_data_dir = app.DATA_DIR

        # Create a temporary directory that will simulate the app's actual data directory for API endpoint tests
        self.api_test_data_dir = tempfile.mkdtemp()
        # Point app.DATA_DIR to this temporary directory for the duration of tests that use the API
        app.DATA_DIR = self.api_test_data_dir

        app.config['TESTING'] = True
        self.client = app.test_client()

    def tearDown(self):
        # Clean up temporary directories
        shutil.rmtree(self.direct_load_temp_dir)
        shutil.rmtree(self.api_test_data_dir)
        # Restore the original app.DATA_DIR
        app.DATA_DIR = self.original_app_data_dir

    def _create_test_json_file_in_dir(self, directory, filename, content):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'w') as f:
            json.dump(content, f)
        return filepath

    # --- Tests for load_benchmark_data function (using self.direct_load_temp_dir) ---
    def test_direct_load_valid_json_files(self):
        self._create_test_json_file_in_dir(self.direct_load_temp_dir, 'data1.json', [{'id': 1, 'value': 'A'}])
        self._create_test_json_file_in_dir(self.direct_load_temp_dir, 'data2.json', [{'id': 2, 'value': 'B'}])
        data = load_benchmark_data(self.direct_load_temp_dir)
        self.assertEqual(len(data), 2) # data1.json + data2.json means 2 items if data2.json is a single record list
                                       # If data2.json has two records, then this should be 3.
                                       # Based on previous test, it was 3. [{'id': 2, 'value': 'B'}, {'id': 3, 'value': 'C'}]
                                       # Let's assume data2.json has one record for simplicity here.
                                       # The important part is that it loads what's there.
        # For a more precise check:
        loaded_ids = {item['id'] for item in data}
        self.assertIn(1, loaded_ids)
        self.assertIn(2, loaded_ids)


    def test_direct_load_empty_directory(self):
        data = load_benchmark_data(self.direct_load_temp_dir)
        self.assertEqual(len(data), 0)

    def test_direct_load_file_with_invalid_json_structure(self):
        filepath = os.path.join(self.direct_load_temp_dir, 'invalid.json')
        with open(filepath, 'w') as f:
            f.write("{'id': 1, 'value': 'A'}") # Invalid JSON (single quotes)
        data = load_benchmark_data(self.direct_load_temp_dir)
        self.assertEqual(len(data), 0) # Should skip the invalid file

    # --- Tests for /api/benchmarks endpoint (these will use self.api_test_data_dir as app.DATA_DIR) ---
    def test_api_serves_mock_data_when_data_dir_is_empty(self):
        # self.api_test_data_dir is currently app.DATA_DIR and is empty
        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, 'application/json')

        data = response.json
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 8) # Default number of mock records
        if len(data) > 0:
            record = data[0]
            self.assertIn('algorithm_name', record)
            self.assertIn('dataset_name', record)
            self.assertIn('speed_metrics', record)
            self.assertIn('accuracy_metrics', record)
            self.assertIn('benchmark_run_date', record)
            self.assertIn('id', record) # Check for the 'id' field
            self.assertTrue(record['id'].startswith('mock-item-'))

    def test_api_serves_real_data_when_present_and_not_mock(self):
        # Add real data to self.api_test_data_dir
        real_data_content = [{'id': 'real_item_1', 'description': 'This is real data'}]
        self._create_test_json_file_in_dir(self.api_test_data_dir, 'real_data.json', real_data_content)

        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, 'application/json')

        data = response.json
        self.assertEqual(data, real_data_content) # Should be exactly the real data
        # Verify it's not mock data by checking a known field or the mock ID prefix
        if len(data) > 0:
            self.assertFalse(data[0].get('id', '').startswith('mock-item-'))

    def test_index_route_serves_dummy_react_index(self):
        # This test checks if Flask is configured to serve an index.html for the root path.
        # It creates a dummy index.html in the expected 'frontend/dist' location.

        # Determine project root to correctly path to 'frontend/dist'
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        frontend_dist_dir = os.path.join(project_root, 'frontend/dist')
        os.makedirs(frontend_dist_dir, exist_ok=True)
        dummy_index_path = os.path.join(frontend_dist_dir, 'index.html')

        with open(dummy_index_path, 'w') as f:
            f.write("<h1>Mock React App Served by Flask</h1>")

        try:
            response = self.client.get('/')
            self.assertEqual(response.status_code, 200)
            self.assertTrue(b"Mock React App Served by Flask" in response.data)
        finally:
            # Clean up the dummy index.html and frontend/dist directory if it was created
            if os.path.exists(dummy_index_path):
                os.remove(dummy_index_path)
            if os.path.exists(frontend_dist_dir) and not os.listdir(frontend_dist_dir):
                 os.rmdir(frontend_dist_dir)


if __name__ == '__main__':
    unittest.main()
