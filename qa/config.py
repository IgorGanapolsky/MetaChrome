import os

class Config:
    # Package name of the app under test
    PACKAGE_NAME = os.getenv("QA_PACKAGE_NAME", "com.metachrome")
    
    # ADB Device Serial (optional, defaults to first connected)
    ADB_DEVICE_SERIAL = os.getenv("QA_DEVICE_SERIAL")
    
    # VLM Endpoint (e.g., generic OpenAI-compatible)
    VLM_BASE_URL = os.getenv("QA_VLM_BASE_URL", "https://api.openai.com/v1")
    VLM_API_KEY = os.getenv("QA_VLM_API_KEY")
    VLM_MODEL = os.getenv("QA_VLM_MODEL", "gpt-4-turbo")

    # Artifacts dir for failed test screenshots
    ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
