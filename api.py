import os
import sys
import pickle

# Enable Python safe path mode & remove CWD from sys.path for NLTK Python 3.14 security checks
os.environ["PYTHONSAFEPATH"] = "1"
_cwd = os.path.abspath(os.getcwd())
sys.path = [p for p in sys.path if p and os.path.abspath(p) != _cwd and p not in ('', '.')]

import nltk
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import scipy.sparse as sp
from sklearn.feature_extraction.text import HashingVectorizer

# Download required NLTK tokenizers if not present
for res in ["punkt_tab", "punkt", "stopwords"]:
    try:
        nltk.download(res, quiet=True)
    except Exception as e:
        print(f"Warning downloading NLTK resource {res}: {e}")

# Initialize FastAPI App
app = FastAPI(
    title="Tweet Sentiment Analysis API",
    description="REST API for custom machine learning sentiment analysis model (my_output.pkl)",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and vectorizer
MODEL = None
VECTORIZER = None
MODEL_CLASSES = []
N_FEATURES = 1428316
MODEL_FILE = "mmodel_logistic_2.pkl"
VECTORIZER_FILE = "vectorizer_for_m2.pkl"


def load_model_and_vectorizer():
    global MODEL, VECTORIZER, MODEL_CLASSES, N_FEATURES
    
    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(f"Model pickle file '{MODEL_FILE}' not found in current directory.")
    
    print(f"Loading model from '{MODEL_FILE}'...")
    with open(MODEL_FILE, "rb") as f:
        MODEL = pickle.load(f)
    
    if hasattr(MODEL, "classes_"):
        MODEL_CLASSES = list(MODEL.classes_)
    else:
        MODEL_CLASSES = ["Irrelevant", "Negative", "Neutral", "Positive"]
        
    if hasattr(MODEL, "n_features_in_"):
        N_FEATURES = MODEL.n_features_in_
        
    print(f"Model loaded successfully. Classes: {MODEL_CLASSES}, Features: {N_FEATURES}")

    # Strict loading of custom vectorizer pickle file (No HashingVectorizer fallback)
    if not os.path.exists(VECTORIZER_FILE):
        raise FileNotFoundError(f"Vectorizer pickle file '{VECTORIZER_FILE}' not found in current directory.")

    print(f"Loading custom vectorizer from '{VECTORIZER_FILE}'...")
    with open(VECTORIZER_FILE, "rb") as f:
        VECTORIZER = pickle.load(f)
    print("Custom vectorizer loaded successfully.")


@app.on_event("startup")
def startup_event():
    load_model_and_vectorizer()


# Request / Response Schemas
class TextPayload(BaseModel):
    text: str

class AnalysisResponse(BaseModel):
    sentiment: str
    confidence: float
    probabilities: dict
    classes: list
    word_count: int
    model_name: str


@app.get("/")
def root():
    return {
        "message": "Tweet Sentiment Analysis API is running.",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model": MODEL_FILE,
        "model_type": type(MODEL).__name__ if MODEL else "Not Loaded",
        "classes": MODEL_CLASSES,
        "n_features": N_FEATURES,
        "custom_vectorizer": os.path.exists(VECTORIZER_FILE)
    }


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_sentiment(payload: TextPayload):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty.")
    
    text = payload.text.strip()
    words = text.split()
    word_count = len(words)
    
    try:
        # Transform text into sparse feature vector
        X_feat = VECTORIZER.transform([text.lower()])
        
        # Ensure feature dimension matches model expectation
        if X_feat.shape[1] != N_FEATURES:
            X_feat = sp.csr_matrix((X_feat.data, X_feat.indices, X_feat.indptr), shape=(1, N_FEATURES))
        
        # Predict class probabilities
        if hasattr(MODEL, "predict_proba"):
            probs = MODEL.predict_proba(X_feat)[0]
        else:
            pred_class = MODEL.predict(X_feat)[0]
            probs = [1.0 if c == pred_class else 0.0 for c in MODEL_CLASSES]

        # Map classes to probabilities
        prob_dict = {str(c): float(round(p * 100, 2)) for c, p in zip(MODEL_CLASSES, probs)}
        
        # Top predicted class
        max_idx = int(probs.argmax())
        top_sentiment = str(MODEL_CLASSES[max_idx]).upper()
        confidence = float(round(probs[max_idx] * 100, 2))
        
        return AnalysisResponse(
            sentiment=top_sentiment,
            confidence=confidence,
            probabilities=prob_dict,
            classes=[str(c) for c in MODEL_CLASSES],
            word_count=word_count,
            model_name=MODEL_FILE
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=5000, reload=True)
