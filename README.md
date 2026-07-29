# 🚀 CivicSentiment

CivicSentiment is a machine learning-powered web application that performs real-time sentiment analysis on text. It uses a trained Logistic Regression model to classify user input into **Positive**, **Negative**, **Neutral**, or **Irrelevant** sentiments while displaying prediction confidence and probability distribution through an interactive dashboard.

---

## 📌 Features

- 🔍 Real-time sentiment prediction
- 🤖 Custom-trained Logistic Regression model
- 📊 Confidence score and probability visualization
- 📈 Positive, Neutral, Negative & Irrelevant classification
- 📝 Analysis history with search and filtering
- 📂 Export history as CSV
- 🌐 REST API built with FastAPI
- 🎨 Modern Glassmorphism UI
- ⚡ Fast and lightweight inference

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- Uvicorn

### Machine Learning
- Scikit-learn
- Logistic Regression
- Custom Text Vectorizer
- NLTK
- SciPy

---

## 📂 Project Structure

```
CivicSentiment/
│── api.py
│── index.html
│── style.css
│── app.js
│── requirements.txt
│── mmodel_logistic_2.pkl
│── vectorizer_for_m2.pkl
│── run_api.ps1
│── run_api.bat
│── README.md
```

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/CivicSentiment.git
cd CivicSentiment
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start Backend

Windows PowerShell

```powershell
.\run_api.ps1
```

or

```bash
python api.py
```

### 4. Start Frontend

```bash
python -m http.server 8000
```

Open your browser and visit:

```
http://localhost:8000
```

---

## 🚀 API Endpoint

### Analyze Sentiment

**POST**

```
/api/analyze
```

Request

```json
{
    "text": "I absolutely love this project!"
}
```

Response

```json
{
    "sentiment": "POSITIVE",
    "confidence": 98.42,
    "probabilities": {
        "Positive": 98.42,
        "Neutral": 1.13,
        "Negative": 0.45,
        "Irrelevant": 0.00
    }
}
```

---

## 📊 Model Information

- Algorithm: Logistic Regression
- Text Vectorization: Custom Vectorizer
- NLP Library: NLTK
- Output Classes:
  - Positive
  - Negative
  - Neutral
  - Irrelevant

---

## ✨ Highlights

- Responsive and modern UI
- Fast API response
- Interactive dashboard
- Confidence visualization
- Searchable sentiment history
- CSV export support
- Easy deployment and integration

---

## 📸 Preview

Add screenshots of your application here.

```
assets/dashboard.png
assets/result.png
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Yash Kumawat**

If you like this project, consider giving it a ⭐ on GitHub.
