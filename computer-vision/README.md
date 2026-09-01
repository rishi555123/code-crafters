# computer-vision
# Computer Vision — Rock Crack Detection

## Overview

This module provides the Computer Vision component of the rockfall monitoring system.

It analyzes images of rock slopes using a YOLOv8 segmentation model to:

- Detect visible cracks
- Estimate crack severity
- Estimate deformation relative to a zone-specific reference image
- Return structured results through a FastAPI endpoint

The Computer Vision module is responsible only for image analysis and does not implement the final risk-scoring, alerting, database, or frontend logic.

---

## Main Outputs

The `/cv/analyze` endpoint returns:

```text
crack_detected
crack_severity
deformation_mm
```

It also returns:

```text
crack_confidence
```

for additional model information.

---

## Architecture

```text
                    Uploaded Image
                           |
                           v
                    FastAPI Endpoint
                    POST /cv/analyze
                           |
                           v
                    Image Validation
                           |
                           v
                  YOLOv8 Segmentation
                           |
             +-------------+-------------+
             |                           |
             v                           v
       Crack Detection             Crack Masks/BBoxes
             |                           |
             v                           v
       Confidence                  Deformation
             |                           |
             v                           |
       Severity Analysis <--------------+
             |
             v
                    JSON Response
```

---

## Project Structure

```text
computer-vision/
│
├── app.py
├── inference.py
├── severity.py
├── deformation.py
├── requirements.txt
├── README.md
│
├── models/
│   └── crack-seg-best.pt
│
├── tests/
│   ├── test_api.py
│   └── test_inference.py
│
├── data/
│   └── test/
│
└── outputs/
```

### File Responsibilities

| File | Purpose |
|---|---|
| `app.py` | FastAPI application and `/cv/analyze` endpoint |
| `inference.py` | Loads YOLOv8 and performs image inference |
| `severity.py` | Calculates crack severity |
| `deformation.py` | Calculates deformation between current and reference detections |
| `requirements.txt` | Python dependencies |
| `models/crack-seg-best.pt` | Trained YOLOv8 segmentation model |
| `tests/test_inference.py` | Inference tests |
| `tests/test_api.py` | API tests |
| `outputs/` | Generated YOLO prediction images |
| `data/` | Local test/dataset images |

---

# Model

The Computer Vision module uses a YOLOv8 segmentation model.

The trained model is located at:

```text
models/crack-seg-best.pt
```

The model is loaded using:

```python
YOLO("models/crack-seg-best.pt")
```

The model detects the `crack` class.

The inference pipeline obtains:

- Class ID
- Class name
- Confidence
- Bounding box
- Segmentation mask

for each detection.

---

# Model File

The trained model file:

```text
models/crack-seg-best.pt
```

is already committed to the repository.

Therefore, a developer cloning the repository does not need to separately download the trained model.

The additional YOLO development weight files such as:

```text
yolov8n-seg.pt
models/yolov8n-seg.pt
```

are not required for the production inference endpoint.

---

# Crack Detection

YOLOv8 processes the uploaded image and returns detections.

Each detection is represented internally as:

```json
{
  "class_id": 0,
  "class_name": "crack",
  "confidence": 0.8777,
  "bbox": [x1, y1, x2, y2],
  "mask": [...]
}
```

The crack confidence is extracted from the YOLO prediction.

The configured confidence threshold is:

```text
0.25
```

A crack is considered detected when:

```text
crack_confidence >= 0.25
```

Therefore:

```text
confidence >= 0.25
        |
        v
crack_detected = true
```

Otherwise:

```text
crack_detected = false
```

When the crack is not considered detected, the severity returned by the inference pipeline is:

```text
NONE
```

---

# Segmentation Masks

The YOLO model is a segmentation model rather than a bounding-box-only detector.

For each detection, the system attempts to extract the segmentation polygon from:

```text
result.masks.xy
```

The polygon is stored in the detection as:

```text
mask
```

If a mask is unavailable, the value is:

```text
null
```

The segmentation output can be used for future improvements to crack-area measurement and crack-shape analysis.

---

# Crack Severity

Crack severity is calculated in `severity.py`.

The calculation considers:

1. Crack confidence
2. Relative bounding-box area

Only crack detections with confidence greater than or equal to:

```text
0.25
```

are considered for severity calculation.

