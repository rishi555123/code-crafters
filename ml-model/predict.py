import joblib
import pandas as pd


MODEL_PATH = "risk_model.pkl"

FEATURES = [
    "P16",
    "P5",
    "P17",
    "P2",
    "P1"
]

CLASS_NAMES = {
    0: "Stable",
    1: "Inter-ramp failure",
    2: "Overall failure"
}


model = joblib.load(MODEL_PATH)


def predict_risk(values):

    if len(values) != len(FEATURES):
        raise ValueError(
            f"Expected {len(FEATURES)} features, got {len(values)}"
        )

    input_data = pd.DataFrame(
        [values],
        columns=FEATURES
    )

    prediction = int(model.predict(input_data)[0])

    probabilities = model.predict_proba(input_data)[0]

    return {
    "risk_class": prediction,
    "risk_level": CLASS_NAMES[prediction],
    "confidence": float(max(probabilities))
}