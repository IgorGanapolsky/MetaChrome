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

# Emergent LLM Key for Claude
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class CommandRequest(BaseModel):
    command: str
    context: Optional[str] = None

class CommandResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_command: str
    interpreted_action: str
    action_type: str
    response_text: str
    simulated: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CommandHistory(BaseModel):
    id: str
    original_command: str
    interpreted_action: str
    action_type: str
    response_text: str
    simulated: bool
    timestamp: datetime

# System prompt for Claude to interpret voice commands
SYSTEM_PROMPT = """You are a voice command interpreter for a smart assistant that integrates with:
- Meta Ray-Ban smart glasses
- Google Assistant
- Apple device controls
- Various apps (Chrome, Google Keep, Grok, Claude Code, etc.)

Your job is to interpret natural language commands and determine:
1. The action type (browser_control, app_control, ai_query, device_control, note_taking, reading)
2. The specific action to take
3. A helpful response to speak back to the user

Respond in JSON format with these fields:
{
    "action_type": "one of: browser_control, app_control, ai_query, device_control, note_taking, reading, general",
    "interpreted_action": "brief description of what action to take",
    "response_text": "what to say back to the user (conversational, helpful)",
    "target_app": "the app involved if any",
    "parameters": {}
}

Examples:
- "open my google chrome tab with claude code" → browser_control, opening Chrome to Claude Code
- "read me the last two paragraphs" → reading, reading content aloud
- "open Google Keep and tell me my notes" → app_control + note_taking
- "ask Grok about my repo" → ai_query, forwarding question to Grok

Be helpful, conversational, and acknowledge that some actions are simulated in this demo."""

async def call_llm_api(user_command: str, context: Optional[str] = None) -> dict:
    """Call LLM API via Emergent LLM Key to interpret the command"""
    
    if not EMERGENT_LLM_KEY:
        return {
            "action_type": "general",
            "interpreted_action": "Process command locally",
            "response_text": f"I heard: '{user_command}'. Processing locally as AI integration is not configured.",
            "target_app": None,
            "parameters": {}
        }
    
    try:
        # Create LLM chat instance with emergent key
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"voice-cmd-{uuid.uuid4()}",
            system_message=SYSTEM_PROMPT
        )
        
        # Create user message
        prompt = f"Interpret this voice command: \"{user_command}\"\n\nContext: {context if context else 'No additional context'}"
        msg = UserMessage(text=prompt)
        
        # Get response
        response = await chat.send_message(msg)
        
        # Parse the JSON response
        import json
        try:
            # Find JSON in the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                parsed = json.loads(response[json_start:json_end])
                return parsed
        except json.JSONDecodeError:
            pass
        
        return {
            "action_type": "general",
            "interpreted_action": "Process command",
            "response_text": response,
            "target_app": None,
            "parameters": {}
        }
                
    except Exception as e:
        logging.error(f"Error calling LLM API: {str(e)}")
        return {
            "action_type": "error",
            "interpreted_action": "Connection Error",
            "response_text": f"Sorry, I had trouble processing that. Please try again.",
            "target_app": None,
            "parameters": {}
        }

# Simulated action executors
def simulate_browser_action(action: str, params: dict) -> str:
    """Simulate browser control actions"""
    return f"[SIMULATED] Browser action: {action}. In a full integration, this would control Chrome/Safari via the appropriate SDK."

def simulate_app_action(action: str, target_app: str, params: dict) -> str:
    """Simulate app control actions"""
    app_responses = {
        "google keep": "Opening Google Keep... Found 3 notes: 'Shopping List', 'Meeting Notes', 'Ideas for Project'",
        "grok": "Opening Grok app... Ready to forward your question.",
        "claude code": "Opening Claude Code... I can see 5 recent conversations.",
        "chrome": "Opening Google Chrome...",
        "safari": "Opening Safari..."
    }
    
    app_lower = target_app.lower() if target_app else "unknown"
    for key, response in app_responses.items():
        if key in app_lower:
            return f"[SIMULATED] {response}"
    
    return f"[SIMULATED] Opening {target_app}..."

def simulate_reading_action(action: str, params: dict) -> str:
    """Simulate reading content aloud"""
    return "[SIMULATED] Reading content: 'This is simulated text that would be read from the specified source. In a full integration, this would use OCR or screen reading APIs.'"

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Voice Command Assistant API", "version": "1.0.0"}

@api_router.post("/command", response_model=CommandResponse)
async def process_command(request: CommandRequest):
    """Process a voice command using LLM AI"""
    
    # Get LLM's interpretation
    interpretation = await call_llm_api(request.command, request.context)
    
    action_type = interpretation.get("action_type", "general")
    interpreted_action = interpretation.get("interpreted_action", "Unknown action")
    response_text = interpretation.get("response_text", "Command processed")
    target_app = interpretation.get("target_app")
    parameters = interpretation.get("parameters", {})
    
    # Add simulation info based on action type
    simulation_notes = ""
    if action_type == "browser_control":
        simulation_notes = simulate_browser_action(interpreted_action, parameters)
    elif action_type == "app_control":
        simulation_notes = simulate_app_action(interpreted_action, target_app, parameters)
    elif action_type == "reading":
        simulation_notes = simulate_reading_action(interpreted_action, parameters)
    
    if simulation_notes:
        response_text = f"{response_text}\n\n{simulation_notes}"
    
    # Create response object
    command_response = CommandResponse(
        original_command=request.command,
        interpreted_action=interpreted_action,
        action_type=action_type,
        response_text=response_text,
        simulated=True
    )
    
    # Save to database
    await db.command_history.insert_one(command_response.dict())
    
    return command_response

@api_router.get("/history", response_model=List[CommandHistory])
async def get_command_history(limit: int = 20):
    """Get recent command history"""
    commands = await db.command_history.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [CommandHistory(**cmd) for cmd in commands]

@api_router.delete("/history")
async def clear_history():
    """Clear command history"""
    result = await db.command_history.delete_many({})
    return {"message": f"Cleared {result.deleted_count} commands from history"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
