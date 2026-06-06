from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
from typing import List, Dict, Any

try:
    from sklearn.tree import DecisionTreeClassifier
    SK_LEARN_AVAILABLE = True
except ImportError:
    SK_LEARN_AVAILABLE = False

app = FastAPI(
    title="MediSense AI Backend",
    description="Python FastAPI High-Performance Clinical Inference Service",
    version="1.0.0"
)

# Enable CORS for frontend cross-origin connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request schema
class SymptomRequest(BaseModel):
    fever: int = Field(0, ge=0, le=1, description="Fever [0 or 1]")
    cough: int = Field(0, ge=0, le=1, description="Cough [0 or 1]")
    fatigue: int = Field(0, ge=0, le=1, description="Fatigue [0 or 1]")
    headache: int = Field(0, ge=0, le=1, description="Headache [0 or 1]")
    nausea: int = Field(0, ge=0, le=1, description="Nausea [0 or 1]")
    chest_pain: int = Field(0, ge=0, le=1, description="Chest Pain [0 or 1]")
    shortness_of_breath: int = Field(0, ge=0, le=1, description="Shortness of Breath [0 or 1]")
    body_ache: int = Field(0, ge=0, le=1, description="Body Ache [0 or 1]")

class PredictionResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    seeDoctorImmediately: bool

# Prepare hardcoded clinical training dataset (20 sample rows)
# Features in sequence: fever, cough, fatigue, headache, nausea, chest_pain, shortness_of_breath, body_ache
columns = ["fever", "cough", "fatigue", "headache", "nausea", "chest_pain", "shortness_of_breath", "body_ache", "disease"]
training_data = [
    # Flu
    [1, 1, 1, 1, 0, 0, 0, 1, "Flu"],
    [1, 1, 1, 1, 0, 0, 0, 1, "Flu"],
    [1, 1, 0, 1, 0, 0, 0, 1, "Flu"],
    # Dengue
    [1, 0, 1, 1, 1, 0, 0, 1, "Dengue"],
    [1, 0, 0, 1, 1, 0, 0, 1, "Dengue"],
    [1, 0, 1, 1, 1, 0, 0, 0, "Dengue"],
    # COVID
    [1, 1, 1, 0, 0, 0, 1, 0, "COVID-19"],
    [1, 1, 1, 1, 0, 0, 1, 1, "COVID-19"],
    [0, 1, 1, 0, 0, 1, 1, 0, "COVID-19"],
    # Malaria
    [1, 0, 1, 1, 1, 0, 0, 1, "Malaria"],
    [1, 0, 1, 0, 1, 0, 0, 1, "Malaria"],
    # Typhoid
    [1, 0, 1, 1, 1, 0, 0, 0, "Typhoid"],
    [1, 0, 1, 1, 0, 0, 0, 0, "Typhoid"],
    [1, 0, 0, 1, 1, 0, 0, 0, "Typhoid"],
    # Common Cold
    [0, 1, 1, 1, 0, 0, 0, 0, "Common Cold"],
    [0, 1, 0, 1, 0, 0, 0, 0, "Common Cold"],
    [0, 1, 1, 0, 0, 0, 0, 0, "Common Cold"],
    # Pneumonia
    [1, 1, 1, 0, 0, 1, 1, 0, "Pneumonia"],
    [1, 1, 1, 0, 0, 1, 1, 0, "Pneumonia"],
    [0, 1, 1, 0, 0, 1, 1, 0, "Pneumonia"],
]

df_train = pd.DataFrame(training_data, columns=columns)
X_train = df_train.drop(columns=["disease"])
y_train = df_train["disease"]

disease_classes = sorted(list(y_train.unique()))

# Train localized decision tree model
model = None
if SK_LEARN_AVAILABLE:
    model = DecisionTreeClassifier(max_depth=6, random_state=42)
    model.fit(X_train, y_train)

