from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.openai import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class ChromeCommandRequest(BaseModel):
    command: str

class ChromeCommandResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_command: str
    action: str
    target_tab: Optional[str] = None
    response_text: str
    status: str = "success"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Chrome control system prompt
CHROME_SYSTEM_PROMPT = """You are a Chrome browser controller for Meta Ray-Ban smart glasses. You interpret voice commands and execute browser actions.

Available tabs the user has open:
- Claude Code (claude.ai) - AI coding assistant with conversation history
- Cursor Assistant (cursor.com) - Code editor AI assistant  
- GitHub (github.com) - Code repository
- ChatGPT (chat.openai.com) - OpenAI chat interface
- Google Search (google.com) - Search engine

Your job is to interpret the voice command and respond with:
1. The action being performed
2. Which tab is affected (if any)
3. A brief confirmation message that would be spoken back through the glasses

Respond in JSON format:
{
    "action": "brief action name like 'switch_tab', 'read_response', 'send_message', 'scroll', 'close_tab', 'new_tab'",
    "target_tab": "tab name or null",
    "response_text": "what to say back to user through glasses (keep it brief and natural)"
}

Examples:
- "Open Claude Code tab" → switch to Claude Code, "Switched to Claude Code"
- "Read the last response" → read content from active tab, "Here's Claude's last message: [simulated content]"
- "Reply go ahead and proceed" → send message in active chat, "Sent: go ahead and proceed"
- "Switch to GitHub" → switch tab, "Now on GitHub"
- "Close this tab" → close current tab, "Tab closed"
- "What tabs do I have open" → list tabs, "You have 5 tabs: Claude Code, Cursor, GitHub, ChatGPT, and Google"

Keep responses concise - they'll be spoken through smart glasses."""

async def process_chrome_command(command: str) -> dict:
    """Process a Chrome browser command using LLM"""
    
    if not EMERGENT_LLM_KEY:
        return {
            "action": "error",
            "target_tab": None,
            "response_text": "AI not configured. Please set up the API key."
        }
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chrome-{uuid.uuid4()}",
            system_message=CHROME_SYSTEM_PROMPT
        )
        
        msg = UserMessage(text=f"Voice command: \"{command}\"")
        response = await chat.send_message(msg)
        
        # Parse JSON response
        import json
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(response[json_start:json_end])
        except json.JSONDecodeError:
            pass
        
        return {
            "action": "processed",
            "target_tab": None,
            "response_text": response
        }
                
    except Exception as e:
        logging.error(f"Chrome command error: {str(e)}")
        return {
            "action": "error",
            "target_tab": None,
            "response_text": "Sorry, couldn't process that command."
        }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Meta Chrome API", "version": "1.0.0"}

@api_router.post("/chrome-command", response_model=ChromeCommandResponse)
async def chrome_command(request: ChromeCommandRequest):
    """Process a Chrome browser voice command"""
    
    result = await process_chrome_command(request.command)
    
    response = ChromeCommandResponse(
        original_command=request.command,
        action=result.get("action", "unknown"),
        target_tab=result.get("target_tab"),
        response_text=result.get("response_text", "Command processed"),
        status="success" if result.get("action") != "error" else "error"
    )
    
    # Save to history
    await db.chrome_commands.insert_one(response.dict())
    
    return response

@api_router.get("/chrome-history")
async def get_chrome_history(limit: int = 20):
    """Get recent Chrome command history"""
    commands = await db.chrome_commands.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return commands

@api_router.delete("/chrome-history")
async def clear_chrome_history():
    """Clear Chrome command history"""
    result = await db.chrome_commands.delete_many({})
    return {"message": f"Cleared {result.deleted_count} commands"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
