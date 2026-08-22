from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from inference import analyze_image, load_model


app = FastAPI(title="Computer Vision Inference API")

MODEL = load_model()


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

    content_type = image.content_type or ""

    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file",
        )

    data = await image.read()

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Empty image file",
        )

    suffix = Path(image.filename).suffix or ".jpg"

    with NamedTemporaryFile(
        suffix=suffix,
        delete=False,
    ) as temp_file:

        temp_file.write(data)
        temp_path = temp_file.name

    try:

        try:
            result = analyze_image(
                temp_path,
                model=MODEL,
            )

        except Exception as exc:

            raise HTTPException(
                status_code=500,
                detail={
                    "error": "CV_INFERENCE_FAILED",
                    "message": "Unable to process the supplied image.",
                },
            ) from exc

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