from __future__ import annotations

from typing import Any


def calculate_severity(
    detections: list[dict[str, Any]],
    image_width: int,
    image_height: int,
) -> str:

    cracks = [
        detection
        for detection in detections
        if detection["class_name"].lower() == "crack"
    ]

    if not cracks:
        return "NONE"

    largest_area = 0.0

    image_area = image_width * image_height

    for crack in cracks:

        bbox = crack.get("bbox")

        if not bbox:
            continue

        x1, y1, x2, y2 = bbox

        width = max(0, x2 - x1)
        height = max(0, y2 - y1)

        area = width * height

        largest_area = max(largest_area, area)

    if image_area <= 0:
        return "NONE"

    area_ratio = largest_area / image_area

    confidence = max(
        crack.get("confidence", 0.0)
        for crack in cracks
    )

    if confidence < 0.25:
        return "NONE"

    if area_ratio >= 0.20:
        return "HIGH"

    if area_ratio >= 0.05:
        return "MEDIUM"

    return "LOW"