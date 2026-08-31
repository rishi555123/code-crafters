from __future__ import annotations
from typing import Any
CONFIDENCE_THRESHOLD = 0.25
def calculate_severity(
    detections: list[dict[str, Any]],
    image_width: int,
    image_height: int,
) -> str:
    cracks = [
        detection
        for detection in detections
        if (
            detection.get("class_name", "").lower() == "crack"
            or detection.get("class_id") == 0
        )
        and float(detection.get("confidence", 0.0)) >= CONFIDENCE_THRESHOLD
    ]

    if not cracks:
        return "NONE"

    if image_width <= 0 or image_height <= 0:
        return "LOW"

    image_area = image_width * image_height

    largest_area = 0.0

    for crack in cracks:
        bbox = crack.get("bbox", [])

        if len(bbox) != 4:
            continue

        x1, y1, x2, y2 = map(float, bbox)

        width = max(0.0, x2 - x1)
        height = max(0.0, y2 - y1)

        area = width * height

        largest_area = max(largest_area, area)

    area_ratio = largest_area / image_area

    confidence = max(
        float(crack.get("confidence", 0.0))
        for crack in cracks
    )

    if confidence >= 0.80 or area_ratio >= 0.10:
        return "HIGH"

    if confidence >= 0.50 or area_ratio >= 0.03:
        return "MEDIUM"

    return "LOW"