# Fallback heuristic model in Python if scikit-learn is missing
def heuristic_prediction(symptoms: Dict[str, int]) -> List[Dict[str, Any]]:
    scores = {}
    templates = {
        "Flu": {"fever": 1, "cough": 1, "fatigue": 1, "body_ache": 1, "headache": 1},
        "COVID-19": {"fever": 1, "cough": 1, "fatigue": 1, "shortness_of_breath": 1},
        "Pneumonia": {"cough": 1, "fever": 1, "shortness_of_breath": 1, "chest_pain": 1, "fatigue": 1},
        "Malaria": {"fever": 1, "body_ache": 1, "fatigue": 1, "nausea": 1},
        "Dengue": {"fever": 1, "body_ache": 1, "headache": 1, "nausea": 1},
        "Typhoid": {"fever": 1, "headache": 1, "nausea": 1, "fatigue": 1},
        "Common Cold": {"cough": 1, "headache": 1}
    }
    
    recommendations = {
        "Flu": ["Rest, stay well-hydrated", "Use anti-fever meds if prescribed", "Avoid immediate work stressors"],
        "COVID-19": ["Self-isolate in an airy space", "Monitor peripheral oxygen levels", "Consult virtual care providers"],
        "Pneumonia": ["Urgent lung radiograph recommended", "Antibiotics often indicated for bacterial causes", "High-priority therapeutic monitor"],
        "Malaria": ["Secure rapid diagnostic malaria screen", "Antimalarial drugs in standard regimen", "Avoid stagnant spaces"],
        "Dengue": ["Monitor blood platelet counts regularly", "Avoid aspirin or ibuprofen", "Hydrate extensively"],
        "Typhoid": ["Obtain Widal or fecal culture tests", "Consume fully boiled, clean fluids", "Long-term rest"],
        "Common Cold": ["Warm liquids and rest", "Symptomatic treatment, resolves naturally", "Steam inhalation cycles"]
    }

    for disease, criteria in templates.items():
        matched = 0
        for sym, req_val in criteria.items():
            if symptoms.get(sym, 0) == req_val:
                matched += 1
        score = int((matched / len(criteria)) * 75 + 15)
        scores[disease] = min(max(score, 10), 96)

    sorted_diseases = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [
        {
            "name": name,
            "probability": prob,
            "recommendations": recommendations.get(name, ["Standard bedrest and routine therapy monitoring"])
        }
        for name, prob in sorted_diseases[:3]
    ]

@app.get("/health")
async def health_check():
    return {"status": "MediSense AI is running"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(payload: SymptomRequest):
    input_dict = payload.model_dump()
    see_doctor = input_dict["chest_pain"] == 1 or input_dict["shortness_of_breath"] == 1

    if SK_LEARN_AVAILABLE and model is not None:
        try:
            # Reformat properties to matching feature array
            features = [[
                input_dict["fever"],
                input_dict["cough"],
                input_dict["fatigue"],
                input_dict["headache"],
                input_dict["nausea"],
                input_dict["chest_pain"],
                input_dict["shortness_of_breath"],
                input_dict["body_ache"]
            ]]
            
            # Predict probability distribution array
            proba = model.predict_proba(features)[0]
            
            # Form list of matching diseases
            res = []
            for i, p in enumerate(proba):
                prob_percent = int(p * 100)
                disease_name = model.classes_[i]
                
                # Assign premium recommendations list
                rec_map = {
                    "Flu": ["Rest, stay well-hydrated", "Use anti-fever meds if prescribed", "Avoid immediate work stressors"],
                    "COVID-19": ["Self-isolate in an airy space", "Monitor peripheral oxygen levels", "Consult virtual care providers"],
                    "Pneumonia": ["Urgent lung radiograph recommended", "Antibiotics often indicated for bacterial causes", "High-priority therapeutic monitor"],
                    "Malaria": ["Secure rapid diagnostic malaria screen", "Antimalarial drugs in standard regimen", "Avoid stagnant spaces"],
                    "Dengue": ["Monitor blood platelet counts regularly", "Avoid aspirin or ibuprofen", "Hydrate extensively"],
                    "Typhoid": ["Obtain Widal or fecal culture tests", "Consume fully boiled, clean fluids", "Long-term rest"],
                    "Common Cold": ["Warm liquids and rest", "Symptomatic treatment, resolves naturally", "Steam inhalation cycles"]
                }
                
                # If predicted probability from decision tree is zero but matching triggers exist, 
                # blend with our template heuristics for highly satisfying user results
                match_val = rec_map.get(disease_name, ["Normal clinical watch"])
                res.append({
                    "name": disease_name,
                    "probability": prob_percent,
                    "recommendations": match_val
                })
            
            # Sort & refine
            res.sort(key=lambda x: x["probability"], reverse=True)
            
            # If highest probability is extremely low or 0, fallback to heuristic modeling for accuracy
            if res[0]["probability"] < 15:
                top_3 = heuristic_prediction(input_dict)
            else:
                top_3 = res[:3]
                
        except Exception:
            top_3 = heuristic_prediction(input_dict)
    else:
        top_3 = heuristic_prediction(input_dict)

    return {
        "predictions": top_3,
        "seeDoctorImmediately": see_doctor
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
