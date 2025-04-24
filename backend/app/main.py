from fastapi import FastAPI
from app.core.config import setup_cors
from app.api.routes import router

app = FastAPI(title="Uber Fare Prediction API")
setup_cors(app)
app.include_router(router)
