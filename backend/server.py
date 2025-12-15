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

# ==================== MODELS ====================

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

class CustomCommandCreate(BaseModel):
    trigger_phrase: str
    action_type: str
    action_target: str
    description: str = ""
    enabled: bool = True

class CustomCommandUpdate(BaseModel):
    trigger_phrase: Optional[str] = None
    action_type: Optional[str] = None
    action_target: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None

class CustomCommand(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trigger_phrase: str
    action_type: str
    action_target: str
    description: str
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== CHROME COMMAND PROCESSING ====================

async def get_custom_commands_for_matching():
    """Get all enabled custom commands for matching"""
    commands = await db.custom_commands.find({"enabled": True}).to_list(100)
    return commands

async def process_chrome_command(command: str) -> dict:
    """Process a Chrome browser command - first check custom commands, then use AI"""
    
    # First, check if command matches any custom commands
    custom_commands = await get_custom_commands_for_matching()
    command_lower = command.lower().strip()
    
    for custom in custom_commands:
        trigger = custom.get("trigger_phrase", "").lower().strip()
        if trigger and (trigger in command_lower or command_lower in trigger):
            return {
                "action": custom.get("action_type", "custom"),
                "target_tab": custom.get("action_target"),
                "response_text": f"Executing: {custom.get('description', custom.get('action_target'))}"
            }
    
    # If no custom command matches, use AI
    if not EMERGENT_LLM_KEY:
        return {
            "action": "error",
            "target_tab": None,
            "response_text": "AI not configured."
        }
    
    try:
        # Build context with custom commands
        custom_cmd_list = "\n".join([
            f"- \"{c.get('trigger_phrase')}\" -> {c.get('action_type')}: {c.get('action_target')}"
            for c in custom_commands
        ])
        
        system_prompt = f"""You are a Chrome browser controller for Meta Ray-Ban smart glasses.

User's custom commands:
{custom_cmd_list if custom_cmd_list else "No custom commands configured yet."}

Interpret the voice command and respond in JSON:
{{
    "action": "switch_tab|read_content|send_message|scroll|new_tab|close_tab|list_tabs",
    "target_tab": "tab name or null",
    "response_text": "brief response for glasses to speak"
}}

Keep responses very brief - they'll be spoken aloud."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chrome-{uuid.uuid4()}",
            system_message=system_prompt
        )
        
        msg = UserMessage(text=f"Voice command: \"{command}\"")
        response = await chat.send_message(msg)
        
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
            "response_text": response[:100]
        }
                
    except Exception as e:
        logging.error(f"Chrome command error: {str(e)}")
        return {
            "action": "error",
            "target_tab": None,
            "response_text": "Command failed."
        }

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Meta Chrome API", "version": "2.0.0"}

# Chrome Commands
@api_router.post("/chrome-command", response_model=ChromeCommandResponse)
async def chrome_command(request: ChromeCommandRequest):
    """Process a Chrome browser voice command"""
    result = await process_chrome_command(request.command)
    
    response = ChromeCommandResponse(
        original_command=request.command,
        action=result.get("action", "unknown"),
        target_tab=result.get("target_tab"),
        response_text=result.get("response_text", "Done"),
        status="success" if result.get("action") != "error" else "error"
    )
    
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

# Custom Commands CRUD
@api_router.post("/custom-commands", response_model=CustomCommand)
async def create_custom_command(cmd: CustomCommandCreate):
    """Create a new custom voice command"""
    command = CustomCommand(
        trigger_phrase=cmd.trigger_phrase,
        action_type=cmd.action_type,
        action_target=cmd.action_target,
        description=cmd.description or f"{cmd.action_type} -> {cmd.action_target}",
        enabled=cmd.enabled
    )
    await db.custom_commands.insert_one(command.dict())
    return command

@api_router.get("/custom-commands", response_model=List[CustomCommand])
async def get_custom_commands():
    """Get all custom commands"""
    commands = await db.custom_commands.find().sort("created_at", -1).to_list(100)
    return [CustomCommand(**cmd) for cmd in commands]

@api_router.get("/custom-commands/{command_id}", response_model=CustomCommand)
async def get_custom_command(command_id: str):
    """Get a specific custom command"""
    command = await db.custom_commands.find_one({"id": command_id})
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    return CustomCommand(**command)

@api_router.put("/custom-commands/{command_id}", response_model=CustomCommand)
async def update_custom_command(command_id: str, cmd: CustomCommandCreate):
    """Update a custom command"""
    result = await db.custom_commands.update_one(
        {"id": command_id},
        {"$set": {
            "trigger_phrase": cmd.trigger_phrase,
            "action_type": cmd.action_type,
            "action_target": cmd.action_target,
            "description": cmd.description,
            "enabled": cmd.enabled
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Command not found")
    
    command = await db.custom_commands.find_one({"id": command_id})
    return CustomCommand(**command)

@api_router.patch("/custom-commands/{command_id}")
async def patch_custom_command(command_id: str, updates: CustomCommandUpdate):
    """Partially update a custom command (e.g., toggle enabled)"""
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.custom_commands.update_one(
        {"id": command_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Command not found")
    
    return {"message": "Updated successfully"}

@api_router.delete("/custom-commands/{command_id}")
async def delete_custom_command(command_id: str):
    """Delete a custom command"""
    result = await db.custom_commands.delete_one({"id": command_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Command not found")
    return {"message": "Deleted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
