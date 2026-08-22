from __future__ import annotations
import numpy as np
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent))

from inference import analyze_image


class FakeBox:

    def __init__(
        self,
        x1,
        y1,
        x2,
        y2,
        conf=0.9,
        cls=0,
    ):
        self.xyxy = [[x1, y1, x2, y2]]
        self.conf = [conf]
        self.cls = [cls]


class FakeMasks:

    def __init__(self):
        self.xy = [
            np.array(
                [
                    [10, 10],
                    [100, 10],
                    [100, 50],
                    [10, 50],
                ]
            )
        ]

class FakeResult:

    def __init__(self):
        self.boxes = [
            FakeBox(
                10,
                20,
                100,
                110,
                conf=0.91,
                cls=0,
            )
        ]

        self.masks = FakeMasks()
        self.names = {0: "crack"}

    def save(self, filename):
        return None


class FakeYOLO:

    def __call__(self, source, **kwargs):
        return [FakeResult()]


def test_analyze_image_detects_crack(tmp_path):

    image_path = tmp_path / "test.jpg"

    image = Image.new(
        "RGB",
        (640, 480),
        "white",
    )

    image.save(image_path)

    model = FakeYOLO()

    report = analyze_image(
        str(image_path),
        model=model,
    )

    assert report["crack_detected"] is True
    assert report["crack_confidence"] > 0.5
    assert report["crack_severity"] in {
        "LOW",
        "MEDIUM",
        "HIGH",
    }
    assert report["deformation_mm"] == 0.0
    assert report["detections"][0]["class_name"] == "crack"
    assert report["detections"][0]["mask"] is not None