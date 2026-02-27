# Crypto Project

## Overview
This is a Flask-based cryptocurrency dashboard application. It includes features for market data, news analysis, sentiment analysis, and a chatbot.

## Prerequisites
- Python 3.8 or higher

## Setup Instructions

1. **Navigate to the project directory**
   Open your terminal/command prompt and navigate to the project folder.

2. **Navigate to the backend**
   The core application logic lives in the `backend` folder.
   ```bash
   cd backend
   ```

3. **Install Dependencies**
   Run the following command to install the required Python libraries:
   ```bash
   pip install flask requests textblob
   ```
   
   *Note: If you encounter issues with textblob, you might need to run: `python -m textblob.download_corpora`*

4. **Run the Application**
   Start the Flask server:
   ```bash
   python app.py
   ```

5. **Access the Application**
   Once the server is running, open your web browser and go to:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)

## Project Structure
- `backend/`: contains the Flask app and Python logic.
- `frontend/`: contains HTML templates and static files (CSS, JS).
