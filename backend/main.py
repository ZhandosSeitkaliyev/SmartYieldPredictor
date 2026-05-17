from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import google.generativeai as genai
import PIL.Image
import io
import os
from dotenv import load_dotenv

# Загружаем переменные из .env файла
load_dotenv()

# Инициализация FastAPI
app = FastAPI(title="Yield Forecasting API")

# Настройка CORS для связи с React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === НАСТРОЙКА GEMINI API ===
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in .env file!")
genai.configure(api_key=api_key)
# Берем самую быструю и бесплатную модель
llm_model = genai.GenerativeModel('gemini-flash-latest')

# === ЗАГРУЗКА АРТЕФАКТОВ ML ===
print("Loading ML models from /models directory...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

try:
    rf_model = joblib.load(os.path.join(MODELS_DIR, 'rf_model.pkl'))
    label_encoders = joblib.load(os.path.join(MODELS_DIR, 'label_encoders.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    print("Models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")

# Схема входных данных от фронтенда
class CropData(BaseModel):
    Region: str
    Soil_Type: str
    Crop: str
    Rainfall_mm: float
    Temperature_Celsius: float
    Fertilizer_Used: bool
    Irrigation_Used: bool
    Weather_Condition: str
    Days_to_Harvest: int

@app.post("/predict")
def predict_yield(data: CropData):
    try:
        input_data = pd.DataFrame([data.model_dump()])
        
        # Энкодинг категориальных фичей
        for col, le in label_encoders.items():
            if col in input_data.columns:
                if input_data[col][0] not in le.classes_:
                    raise HTTPException(status_code=400, detail=f"Unknown category in {col}: {input_data[col][0]}")
                input_data[col] = le.transform(input_data[col])
                
        # Нормализация
        input_scaled = scaler.transform(input_data)
        
        # Предикт
        prediction = rf_model.predict(input_scaled)[0]
        return {"predicted_yield_tons_per_ha": round(prediction, 2)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/advice")
def get_agronomic_advice(data: CropData, predicted_yield: float):
    prompt = f"""
    You are an expert agronomist. 
    A farmer is growing {data.Crop} in a {data.Region} region with {data.Soil_Type} soil.
    The current conditions are:
    - Temperature: {data.Temperature_Celsius}°C
    - Rainfall: {data.Rainfall_mm} mm
    - Fertilizer Used: {data.Fertilizer_Used}
    - Irrigation Used: {data.Irrigation_Used}
    
    The Machine Learning model predicted a yield of {predicted_yield} tons per hectare.
    
    Provide 3 short, practical, and highly specific recommendations to either maintain or improve this yield. 
    If the temperature is above 32°C, make sure to mention heat stress management.
    Respond in Russian, formatting the response as clean HTML or Markdown lists for the frontend.
    """
    
    try:
        # Дергаем Gemini API
        response = llm_model.generate_content(prompt)
        return {"advice": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@app.post("/analyze-photo")
async def analyze_photo(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением (JPG, PNG, WEBP)")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Размер файла не должен превышать 10 МБ")

    try:
        image = PIL.Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Не удалось прочитать изображение. Убедитесь, что файл не повреждён.")

    prompt = """
    Ты — опытный агроном с многолетней практикой в полевой диагностике сельскохозяйственных культур.
    На изображении показано сельскохозяйственное поле или посевы.

    Проведи профессиональный визуальный анализ и структурируй ответ следующим образом:

    <h4>Общая оценка</h4>
    Опиши, что видно на снимке: предполагаемая культура, стадия вегетации, плотность стояния, общий вид посевов.

    <h4>Выявленные проблемы</h4>
    <ul>
      Перечисли видимые признаки неблагополучия: пожелтение, хлороз, некроз, полегание, изреженность,
      признаки болезней (пятнистости, налёты, гнили), следы вредителей, дефицит элементов питания,
      переувлажнение, засуха. Если явных проблем нет — укажи это.
    </ul>

    <h4>Рекомендации агронома</h4>
    <ul>
      Дай 3–4 конкретных практических рекомендации по улучшению состояния посевов или сохранению урожая
      на основе увиденного. Если фото нечёткое или культура не определяется — скажи об этом и дай
      общие рекомендации по мониторингу поля.
    </ul>

    Отвечай строго на русском языке. Будь конкретным и профессиональным. Не используй вводные фразы
    вроде "На изображении я вижу..." — сразу переходи к сути.
    """

    try:
        response = llm_model.generate_content([prompt, image])
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini Vision Error: {str(e)}")


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running with Gemini AI. API docs at /docs"}

@app.get("/test-models")
def list_available_models():
    try:
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        return {"models_you_can_use": available_models}
    except Exception as e:
        return {"error": str(e)}