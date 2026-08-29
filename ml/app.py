from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from sklearn.linear_model import LinearRegression

app = FastAPI(title="KrushiSetu ML Service")

class PredictionRequest(BaseModel):
    prices: list[float]
    dates: list[str] = []
    days: int = 7

@app.get("/")
def root():
    return {"message": "KrushiSetu ML service is running"}

@app.post("/predict")
def predict(data: PredictionRequest):
    if len(data.prices) < 3:
        raise HTTPException(status_code=400, detail="At least 3 price observations are required")

    y = np.array(data.prices, dtype=float)
    # Simple baseline model.
    # Replace with a richer time-series model after collecting validated data.
    window = min(len(y), 30)
    y = y[-window:]
    X = np.arange(window).reshape(-1, 1)

    model = LinearRegression()
    model.fit(X, y)

    future_x = np.array([[window + data.days - 1]])
    prediction = float(model.predict(future_x)[0])
    prediction = max(0.0, prediction)

    return {
        "predictedPrice": round(prediction),
        "days": data.days,
        "model": "LinearRegression",
        "confidence": "prototype"
    }