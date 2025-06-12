# Benchmark Data Format

Benchmark data should be provided in JSON files. Each file can contain a list of benchmark results. Each result object in the list should adhere to the following structure:

{
  "algorithm_name": "string",       // Name of the algorithm (e.g., "Tesseract_OCR", "OpenCV_Checkerboard")
  "algorithm_version": "string",    // Optional: Version of the algorithm or library used (e.g., "5.3.0", "4.7.0")
  "dataset_name": "string",         // Name of the dataset used for this benchmark run (e.g., "SimpleDoc", "LowRes_Checker")
  "dataset_details": {              // Optional: Further details about the dataset
    "type": "string",               // E.g., "OCR", "Checkerboard"
    "image_count": "number",        // Number of images/items in the dataset
    "description": "string"         // Brief description of the dataset
  },
  "execution_environment": {        // Optional: Details about the environment where the benchmark was run
    "cpu": "string",
    "gpu": "string",
    "ram_gb": "number",
    "os": "string"
  },
  "benchmark_run_date": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601 date-time of the benchmark execution
  "speed_metrics": {
    "processing_time_seconds_total": "number", // Total time taken to process the entire dataset
    "processing_time_seconds_per_unit": "number", // Average time taken per image or data unit
    "units_per_second": "number"                // Throughput (e.g., images per second)
  },
  "accuracy_metrics": {
    // Accuracy metrics are highly dependent on the type of algorithm.
    // Examples are provided below. Add new metrics as needed.

    // For OCR:
    "character_error_rate": "number", // (0.0 to 1.0)
    "word_error_rate": "number",      // (0.0 to 1.0)
    "exact_match_accuracy": "number", // (0.0 to 1.0) Percentage of perfectly transcribed texts

    // For Checkerboard Detection:
    "detection_rate": "number",       // (0.0 to 1.0) Percentage of images where checkerboard was found
    "average_corner_distance_error_pixels": "number", // If ground truth corners are available
    "average_reprojection_error_pixels": "number"     // If camera calibration is involved
  },
  "additional_notes": "string"      // Optional: Any other relevant notes or observations
}
