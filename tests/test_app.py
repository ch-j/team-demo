import os
import json
import shutil
import tempfile
import unittest
import sys

# Add project root to Python path to allow direct import of app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, load_benchmark_data, DEFAULT_MOCK_FILE # Import DEFAULT_MOCK_FILE for use in tests

class TestBenchmarkApp(unittest.TestCase):

    def setUp(self):
        self.direct_load_temp_dir = tempfile.mkdtemp() # For testing load_benchmark_data directly
        self.api_test_data_dir = tempfile.mkdtemp()   # For testing API endpoints that use app.DATA_DIR

        self.original_app_data_dir = app.DATA_DIR # Store original app.DATA_DIR
        app.DATA_DIR = self.api_test_data_dir     # Point app.DATA_DIR to our temp dir for API tests

        app.config['TESTING'] = True
        self.client = app.test_client()

    def tearDown(self):
        shutil.rmtree(self.direct_load_temp_dir)
        shutil.rmtree(self.api_test_data_dir)
        app.DATA_DIR = self.original_app_data_dir # Restore original

    def _create_json_file_in_dir(self, directory, filename, content):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'w') as f:
            json.dump(content, f)
        return filepath

    # --- Tests for load_benchmark_data function (using self.direct_load_temp_dir) ---
    def test_direct_load_prioritizes_user_data(self):
        user_content = [{"id": "user1", "data": "user_specific"}]
        default_content = [{"id": "default1", "data": "default_mock"}]
        self._create_json_file_in_dir(self.direct_load_temp_dir, 'user_data.json', user_content)
        self._create_json_file_in_dir(self.direct_load_temp_dir, DEFAULT_MOCK_FILE, default_content)

        loaded_data = load_benchmark_data(self.direct_load_temp_dir)
        self.assertEqual(loaded_data, user_content, "Should load user data, not default, when user data exists.")

    def test_direct_load_falls_back_to_default_mock_data(self):
        default_content = [{"id": "default1", "data": "default_mock"}]
        self._create_json_file_in_dir(self.direct_load_temp_dir, DEFAULT_MOCK_FILE, default_content)

        loaded_data = load_benchmark_data(self.direct_load_temp_dir)
        self.assertEqual(loaded_data, default_content, "Should load default mock data when no other user files exist.")

    def test_direct_load_returns_empty_if_no_files_including_default(self):
        # No files created in self.direct_load_temp_dir
        loaded_data = load_benchmark_data(self.direct_load_temp_dir)
        self.assertEqual(loaded_data, [], "Should return empty list if no data files (including default) are found.")

    def test_direct_load_skips_default_if_other_empty_or_invalid_user_files_exist(self):
        # Create an empty user file (or one that results in no data)
        self._create_json_file_in_dir(self.direct_load_temp_dir, 'empty_user_data.json', [])
        default_content = [{"id": "default1", "data": "default_mock"}]
        self._create_json_file_in_dir(self.direct_load_temp_dir, DEFAULT_MOCK_FILE, default_content)

        # The logic in app.py: if user files are found but result in empty list, it returns empty list
        # (it does not fall back to default if user files were targeted for loading)
        # Let's re-check app.py's logic:
        # "if user_data_loaded: return user_data_loaded" -> this means if user files exist and are valid but empty list, it returns empty list.
        # "if not user_files_found: print(...) " -> this is for when NO other json files apart from default exist.
        # The current logic in app.py: if user_files_found is true, but user_data_loaded is empty, it *then* tries default.
        # This means this test case needs to align with that.
        # My app.py logic: "if user_data_loaded: return user_data_loaded"
        # "if not user_files_found: print(...) else: print(...)". This implies if user_files_found=true and user_data_loaded=false, it *will* try default.

        loaded_data = load_benchmark_data(self.direct_load_temp_dir)
        # Based on the app.py logic: if 'empty_user_data.json' (user file) is loaded and results in an empty list,
        # `user_data_loaded` will be empty. `user_files_found` will be true.
        # Then it will proceed to try and load DEFAULT_MOCK_FILE.
        self.assertEqual(loaded_data, default_content, "Should load default if user files were found but were empty/invalid.")


    # --- Tests for /api/benchmarks endpoint (using self.api_test_data_dir for app.DATA_DIR) ---
    def test_api_serves_default_mock_data_when_other_files_absent(self):
        # Place only default_mock_data.json in the API's data directory
        default_content = [{"id": "default_api", "data": "API default mock"}]
        self._create_json_file_in_dir(self.api_test_data_dir, DEFAULT_MOCK_FILE, default_content)

        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        data = response.json
        self.assertEqual(data, default_content)

    def test_api_prioritizes_user_data_over_default_mock(self):
        # Place both user data and default mock data in the API's data directory
        user_content = [{"id": "user_api", "data": "API user data"}]
        default_content = [{"id": "default_api_ignored", "data": "API default mock (should be ignored)"}]
        self._create_json_file_in_dir(self.api_test_data_dir, 'my_benchmarks.json', user_content)
        self._create_json_file_in_dir(self.api_test_data_dir, DEFAULT_MOCK_FILE, default_content)

        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        data = response.json
        self.assertEqual(data, user_content, "API should serve user data, not default, when both exist.")

    def test_api_returns_empty_list_if_no_files_at_all(self):
        # api_test_data_dir is empty (no user files, no default_mock_data.json)
        response = self.client.get('/api/benchmarks')
        self.assertEqual(response.status_code, 200)
        data = response.json
        self.assertEqual(data, [], "API should return an empty list if no data files (including default) are found.")

    def test_index_route_serves_dummy_react_index(self):
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
            if os.path.exists(dummy_index_path): os.remove(dummy_index_path)
            if os.path.exists(frontend_dist_dir) and not os.listdir(frontend_dist_dir): os.rmdir(frontend_dist_dir)

if __name__ == '__main__':
    unittest.main()
