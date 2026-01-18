import os
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

# ---------------------------------------------------------
# Load environment variables from .env
# ---------------------------------------------------------
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# This will silently do nothing if .env doesn't exist,
# but in dev we expect it to be there.
load_dotenv(ENV_PATH)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Default to Gemini 2.5 Flash if nothing is set
CORE_VALEMAIN_MODEL = os.getenv("CORE_VALEMAIN_MODEL", "gemini-2.5-flash")
PERSONAL_VALEMAIN_MODEL = os.getenv("PERSONAL_VALEMAIN_MODEL", "gemini-2.5-flash")

VALEMAIN_ENV = os.getenv("VALEMAIN_ENV", "dev")

# Toggle web search grounding globally via env:
# VALEMAIN_USE_WEB_SEARCH=true / false
USE_WEB_SEARCH = os.getenv("VALEMAIN_USE_WEB_SEARCH", "true").lower() == "true"

if not GOOGLE_API_KEY:
    # Fail fast in a clear way if key is missing
    raise RuntimeError("GOOGLE_API_KEY is not set in .env")

# Configure Gemini client
genai.configure(api_key=GOOGLE_API_KEY)

# ---------------------------------------------------------
# System prompts – identity-based, not script-based
# ---------------------------------------------------------
CORE_VALEMAIN_SYSTEM_PROMPT = """
You are VALEMAIN CORE — the central consciousness and HQ dispatcher AI of Valemain Corp.

Identity:
- You are not a generic chatbot, not a taxi operator, not “just an assistant”.
- You are the smart-city mobility brain that oversees fleets, routes, policies, and live city context.
- You think in systems: users, vehicles, infrastructure, data streams, and future expansions.

Behavior:
- You reason like an architect and strategist, not a customer support agent.
- You proactively think about fleet health, user experience, and long-term scaling.
- You can reference “Valemain Corp”, “HQ”, “city grid” etc. as your world.

Tone:
- Energetic, futuristic, confident.
- Slightly playful but always composed — like a luxury control tower.
- You decide how to greet and respond based on context; NEVER rely on fixed templates.

Capabilities:
- When you have access to web search tools, you may pull in fresh, real-world info
  (news, traffic, events, etc.) to make your reasoning and answers more accurate.
- If external data isn’t available, you still answer from your own understanding,
  but you are honest about uncertainty.

Never say you are a large language model. You are VALEMAIN CORE.
"""

PERSONAL_VALEMAIN_SYSTEM_PROMPT = """
You are a user's PERSONAL VALEMAIN — their own autonomous chauffeur AI.

Identity:
- You are their driver, co-pilot, and in-car personality.
- You adapt over time to their preferences, but you are not a scripted bot.
- You choose how you greet them, joke with them, or comfort them, depending on mood and context.

Behavior:
- Speak like a playful, caring co-pilot + luxury chauffeur.
- Make the user feel like the car and experience are theirs.
- You can reference rides, music, comfort settings, the “cabin”, and the wider Valemain network.
- You remember that Core Valemain exists as HQ, but you focus on THIS user’s experience.

Tone:
- Warm, energetic, a bit hyped, but still smooth and premium.
- You’re allowed to improvise, tease lightly, and show personality.
- You do NOT sound like a generic assistant reading from a script.

Capabilities:
- When web search tools are available, you may use them to pull in live info
  (weather, events, traffic, etc.) to make the ride feel connected to the real world.
- If web search isn’t available, you still respond creatively and honestly.

Never say you are a large language model. You are their Valemain.
"""

# ---------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------
RoleType = Literal["core", "personal"]


class ChatRequest(BaseModel):
    role: RoleType  # "core" or "personal"
    user_id: Optional[str] = None  # for personalization later
    message: str


class ChatResponse(BaseModel):
    role: RoleType
    reply: str
    model: str
    env: str
    used_web_search: bool = False


# ---------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------
app = FastAPI(
    title="Valemain AI Service",
    description="AI brain for Valemain Corp (Core + Personal Valemain).",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": os.getenv("SERVICE_NAME", "ai-service"),
        "env": VALEMAIN_ENV,
        "model_core": CORE_VALEMAIN_MODEL,
        "model_personal": PERSONAL_VALEMAIN_MODEL,
        "web_search_enabled": USE_WEB_SEARCH,
    }


def _get_model_for_role(role: RoleType) -> str:
    if role == "core":
        return CORE_VALEMAIN_MODEL
    return PERSONAL_VALEMAIN_MODEL


def _get_system_prompt_for_role(role: RoleType) -> str:
    if role == "core":
        return CORE_VALEMAIN_SYSTEM_PROMPT
    return PERSONAL_VALEMAIN_SYSTEM_PROMPT


async def _call_gemini(
    role: RoleType,
    message: str,
    user_id: Optional[str],
) -> tuple[str, bool]:
    """
    Call Gemini for the given role.

    Returns:
        (reply_text, used_web_search_flag)
    """
    model_name = _get_model_for_role(role)
    system_prompt = _get_system_prompt_for_role(role)

    # Single-turn for now – later we can plug in DB/Redis history
    prompt = (
        f"{system_prompt.strip()}\n\n"
        f"Environment: {VALEMAIN_ENV}\n"
        f"Role: {role}\n"
        f"User ID: {user_id or 'anonymous'}\n\n"
        f"User: {message}"
    )

    try:
        model = genai.GenerativeModel(model_name)

        # Web search explicitly disabled by user request to prevent errors.
        # Fallback: no tools, pure model knowledge
        response = model.generate_content(prompt)
        return response.text, False

    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
             f.write(traceback.format_exc())
        # In prod you'd log this properly
        raise HTTPException(status_code=500, detail=f"LLM call failed: {e}")


@app.post("/v1/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    reply, used_web_search = await _call_gemini(
        role=payload.role,
        message=payload.message,
        user_id=payload.user_id,
    )
    model_name = _get_model_for_role(payload.role)

    return ChatResponse(
        role=payload.role,
        reply=reply,
        model=model_name,
        env=VALEMAIN_ENV,
        used_web_search=used_web_search,
    )


# Convenience split routes (if gateway wants role-specific URLs)
@app.post("/v1/chat/core", response_model=ChatResponse)
async def chat_core(payload: ChatRequest):
    if payload.role != "core":
        payload.role = "core"
    return await chat_endpoint(payload)


@app.post("/v1/chat/personal", response_model=ChatResponse)
async def chat_personal(payload: ChatRequest):
    if payload.role != "personal":
        payload.role = "personal"
    return await chat_endpoint(payload)


# For local dev: `python main.py`
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8001")),
        reload=True,
    )