The supported severity values are:

```text
NONE
LOW
MEDIUM
HIGH
```

---

## Severity Rules

The current implementation uses the following rules.

### NONE

Returned when there are no valid crack detections.

```text
confidence < 0.25
```

or no crack detection exists.

---

### HIGH

Returned when either:

```text
confidence >= 0.80
```

or:

```text
crack area / image area >= 0.10
```

---

### MEDIUM

Returned when either:

```text
confidence >= 0.50
```

or:

```text
crack area / image area >= 0.03
```

---

### LOW

Returned when a valid crack is detected but the HIGH and MEDIUM thresholds are not reached.

---

## Severity Flow

```text
                  Crack Detection
                        |
                        v
               Confidence >= 0.25?
                 /             \
               No               Yes
               |                 |
               v                 v
             NONE          Calculate severity
                                  |
                    +-------------+-------------+
                    |                           |
             confidence >= 0.80          area ratio >= 0.10
                    |                           |
                    +-------------+-------------+
                                  |
                                 YES
                                  |
                                  v
                                HIGH

                         Otherwise
                            |
                            v
                 confidence >= 0.50
                       OR
                  area ratio >= 0.03
                       |
                    YES |
                       v
                    MEDIUM

                         Otherwise
                            |
                            v
                           LOW
```

---

# Deformation Estimation

Deformation is calculated in:

```text
deformation.py
```

The system compares the current crack detections with reference crack detections.

The comparison is based on the center point of each crack bounding box.

For a bounding box:

```text
[x1, y1, x2, y2]
```

the center is calculated as:

```text
center_x = (x1 + x2) / 2
center_y = (y1 + y2) / 2
```

The Euclidean distance between the current and closest reference crack centers is calculated:

```text
distance = sqrt(dx² + dy²)
```

The largest detected displacement is then converted from pixels to millimetres.

---

# Pixel-to-Millimetre Conversion

The current calibration value is:

```text
PIXELS_PER_MM = 10.0
```

The conversion is:

```text
deformation_mm = displacement_pixels / pixels_per_mm
```

For example:

```text
70 pixels / 10 pixels per mm = 7.0 mm
```

and:

```text
120 pixels / 10 pixels per mm = 12.0 mm
```

The returned deformation value is rounded to two decimal places.

---

# Zone-Specific Reference Frame

Deformation uses a reference detection set for each `zone_id`.

The reference detections are currently stored in memory in:

```python
REFERENCE_DETECTIONS: dict[str, list[dict]] = {}
```

The process is:

```text
First request for SLOPE_A
          |
          v
Run YOLO
          |
          v
Store detections as SLOPE_A baseline
          |
          v
deformation_mm = 0
```

For the next request:

```text
New SLOPE_A image
          |
          v
Run YOLO
          |
          v
Compare with SLOPE_A baseline
          |
          v
Calculate deformation_mm
```

Different zones have separate reference detections:

```text
SLOPE_A → Reference A
SLOPE_B → Reference B
SLOPE_C → Reference C
```

---

## Important Baseline Limitation

The current baseline is stored in application memory.

Therefore, restarting the FastAPI server clears:

```text
REFERENCE_DETECTIONS
```

and the next image received for each zone becomes its new reference.

For a production deployment, the reference frame should ideally be persisted or explicitly configured as a calibration/reference image for each zone.

Possible production improvements include:

- Persistent reference storage
- Explicit baseline/calibration images
- Camera calibration
- Image registration
- Perspective correction
- Temporal tracking
- Improved physical deformation estimation

---

# Deformation Behavior

If either the current detections or reference detections are unavailable:

```text
deformation_mm = 0.0
```

If `pixels_per_mm` is invalid or less than or equal to zero:

```text
deformation_mm = 0.0
```

If no matching crack detections are available:

```text
deformation_mm = 0.0
```

This prevents invalid deformation calculations.

---

# FastAPI

The Computer Vision service uses FastAPI.

The main endpoint is:

```text
POST /cv/analyze
```

It accepts:

- `image` — uploaded image file
- `zone_id` — identifier for the monitored zone

---

# Environment Setup

## Requirements

The project requires Python and the packages listed in:

```text
requirements.txt
```

Current dependencies:

```text
ultralytics
opencv-python
numpy
fastapi
uvicorn
python-multipart
```

