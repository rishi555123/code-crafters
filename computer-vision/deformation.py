from __future__ import annotations

from typing import Any


def _get_cracks(
    detections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    return [
        detection
        for detection in detections
        if detection.get("class_name", "").lower() == "crack"
    ]


def _center(
    bbox: list[float],
) -> tuple[float, float]:
    x1, y1, x2, y2 = bbox

    return (
        (x1 + x2) / 2,
        (y1 + y2) / 2,
    )


def calculate_deformation(
    current_detections: list[dict[str, Any]],
    reference_detections: list[dict[str, Any]] | None = None,
    pixels_per_mm: float | None = None,
) -> float:

    if not current_detections:
        return 0.0

    if not reference_detections:
        return 0.0

    if pixels_per_mm is None or pixels_per_mm <= 0:
        return 0.0

    current_cracks = _get_cracks(
        current_detections
    )

    reference_cracks = _get_cracks(
        reference_detections
    )

    if not current_cracks or not reference_cracks:
        return 0.0

    current_bbox = current_cracks[0].get("bbox")
    reference_bbox = reference_cracks[0].get("bbox")

    if not current_bbox or not reference_bbox:
        return 0.0

    current_x, current_y = _center(
        current_bbox
    )

    reference_x, reference_y = _center(
        reference_bbox
    )

    dx = current_x - reference_x
    dy = current_y - reference_y

    pixel_displacement = (
        dx ** 2 + dy ** 2
    ) ** 0.5

    deformation_mm = (
        pixel_displacement / pixels_per_mm
    )

    return round(deformation_mm, 2)