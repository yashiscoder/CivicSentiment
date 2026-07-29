# 🚀 CivicSentiment

**CivicSentiment** is an end-to-end sentiment analysis project built with Machine Learning and FastAPI. It includes data preprocessing, feature engineering, model training using Logistic Regression, and deployment through an interactive web application that classifies text into Positive, Negative, Neutral, and Irrelevant sentiments in real time.

---
hi
## 📖 Overview

**CivicSentiment** is an end-to-end Machine Learning and Web Application project for real-time sentiment analysis. It predicts whether a given text is **Positive**, **Negative**, **Neutral**, or **Irrelevant** using a trained **Logistic Regression** model.

The project covers the complete ML lifecycle—from data preprocessing and model training in Jupyter Notebook to deployment with FastAPI and an interactive frontend.

---

## ✨ Features

- 🤖 Real-time sentiment prediction
- 📊 Confidence score and probability distribution
- 🧠 Custom-trained Logistic Regression model
- 📝 Analysis history with search & filtering
- 📤 Export analysis history as CSV
- 🌐 REST API using FastAPI
- 🎨 Modern Glassmorphism UI
- ⚡ Lightweight and fast inference

---

# 🧠 Machine Learning Pipeline

The project includes a complete training notebook (**Sentiment_Analysis.ipynb**) covering:

- Data Cleaning
- Text Preprocessing
- Tokenization
- Stopword Removal
- Bag of Words (CountVectorizer)
- N-Gram Feature Engineering (1–4 grams)
- Logistic Regression Training
- Hyperparameter Tuning
- Model Evaluation
- Model Serialization (.pkl)
- Comparison with XGBoost

> **Final deployed model:** Logistic Regression

---

## 🛠 Tech Stack

### Machine Learning
- Python
- Scikit-learn
- Logistic Regression
- CountVectorizer (Bag of Words)
- NLTK
- Pandas
- NumPy
- Matplotlib
- Seaborn

### Backend
- FastAPI
- Uvicorn

### Frontend
- HTML5
- CSS3
- JavaScript
- Tailwind CSS

---

## 📂 Project Structure

```
CivicSentiment
│
├── Sentiment_Analysis.ipynb      # Model training notebook
├── api.py                        # FastAPI backend
├── app.js                        # Frontend logic
├── index.html
├── style.css
├── requirements.txt
├── mmodel_logistic_2.pkl         # Trained Logistic Regression model
├── vectorizer_for_m2.pkl         # CountVectorizer
├── run_api.ps1
├── run_api.bat
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/CivicSentiment.git
cd CivicSentiment
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Start Backend

```bash
python api.py
```

### Start Frontend

```bash
python -m http.server 8000
```

Visit:

```
http://localhost:8000
```

---

## 🚀 REST API

### POST `/api/analyze`

Request

```json
{
  "text": "I love this project!"
}
```

Response

```json
{
  "sentiment": "POSITIVE",
  "confidence": 98.42,
  "probabilities": {
    "Positive": 98.42,
    "Neutral": 1.11,
    "Negative": 0.47,
    "Irrelevant": 0.00
  }
}
```

---

## 📈 Model

**Algorithm:** Logistic Regression

**Feature Extraction:**

- CountVectorizer
- Bag of Words
- N-Grams (1–4)

**Predicted Classes**

- Positive
- Negative
- Neutral
- Irrelevant

---

## 📸 Screenshots

<img width="1920" height="1020" alt="Screenshot 2026-07-29 150332" src="https://github.com/user-attachments/assets/3e747b8d-3baa-414b-a08e-d29e75429119" />
Screenshot 1


<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/52ec5a9c-05bf-40a5-b2ee-e2110861dedb" />
Screenshot 2

---

## 🔮 Future Improvements

- Deep Learning Models (LSTM/BERT)
- Multi-language sentiment analysis
- Docker support
- Cloud deployment
- User authentication
- Batch prediction API

---

## 👨‍💻 Author

**Yash Kumawat**

If you found this project helpful, consider giving it a ⭐ on GitHub.
