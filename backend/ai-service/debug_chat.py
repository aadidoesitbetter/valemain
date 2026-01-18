import google.generativeai as genai
import os
from dotenv import load_dotenv
import traceback

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
model_name = os.getenv("CORE_VALEMAIN_MODEL", "gemini-2.5-flash")

print(f"Testing model: {model_name}")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello")
    print("Success!")
    print(response.text)
except Exception:
    traceback.print_exc()
