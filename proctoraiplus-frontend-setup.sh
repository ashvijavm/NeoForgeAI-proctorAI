# Step 1: Create the project folder structure
mkdir -p ProctorAI/frontend
mkdir -p ProctorAI/backend

# Step 2: Navigate to the frontend directory
cd ProctorAI/frontend

# Step 3: Initialize a new React application with TypeScript
npx create-react-app . --template typescript

# Step 4: Install necessary dependencies
npm install electron electron-builder concurrently wait-on cross-env
npm install @material-ui/core @material-ui/icons @material-ui/lab
npm install redux react-redux @reduxjs/toolkit
npm install react-router-dom axios socket.io-client
npm install chart.js react-chartjs-2 
npm install @tensorflow/tfjs

# Step 5: Install Tailwind CSS and its dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Step 6: Configure Tailwind CSS
# Create a tailwind.config.js file in the frontend directory
