from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

import app


class FakeModel:

    def __call__(self, source, **kwargs):
        return []


def create_test_image():
    image = Image.new(
        "RGB",
        (100, 100),
        "white",
    )

    buffer = BytesIO()
    image.save(buffer, format="JPEG")

    return buffer.getvalue()


def test_health():

    client = TestClient(app.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok"
    }


def test_analyze():

    client = TestClient(app.app)

    app.MODEL = FakeModel()

    image_data = create_test_image()

    response = client.post(
        "/cv/analyze",
        files={
            "image": (
                "test.jpg",
                image_data,
                "image/jpeg",
            )
        },
        data={
            "zone_id": "SLOPE_A"
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["zone_id"] == "SLOPE_A"
    assert "timestamp" in result
    assert "crack_detected" in result
    assert "crack_severity" in result
    assert "deformation_mm" in result
    assert "crack_confidence" in result
def test_missing_image():

    client = TestClient(app.app)

    response = client.post(
        "/cv/analyze",
        data={
            "zone_id": "SLOPE_A"
        },
    )

    assert response.status_code == 422
def test_invalid_image():

    client = TestClient(app.app)

    response = client.post(
        "/cv/analyze",
        files={
            "image": (
                "test.txt",
                b"this is not an image",
                "text/plain",
            )
        },
        data={
            "zone_id": "SLOPE_A"
        },
    )

    assert response.status_code == 400