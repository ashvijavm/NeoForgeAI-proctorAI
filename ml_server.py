from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    print("Received Data:", data)
    
    # Dummy risk level logic
    risk_level = "Low"
    if data["tab_switches"] > 3:
        risk_level = "High"

    return jsonify({"risk_level": risk_level})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
