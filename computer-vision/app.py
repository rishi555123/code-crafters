from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image

from inference import (
    PIXELS_PER_MM,
    analyze_image,
    load_model,
)


app = FastAPI(title="Computer Vision Inference API")

MODEL = load_model()

REFERENCE_DETECTIONS: dict[str, list[dict]] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/cv/analyze")
async def analyze(
    image: UploadFile = File(...),
    zone_id: str = Form(...),
) -> dict:

    if not image.filename:
        raise HTTPException(
            status_code=400,
            detail="No image provided",
        )

    image_data = await image.read()

    try:
        Image.open(BytesIO(image_data)).verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image",
        )

    suffix = Path(image.filename).suffix or ".jpg"

    with NamedTemporaryFile(
        suffix=suffix,
        delete=False,
    ) as temp_file:
        temp_file.write(image_data)
        temp_path = temp_file.name

    try:
        reference_detections = REFERENCE_DETECTIONS.get(
            zone_id
        )

        result = analyze_image(
            image_path=temp_path,
            model=MODEL,
            reference_detections=reference_detections,
            pixels_per_mm=PIXELS_PER_MM,
        )

        current_detections = result["detections"]

        if zone_id not in REFERENCE_DETECTIONS:
            REFERENCE_DETECTIONS[zone_id] = current_detections

        return {
            "zone_id": zone_id,
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),
            "crack_detected": result["crack_detected"],
            "crack_severity": result["crack_severity"],
            "deformation_mm": result["deformation_mm"],
            "crack_confidence": result["crack_confidence"],
        }

    finally:
        Path(temp_path).unlink(
            missing_ok=True
        )