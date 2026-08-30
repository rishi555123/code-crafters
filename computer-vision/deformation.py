from __future__ import annotations

from typing import Any


def _center(bbox: list[float]) -> tuple[float, float]:
    x1, y1, x2, y2 = bbox

    return (
        (x1 + x2) / 2.0,
        (y1 + y2) / 2.0,
    )


def calculate_deformation(
    current_detections: list[dict[str, Any]],
    reference_detections: list[dict[str, Any]],
    pixels_per_mm: float,
) -> float:
    if not current_detections or not reference_detections:
        return 0.0

    if pixels_per_mm <= 0:
        return 0.0

    current_cracks = [
        detection
        for detection in current_detections
        if detection.get("class_name", "").lower() == "crack"
    ]

    reference_cracks = [
        detection
        for detection in reference_detections
        if detection.get("class_name", "").lower() == "crack"
    ]

    if not current_cracks or not reference_cracks:
        return 0.0

    displacements = []

    for current in current_cracks:
        current_bbox = current.get("bbox", [])

        if len(current_bbox) != 4:
            continue

        current_center = _center(current_bbox)

        closest_distance = None

        for reference in reference_cracks:
            reference_bbox = reference.get("bbox", [])

            if len(reference_bbox) != 4:
                continue

            reference_center = _center(reference_bbox)

            dx = current_center[0] - reference_center[0]
            dy = current_center[1] - reference_center[1]

            distance = (dx * dx + dy * dy) ** 0.5

            if closest_distance is None or distance < closest_distance:
                closest_distance = distance

        if closest_distance is not None:
            displacements.append(closest_distance)

    if not displacements:
        return 0.0

    maximum_displacement_pixels = max(displacements)

    deformation_mm = maximum_displacement_pixels / pixels_per_mm

    return round(deformation_mm, 2)