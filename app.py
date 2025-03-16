from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
import sqlite3
from datetime import datetime
from web3 import Web3
import json
import threading
import logging
import random

app = Flask(__name__)
app.config['THRESHOLDS'] = {'low': 0.33, 'medium': 0.66}  # Configurable thresholds

# Setup logging
logging.basicConfig(level=logging.INFO, filename='proctorai.log')
logger = logging.getLogger(__name__)

# Load trained model
model = tf.keras.models.load_model('proctorai_model.h5')

# Blockchain setup
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = "0xYourContractAddress"  # Replace with deployed contract address
with open('contract_abi.json') as f:
    contract_abi = json.load(f)
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# In-memory mock database (simulating scalable storage)
db_lock = threading.Lock()
high_risk_logs = []

# Questions for randomization
questions = ["What is 2 + 2?", "What is the capital of France?", "Solve: 5x = 10"]

@app.route('/analyze', methods=['POST'])
def analyze_behavior():
    try:
        data = request.get_json()
        mouse_data = data['mouseData']
        key_data = data['keyData']
        tab_switches = data['tabSwitches']
        screen_refreshes = data.get('screenRefreshes', 0)
        student_id = data['studentId']
        inactivity = data.get('inactivity', 0)

        # Feature extraction
        time_steps = min(50, len(mouse_data))
        mouse_speed = [np.sqrt((m2['x'] - m1['x'])**2 + (m2['y'] - m1['y'])**2) / (m2['time'] - m1['time'])
                       for m1, m2 in zip(mouse_data[:-1], mouse_data[1:]) if m2['time'] - m1['time'] > 0]
        key_intervals = [k2['time'] - k1['time'] for k1, k2 in zip(key_data[:-1], key_data[1:])]
        typing_speed = len(key_data) / (max(k['time'] for k in key_data) - min(k['time'] for k in key_data) if key_data else 1)
        pauses = sum(1 for i in key_intervals if i > 500) / len(key_intervals) if key_intervals else 0
        aggressive_typing = sum(1 for i in key_intervals if i < 50) / len(key_intervals) if key_intervals else 0
        stress_level = np.std(key_intervals) if key_intervals else 0
        paste_attempts = 1 if 'pasteAttempt' in data and data['pasteAttempt'] else 0

        # Pad time-series data
        ts_data = np.zeros((50, 5))
        for i in range(min(time_steps, len(mouse_speed))):
            ts_data[i] = [typing_speed, key_intervals[i] if i < len(key_intervals) else 0, 
                          pauses, aggressive_typing, mouse_speed[i]]

        # Static features with inactivity
        static_data = np.array([stress_level, tab_switches, screen_refreshes, paste_attempts + inactivity]).reshape(1, -1)
        ts_data = ts_data.reshape(1, 50, 5)

        # Predict risk score
        risk_score = model.predict([ts_data, static_data])[0][0]
        thresholds = app.config['THRESHOLDS']
        risk_level = "low" if risk_score <= thresholds['low'] else "medium" if risk_score <= thresholds['medium'] else "high"
        intervention = "Alert & Randomize Questions" if risk_level in ["medium", "high"] else "None"
        screen_recording = risk_level == "high"
        new_question = random.choice(questions) if risk_level in ["medium", "high"] else None

        # Store high-risk data (thread-safe)
        if risk_level == "high":
            timestamp = datetime.now().isoformat()
            with db_lock:
                high_risk_logs.append({"student_id": student_id, "timestamp": timestamp, "risk_percentage": float(risk_score)})
            logger.info(f"High risk logged for {student_id}: {risk_score}")

        # Blockchain logging
        log_data = {"risk_score": float(risk_score), "risk_level": risk_level, "student_id": student_id}
        tx_hash = contract.functions.logExamData(json.dumps(log_data)).transact({'from': w3.eth.accounts[0]})
        w3.eth.wait_for_transaction_receipt(tx_hash)

        response = {
            "riskScore": risk_level,
            "riskPercentage": float(risk_score),
            "intervention": intervention,
            "screenRecording": screen_recording
        }
        if new_question:
            response["newQuestion"] = new_question

        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in /analyze: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, threaded=True)  # Threaded for multi-user simulation