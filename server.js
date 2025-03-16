const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const axios = require("axios"); // ✅ Import axios for ML API requests

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());  
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

let userActivity = {}; // Store activity logs

io.on("connection", (socket) => {
    console.log(`🟢 User Connected: ${socket.id}`);

    socket.on("userActivity", async (data) => {
        const { userId, activity, riskLevel } = data;

        if (!userActivity[userId]) {
            userActivity[userId] = [];
        }
        userActivity[userId].push({ time: new Date().toLocaleTimeString(), activity, riskLevel });

        console.log(`📡 Activity from ${userId}: ${activity} - Risk: ${riskLevel}`);

        // ✅ ML Risk Prediction
        try {
            const mlResponse = await axios.post("http://127.0.0.1:5001/predict", {
                keystrokes: userActivity[userId].filter(log => log.activity.includes("Keypress")).length,
                mouse_moves: userActivity[userId].filter(log => log.activity.includes("Mouse movement")).length,
                tab_switches: userActivity[userId].filter(log => log.activity.includes("Tab switch")).length,
            });

            const mlRiskLevel = mlResponse.data.risk_level;
            console.log(`🤖 ML Risk Prediction for ${userId}: ${mlRiskLevel}`);

            // Update Risk Level Based on ML Response
            io.emit("riskAlert", { userId, message: `⚠️ ML Risk Level: ${mlRiskLevel}` });
        } catch (error) {
            console.error("❌ ML API Error:", error.message);
        }

        if (activity.includes("Tab switch") || activity.includes("Excessive Mouse Movement")) {
            io.emit("riskAlert", { userId, message: `⚠️ High-Risk Activity: ${activity}` });
        }
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});

// ✅ Serve Admin Dashboard
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ✅ Send Activity Log Data to Dashboard
app.get("/activity-log", (req, res) => {
    res.json(userActivity);
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
