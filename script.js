// Ensure the DOM is fully loaded before executing scripts
document.addEventListener("DOMContentLoaded", function () {
    
    // Establish WebSocket connection
    const socket = io("http://localhost:5000", {
        transports: ["websocket"],
        upgrade: false
    });

    socket.on("connect", () => console.log("✅ WebSocket Connected"));
    socket.on("connect_error", (error) => console.error("❌ WebSocket Error:", error));

    // Variables for user tracking
    let keystrokes = 0, mouseMoves = 0, tabSwitches = 0;
    let userId = `User-${Math.floor(Math.random() * 1000)}`;

    // Select important elements
    const loginPage = document.getElementById("login-page");
    const examPage = document.getElementById("exam-page");
    const resultsPage = document.getElementById("results-page");
    const riskLevelElement = document.getElementById("risk-level");

    const loginButton = document.getElementById("login-button");
    const submitButton = document.getElementById("submit-button");

    // Event listener for login button
    loginButton.addEventListener("click", function () {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (username === "" || password === "") {
            alert("❌ Please enter both username and password.");
        } else {
            console.log("✅ Login Successful:", username);

            // Hide login page, show exam page
            loginPage.style.display = "none";
            examPage.style.display = "block";

            startMonitoring();
            loadQuestions();
        }
    });

    // Function to dynamically load questions
    function loadQuestions() {
        const questions = [
            { question: "What is 2 + 2?", answer: "4" },
            { question: "What is the capital of France?", answer: "Paris" },
            { question: "Who wrote 'Hamlet'?", answer: "Shakespeare" },
            { question: "What is the boiling point of water in Celsius?", answer: "100" },
            { question: "Which planet is known as the Red Planet?", answer: "Mars" }
        ];

        const container = document.getElementById("questions-container");
        container.innerHTML = "";

        questions.forEach((q, index) => {
            container.innerHTML += `
                <p>${q.question}</p>
                <input type="text" id="answer${index}" class="input-field">
            `;
        });
    }

    // Function to start monitoring user behavior
    function startMonitoring() {
        document.addEventListener("keydown", trackKeystrokes);
        document.addEventListener("mousemove", trackMouse);
        document.addEventListener("visibilitychange", trackTabSwitch);
    }

    function trackKeystrokes() {
        keystrokes++;
        sendActivityData("Keypress detected");
    }

    function trackMouse() {
        mouseMoves++;
        sendActivityData("Mouse movement detected");
    }

    function trackTabSwitch() {
        if (document.hidden) {
            tabSwitches++;
            sendActivityData("Tab switch detected");
        }
    }

    // Function to send activity data to WebSocket and ML server
    function sendActivityData(activity) {
        let riskLevel = "Low";
        if (activity.includes("Tab switch")) riskLevel = "High";

        socket.emit("userActivity", { userId, activity, riskLevel });

        // Send data to ML API
        fetch("http://127.0.0.1:5001/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                keystrokes: keystrokes,
                mouse_moves: mouseMoves,
                tab_switches: tabSwitches
            })
        })
        .then(response => response.json())
        .then(data => {
            riskLevelElement.innerText = "Risk Level: " + data.risk_level;
            console.log("📊 ML Prediction:", data.risk_level);
        })
        .catch(error => console.error("❌ Error in ML API:", error));
    }

    // Simulate user activity every 3 seconds
    setInterval(() => {
        socket.emit("userActivity", {
            userId: userId,
            activity: "Tab switch detected",
            riskLevel: "High"
        });
    }, 3000);

    // Handle Exam Submission
    submitButton.addEventListener("click", function () {
        examPage.style.display = "none";
        resultsPage.style.display = "block";

        let score = calculateScore();
        document.getElementById("final-score").innerText = `Your final score is: ${score}/5`;

        stopMonitoring();
        generateCharts();
    });

    // Function to calculate exam score
    function calculateScore() {
        const answers = ["4", "Paris", "Shakespeare", "100", "Mars"];
        let score = 0;

        answers.forEach((correct, index) => {
            const userAnswer = document.getElementById(`answer${index}`).value;
            if (userAnswer.toLowerCase() === correct.toLowerCase()) {
                score++;
            }
        });

        return score;
    }

    // Function to stop monitoring after exam submission
    function stopMonitoring() {
        document.removeEventListener("keydown", trackKeystrokes);
        document.removeEventListener("mousemove", trackMouse);
        document.removeEventListener("visibilitychange", trackTabSwitch);

        console.log("🛑 Monitoring Stopped After Exam Submission.");
    }

    // Generate Charts using Chart.js
    function generateCharts() {
        new Chart(document.getElementById("scoreChart"), {
            type: "bar",
            data: {
                labels: ["User 1", "User 2", "User 3"],
                datasets: [{ label: "Scores", data: [4, 3, 5], backgroundColor: "blue" }]
            }
        });

        new Chart(document.getElementById("riskChart"), {
            type: "line",
            data: {
                labels: ["Start", "Mid", "End"],
                datasets: [{ label: "Risk Level", data: [1, 2, 3], borderColor: "red", fill: false }]
            }
        });

        new Chart(document.getElementById("activityChart"), {
            type: "pie",
            data: {
                labels: ["Keystrokes", "Mouse Movement", "Tab Switch"],
                datasets: [{ data: [keystrokes, mouseMoves, tabSwitches], backgroundColor: ["green", "orange", "red"] }]
            }
        });
    }

});