The API also uses Pillow for uploaded-image validation.

If Pillow is not already present in the environment, install it with:

```bash
pip install Pillow
```

---

# Installation

Open a terminal in the `computer-vision` directory.

## Windows

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If Pillow is not included in the requirements file:

```bash
pip install Pillow
```

---

# Running the Service

Start the FastAPI server:

```bash
uvicorn app:app --reload --port 8000
```

The service will be available at:

```text
http://127.0.0.1:8000
```

---

# Health Check

The service provides a health endpoint:

```text
GET /health
```

Example:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

# Swagger API Documentation

FastAPI automatically provides interactive API documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

From Swagger, select:

```text
POST /cv/analyze
```

Then upload an image and enter the required `zone_id`.

---

# Analyze Image

## Endpoint

```text
POST /cv/analyze
```

### Request Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `image` | File | Yes | Image to analyze |
| `zone_id` | String | Yes | Monitored slope/zone identifier |

Example:

```bash
curl -X POST \
  "http://127.0.0.1:8000/cv/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@test.png;type=image/png" \
  -F "zone_id=SLOPE_A"
```

---

# API Response

Example:

```json
{
  "zone_id": "SLOPE_A",
  "timestamp": "2026-08-22T11:20:30.723844+00:00",
  "crack_detected": true,
  "crack_severity": "HIGH",
  "deformation_mm": 0.0,
  "crack_confidence": 0.8777225017547607
}
```

---

## Response Fields

| Field | Type | Description |
|---|---|---|
| `zone_id` | string | Identifier of the analyzed zone |
| `timestamp` | string | UTC timestamp of the analysis |
| `crack_detected` | boolean | Whether a crack meeting the confidence threshold was detected |
| `crack_severity` | string | `NONE`, `LOW`, `MEDIUM`, or `HIGH` |
| `deformation_mm` | float | Estimated deformation relative to the stored zone reference |
| `crack_confidence` | float | Highest confidence among detected cracks |

---

# Example Outputs

## Crack Detected

```json
{
  "zone_id": "SLOPE_A",
  "timestamp": "...",
  "crack_detected": true,
  "crack_severity": "HIGH",
  "deformation_mm": 0.0,
  "crack_confidence": 0.8777
}
```

---

## No Crack Detected

When no crack meets the confidence threshold:

```json
{
  "zone_id": "SLOPE_A",
  "timestamp": "...",
  "crack_detected": false,
  "crack_severity": "NONE",
  "deformation_mm": 0.0,
  "crack_confidence": 0.0
}
```

---

# Image Validation

Before inference, the API validates the uploaded file using Pillow.

Invalid image files are rejected before being passed to YOLO.

For example, uploading a text file instead of an image results in:

```text
400 Bad Request
```

with:

```json
{
  "detail": "Uploaded file is not a valid image"
}
```

If the required image field is missing, FastAPI returns:

```text
422 Unprocessable Entity
```

---

# Prediction Output

During inference, YOLO's annotated prediction is saved to:

```text
outputs/prediction.jpg
```

This file is useful for local inspection and debugging.

The API response itself does not return the prediction image. It returns the structured detection results required by the CV API contract.

---

# Testing

The project contains automated tests for both inference and the API.

Run the complete test suite:

```bash
pytest -q
```

The tests cover:

- YOLO model inference
- Crack detection
- Crack confidence
- Crack severity
- Segmentation mask handling
- API response fields
- Missing image validation
- Invalid image validation
- Deformation behavior

---

# Inference Testing

The inference function can be tested directly:

```python
from inference import analyze_image

result = analyze_image(
    "data/test/images/test.png"
)

print(result["crack_detected"])
print(result["crack_confidence"])
print(result["crack_severity"])
print(result["deformation_mm"])
```

Example:

```text
True
0.8777225017547607
HIGH
0.0
```

The first image for a zone has no previous reference available, so deformation is expected to be:

```text
0.0 mm
```

when called without `reference_detections`.

---

# Deformation Testing

The deformation calculation can be tested independently.

Example:

```python
from deformation import calculate_deformation

current = [
    {
        "class_name": "crack",
        "bbox": [80, 20, 180, 120]
    }
]

reference = [
    {
        "class_name": "crack",
        "bbox": [10, 20, 110, 120]
    }
]

deformation = calculate_deformation(
    current,
    reference,
    10
)

print(deformation)
```

