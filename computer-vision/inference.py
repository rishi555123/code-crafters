from __future__ import annotations

from pathlib import Path
from typing import Any

from PIL import Image
from ultralytics import YOLO

from deformation import calculate_deformation
from severity import calculate_severity


MODEL_PATH = "models/crack-seg-best.pt"
OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)


def load_model(model_path: str = MODEL_PATH) -> YOLO:
    return YOLO(model_path)


def _scalar(value: Any) -> Any:
    if hasattr(value, "item"):
        return value.item()
    return value


def analyze_image(
    image_path: str,
    model: Any | None = None,
    reference_detections: list[dict[str, Any]] | None = None,
    pixels_per_mm: float = 1.0,
) -> dict[str, Any]:

    if model is None:
        model = load_model()

    image = Image.open(image_path)
    image_width, image_height = image.size

    results = model(image_path, verbose=False)

    detections = []

    for result in results:

        names = getattr(
            result,
            "names",
            getattr(model, "names", {}),
        )

        boxes = getattr(result, "boxes", None)
        masks = getattr(result, "masks", None)

        if boxes is None:
            continue

        for i, box in enumerate(boxes):

            coordinates = [
                _scalar(value)
                for value in box.xyxy[0]
            ]

            class_id = int(
                _scalar(box.cls[0])
            )

            confidence = float(
                _scalar(box.conf[0])
            )

            class_name = names.get(
                class_id,
                str(class_id),
            )

            mask = None

            if masks is not None:
                mask = masks.xy[i].tolist()

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": coordinates,
                    "mask": mask,
                }
            )

        output_path = OUTPUT_DIR / "prediction.jpg"
        result.save(filename=str(output_path))

    crack_detections = [
        detection
        for detection in detections
        if detection["class_name"].lower() == "crack"
    ]

    crack_confidence = max(
        [
            detection["confidence"]
            for detection in crack_detections
        ],
        default=0.0,
    )

    crack_severity = calculate_severity(
        detections,
        image_width,
        image_height,
    )

    deformation_mm = calculate_deformation(
        detections,
        reference_detections,
        pixels_per_mm,
    )

    return {
        "crack_detected": bool(crack_detections),
        "crack_confidence": crack_confidence,
        "crack_severity": crack_severity,
        "deformation_mm": deformation_mm,
        "object_count": len(detections),
        "detections": detections,
    }