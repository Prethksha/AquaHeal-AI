import os
from dotenv import load_dotenv

load_dotenv()

TICK_SECONDS = float(os.getenv("TICK_SECONDS", "2"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
SEED_DEMO_FAULT = os.getenv("SEED_DEMO_FAULT", "true").lower() == "true"