The crack centers differ by 70 pixels.

Therefore:

```text
70 / 10 = 7.0 mm
```

Expected result:

```text
7.0
```

---

# Training

The YOLOv8 segmentation model was trained using annotated crack images.

The general training pipeline is:

```text
Crack Dataset
      |
      v
Images + Segmentation Annotations
      |
      v
YOLOv8 Segmentation Training
      |
      v
Validation
      |
      v
Best Model
      |
      v
crack-seg-best.pt
      |
      v
models/crack-seg-best.pt
```

The trained model is then used by:

```text
inference.py
```

for application inference.

---

# Dataset Recommendations

For future model improvements, the training dataset should closely represent the actual deployment environment.

Useful images include:

- Natural rock cracks
- Open-pit mine slopes
- Rock faces
- Quarry environments
- Excavated slopes
- Different crack widths
- Small cracks
- Large cracks
- Partially visible cracks
- Different camera distances
- Different lighting conditions
- Different weather conditions
- Rock surfaces without cracks

No-crack images are particularly useful for reducing false-positive detections.

---

# Model Improvement

The current model can be improved by increasing the amount and diversity of deployment-specific training data.

Potential improvements include:

### Dataset expansion

Add more:

- Rock slope images
- Open-pit mine images
- Natural rock crack images
- Negative/no-crack images

### Data augmentation

Potential augmentation techniques include:

- Rotation
- Scaling
- Cropping
- Brightness changes
- Contrast changes
- Blur
- Noise

### Model evaluation

Future model versions should be evaluated using:

- Precision
- Recall
- mAP50
- mAP50-95
- Segmentation metrics
- False-positive analysis
- False-negative analysis

---

# Scope

The Computer Vision module is responsible for:

1. Receiving an image
2. Validating the uploaded image
3. Running YOLOv8 segmentation
4. Detecting cracks
5. Calculating crack confidence
6. Calculating crack severity
7. Extracting crack bounding boxes
8. Extracting segmentation masks
9. Comparing detections with a zone reference
10. Estimating deformation in millimetres
11. Returning structured CV results through the API

The module does not handle:

- Final risk scoring
- Alert generation
- Notifications
- PostgreSQL/database management
- Frontend UI
- User authentication
- General backend business logic

Those responsibilities belong to other components of the overall system.

---

# Production Considerations

The current implementation provides the complete CV inference pipeline and API integration.

For production deployment, the following improvements can be considered:

### Persistent baselines

Currently, reference detections are stored in application memory.

A production system should persist the reference/calibration information so that it survives application restarts.

### Camera calibration

The current:

```text
PIXELS_PER_MM = 10.0
```

is a configurable calibration value.

For accurate physical measurements, the pixels-per-mm relationship should be calibrated for the actual camera, distance, and scene.

### Image registration

Before comparing two frames, image registration can compensate for camera movement and alignment differences.

### Temporal tracking

Multiple consecutive frames can be used to reduce noise and improve deformation estimation.

### Improved crack measurement

Segmentation masks can be used in future versions to calculate crack length, width, and area more accurately than bounding boxes alone.

---

# Quick Start

```bash
cd computer-vision

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

pip install Pillow

uvicorn app:app --reload --port 8000
```

Then open:

```text
http://127.0.0.1:8000/docs
```

Select:

```text
POST /cv/analyze
```

Upload an image and enter:

```text
zone_id = SLOPE_A
```

The service returns:

```json
{
  "zone_id": "SLOPE_A",
  "timestamp": "...",
  "crack_detected": true,
  "crack_severity": "HIGH",
  "deformation_mm": 0.0,
  "crack_confidence": 0.8777
}
```

---

# Summary

The Computer Vision module provides YOLOv8-based rock crack detection, crack severity estimation, and deformation estimation through a FastAPI service.

The trained model is:

```text
models/crack-seg-best.pt
```

The main API endpoint is:

```text
POST /cv/analyze
```

The primary CV outputs are:

```text
crack_detected
crack_severity
deformation_mm
```

An additional diagnostic value is:

```text
crack_confidence
```

The module is designed to provide reliable image-analysis results to the rest of the rockfall monitoring system while keeping Computer Vision responsibilities separate from downstream risk-management and backend logic.