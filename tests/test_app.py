import os
import json
import shutil
import tempfile
import unittest

# Add project root to Python path to allow direct import of app
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, load_benchmark_data

class TestBenchmarkApp(unittest.TestCase):

    def setUp(self):
        # Create a temporary directory for data files
        self.test_data_dir = tempfile.mkdtemp()
        # Set the DATA_DIR for the app to this temp directory for tests
        # This is a bit tricky as app.py defines DATA_DIR at module level.
        # For robust testing, app configuration should ideally be injectable.
        # For this example, we'll test load_benchmark_data directly with our temp dir.
        # And for the app.test_client(), it will use the 'data' dir from the app's perspective.
        # So we'll also create a temporary 'data' dir in the project root for endpoint tests.

        self.app_data_dir_backup = app.config.get('DATA_DIR', 'data') # Store original if set
        app.DATA_DIR = self.test_data_dir # Override for direct load_benchmark_data tests

        self.client = app.test_client()
        app.config['TESTING'] = True


    def tearDown(self):
        # Remove the temporary directory and its contents
        shutil.rmtree(self.test_data_dir)
        app.DATA_DIR = self.app_data_dir_backup # Restore for safety

    def _create_test_json_file(self, filename, content):
        filepath = os.path.join(self.test_data_dir, filename)
        with open(filepath, 'w') as f:
            json.dump(content, f)
        return filepath

    # Tests for load_benchmark_data function
    def test_load_valid_json_files(self):
        self._create_test_json_file('data1.json', [{'id': 1, 'value': 'A'}])
        self._create_test_json_file('data2.json', [{'id': 2, 'value': 'B'}, {'id': 3, 'value': 'C'}])

        data = load_benchmark_data(self.test_data_dir)
        self.assertEqual(len(data), 3)
        self.assertIn({'id': 1, 'value': 'A'}, data)
        self.assertIn({'id': 2, 'value': 'B'}, data)
        self.assertIn({'id': 3, 'value': 'C'}, data)

    def test_load_empty_directory(self):
        data = load_benchmark_data(self.test_data_dir)
        self.assertEqual(len(data), 0)

    def test_load_file_with_invalid_json_structure(self):
        filepath = os.path.join(self.test_data_dir, 'invalid.json')
        with open(filepath, 'w') as f:
            f.write("{'id': 1, 'value': 'A'}") # Invalid JSON (single quotes)

        # Should not raise an error, but print a message and skip the file
        data = load_benchmark_data(self.test_data_dir)
        self.assertEqual(len(data), 0)

    def test_load_file_not_a_list_at_root(self):
        self._create_test_json_file('not_a_list.json', {'id': 1, 'value': 'A'})

        # Should skip this file as per current logic in load_benchmark_data
        data = load_benchmark_data(self.test_data_dir)
        self.assertEqual(len(data), 0)

    def test_load_mixed_valid_and_invalid_files(self):
        self._create_test_json_file('data1.json', [{'id': 1, 'value': 'A'}])
        filepath = os.path.join(self.test_data_dir, 'invalid.json')
        with open(filepath, 'w') as f:
            f.write("this is not json")
        self._create_test_json_file('data2.json', [{'id': 2, 'value': 'B'}])

        data = load_benchmark_data(self.test_data_dir)
        self.assertEqual(len(data), 2)
        self.assertIn({'id': 1, 'value': 'A'}, data)
        self.assertIn({'id': 2, 'value': 'B'}, data)

    def test_load_non_existent_directory(self):
        data = load_benchmark_data(os.path.join(self.test_data_dir, 'non_existent_dir'))
        self.assertEqual(len(data), 0)

    # Tests for /api/benchmarks endpoint
    # For these tests, we need to manipulate the 'data' directory the app sees.
    # We'll create a temporary 'data' dir in the CWD (project root for tests)
    # and then clean it up.

    def test_api_get_benchmarks_empty(self):
        # Ensure a clean 'data' dir for the app context
        original_cwd_data_dir = os.path.join(os.getcwd(), 'data')
        temp_app_data_dir = os.path.join(os.getcwd(), 'data_temp_for_api_test')

        if os.path.exists(original_cwd_data_dir): # Back up existing data dir if any
            os.rename(original_cwd_data_dir, temp_app_data_dir)

        os.makedirs(original_cwd_data_dir, exist_ok=True) # Create empty data dir for app

        # Override app.DATA_DIR for the test client's context
        app_original_data_dir_val = app.DATA_DIR
        app.DATA_DIR = original_cwd_data_dir

        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, 'application/json')
        self.assertEqual(response.json, [])

        # Cleanup
        shutil.rmtree(original_cwd_data_dir)
        if os.path.exists(temp_app_data_dir):
            os.rename(temp_app_data_dir, original_cwd_data_dir)
        app.DATA_DIR = app_original_data_dir_val


    def test_api_get_benchmarks_with_data(self):
        original_cwd_data_dir = os.path.join(os.getcwd(), 'data')
        temp_app_data_dir = os.path.join(os.getcwd(), 'data_temp_for_api_test')

        if os.path.exists(original_cwd_data_dir):
             os.rename(original_cwd_data_dir, temp_app_data_dir)

        os.makedirs(original_cwd_data_dir, exist_ok=True)

        test_data_content = [{'algo': 'test_algo', 'metric': 100}]
        with open(os.path.join(original_cwd_data_dir, 'test_api.json'), 'w') as f:
            json.dump(test_data_content, f)

        app_original_data_dir_val = app.DATA_DIR
        app.DATA_DIR = original_cwd_data_dir

        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, 'application/json')
        self.assertEqual(response.json, test_data_content)

        # Cleanup
        shutil.rmtree(original_cwd_data_dir)
        if os.path.exists(temp_app_data_dir):
            os.rename(temp_app_data_dir, original_cwd_data_dir)
        app.DATA_DIR = app_original_data_dir_val

    def test_index_route(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(b"<h1>Computer Vision Algorithm Benchmarks</h1>" in response.data)


if __name__ == '__main__':
    unittest.main()
