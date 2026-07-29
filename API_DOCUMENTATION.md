# 📚 CivicSentiment API Documentation

## Overview

The **CivicSentiment API** is a RESTful API built with **FastAPI** that performs real-time sentiment analysis using a trained **Logistic Regression** machine learning model.

The API classifies text into one of the following categories:

- 😊 Positive
- 😐 Neutral
- ☹️ Negative
- ❓ Irrelevant

Along with the predicted sentiment, the API returns confidence scores, probability distribution, word count, and model information.

---

# Base URL

## Local Development

```
http://127.0.0.1:5000
```

## Production

```
https://your-api.onrender.com
```

---

# Interactive API Documentation

FastAPI automatically generates interactive API documentation.

| Documentation | URL |
|--------------|-----|
| Swagger UI | `/docs` |
| ReDoc | `/redoc` |

Example

```
http://127.0.0.1:5000/docs
```

---

# API Endpoints

---

# 1. Home Endpoint

Returns API information.

## Request

```http
GET /
```

## Response

```json
{
    "message": "Tweet Sentiment Analysis API is running.",
    "docs_url": "/docs",
    "health_url": "/api/health"
}
```

---

# 2. Health Check

Checks whether the API is running and verifies that the trained machine learning model and vectorizer are loaded successfully.

## Request

```http
GET /api/health
```

## Success Response

```json
{
    "status": "healthy",
    "model": "mmodel_logistic_2.pkl",
    "model_type": "LogisticRegression",
    "classes": [
        "Irrelevant",
        "Negative",
        "Neutral",
        "Positive"
    ],
    "n_features": 1428316,
    "custom_vectorizer": true
}
```

### Response Fields

| Field | Description |
|--------|-------------|
| status | API status |
| model | Loaded machine learning model |
| model_type | Type of ML algorithm |
| classes | Supported sentiment classes |
| n_features | Number of model features |
| custom_vectorizer | Indicates whether the custom vectorizer is loaded |

---

# 3. Analyze Sentiment

Predicts the sentiment of input text.

## Request

```http
POST /api/analyze
```

## Headers

```http
Content-Type: application/json
```

## Request Body

```json
{
    "text": "I absolutely love this project!"
}
```

---

## Success Response

```json
{
    "sentiment": "POSITIVE",
    "confidence": 98.42,
    "probabilities": {
        "Irrelevant": 0.02,
        "Negative": 0.31,
        "Neutral": 1.25,
        "Positive": 98.42
    },
    "classes": [
        "Irrelevant",
        "Negative",
        "Neutral",
        "Positive"
    ],
    "word_count": 5,
    "model_name": "mmodel_logistic_2.pkl"
}
```

---

## Response Fields

| Field | Type | Description |
|--------|------|-------------|
| sentiment | String | Predicted sentiment |
| confidence | Float | Highest prediction confidence (%) |
| probabilities | Object | Probability of every sentiment class |
| classes | Array | Available prediction classes |
| word_count | Integer | Number of words in the input |
| model_name | String | Machine learning model used |

---

# Error Responses

## Empty Input

Status Code

```
400 Bad Request
```

Response

```json
{
    "detail": "Text input cannot be empty."
}
```

---

## Internal Server Error

Status Code

```
500 Internal Server Error
```

Response

```json
{
    "detail": "Prediction error: <error message>"
}
```

---

# Supported Sentiments

| Sentiment | Description |
|------------|-------------|
| Positive | Positive opinion or emotion |
| Negative | Negative opinion or emotion |
| Neutral | Neutral statement |
| Irrelevant | Text unrelated to the sentiment categories |

---

# Example Requests

## cURL

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
-H "Content-Type: application/json" \
-d "{\"text\":\"This project is amazing!\"}"
```

---

## Python

```python
import requests

url = "http://127.0.0.1:5000/api/analyze"

payload = {
    "text": "This project is amazing!"
}

response = requests.post(url, json=payload)

print(response.json())
```

---

## JavaScript

```javascript
fetch("http://127.0.0.1:5000/api/analyze", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        text: "This project is amazing!"
    })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

# Machine Learning Model

| Property | Value |
|----------|-------|
| Algorithm | Logistic Regression |
| Feature Extraction | CountVectorizer (Bag of Words) |
| NLP Library | NLTK |
| Deployment | FastAPI |
| Model Format | Pickle (.pkl) |

---

# Technologies Used

- Python
- FastAPI
- Scikit-learn
- Logistic Regression
- CountVectorizer
- NLTK
- SciPy
- HTML
- CSS
- JavaScript
- Tailwind CSS

---

# Project Workflow

```
User Input
      │
      ▼
Text Preprocessing
      │
      ▼
CountVectorizer
      │
      ▼
Logistic Regression Model
      │
      ▼
Prediction
      │
      ▼
JSON Response
      │
      ▼
Frontend Dashboard
```

---

# License

This API is part of the **CivicSentiment** project and is intended for educational and demonstration purposes.
