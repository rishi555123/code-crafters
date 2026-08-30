from __future__ import annotations

from pathlib import Path
from typing import Any

from ultralytics import YOLO

from deformation import calculate_deformation
from severity import CONFIDENCE_THRESHOLD, calculate_severity


MODEL_PATH = "models/crack-seg-best.pt"
OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

PIXELS_PER_MM = 10.0


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
    pixels_per_mm: float = PIXELS_PER_MM,
) -> dict[str, Any]:

    if model is None:
        model = load_model()

    results = model(
        image_path,
        verbose=False,
    )

    detections = []

    image_width = 0
    image_height = 0

    for result in results:

        orig_shape = getattr(
            result,
            "orig_shape",
            None,
        )

        if orig_shape is not None and len(orig_shape) >= 2:
            image_height = int(orig_shape[0])
            image_width = int(orig_shape[1])

        names = getattr(
            result,
            "names",
            getattr(model, "names", {}),
        )

        masks = getattr(
            result,
            "masks",
            None,
        )

        boxes = getattr(
            result,
            "boxes",
            [],
        )

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
                try:
                    mask_data = masks.xy[i]

                    if hasattr(
                        mask_data,
                        "tolist",
                    ):
                        mask = mask_data.tolist()
                    else:
                        mask = list(mask_data)

                except (
                    IndexError,
                    TypeError,
                ):
                    mask = None

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": coordinates,
                    "mask": mask,
                }
            )

        output_path = (
            OUTPUT_DIR / "prediction.jpg"
        )

        result.save(
            filename=str(output_path)
        )

    crack_detections = [
        detection
        for detection in detections
        if (
            detection.get(
                "class_name",
                "",
            ).lower()
            == "crack"
            or detection.get(
                "class_id"
            )
            == 0
        )
    ]

    crack_confidence = max(
        [
            float(
                detection.get(
                    "confidence",
                    0.0,
                )
            )
            for detection in crack_detections
        ],
        default=0.0,
    )

    crack_detected = (
        crack_confidence
        >= CONFIDENCE_THRESHOLD
    )

    if crack_detected:
        crack_severity = calculate_severity(
            detections=detections,
            image_width=image_width,
            image_height=image_height,
        )
    else:
        crack_severity = "NONE"

    deformation_mm = 0.0

    if reference_detections is not None:
        deformation_mm = calculate_deformation(
            current_detections=detections,
            reference_detections=reference_detections,
            pixels_per_mm=pixels_per_mm,
        )

    return {
        "crack_detected": crack_detected,
        "crack_confidence": crack_confidence,
        "crack_severity": crack_severity,
        "deformation_mm": deformation_mm,
        "object_count": len(detections),
        "detections": detections,
    }