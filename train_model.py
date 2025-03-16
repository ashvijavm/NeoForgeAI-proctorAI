import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Sample dataset (create cheating_data.csv manually or use this inline data)
data = {
    "keystrokes": [100, 120, 150, 80, 200, 300, 50, 30, 180],
    "mouse_moves": [500, 600, 700, 450, 800, 1000, 300, 200, 750],
    "tab_switches": [0, 1, 2, 0, 3, 5, 0, 1, 4],
    "cheating_detected": [0, 0, 1, 0, 1, 1, 0, 0, 1]  # 0 = Normal, 1 = Cheating
}

df = pd.DataFrame(data)

# Split data
X = df[["keystrokes", "mouse_moves", "tab_switches"]]
y = df["cheating_detected"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save trained model
joblib.dump(model, "cheating_model.pkl")

print("✅ Model trained and saved as cheating_model.pkl")
