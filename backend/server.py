from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
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
app = FastAPI(
    title="MetaChrome API",
    description="Voice-controlled browser API for Meta Ray-Ban smart glasses",
    version="2.1.0"
)
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# Action types for custom commands
ActionType = Literal[
    "navigate", "switch_tab", "scroll", "read", "search",
    "refresh", "close_tab", "new_tab", "custom_script"
]

class ChromeCommandRequest(BaseModel):
    command: str
    source: str = "app"  # "app", "meta_rayban", "api"

class ChromeCommandResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_command: str
    action: str
    target_tab: Optional[str] = None
    response_text: str
    status: str = "success"
    source: str = "app"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CustomCommandCreate(BaseModel):
    trigger_phrase: str
    action_type: ActionType
    action_target: str
    description: str = ""
    enabled: bool = True
    is_meta_rayban: bool = True

class CustomCommandUpdate(BaseModel):
    trigger_phrase: Optional[str] = None
    action_type: Optional[ActionType] = None
    action_target: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    is_meta_rayban: Optional[bool] = None

class CustomCommand(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trigger_phrase: str
    action_type: ActionType
    action_target: str
    description: str
    enabled: bool = True
    is_meta_rayban: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MetaRayBanSettings(BaseModel):
    user_id: str = "default"
    device_name: Optional[str] = None
    is_connected: bool = False
    voice_feedback_enabled: bool = True
    haptic_feedback_enabled: bool = True
    wake_word_enabled: bool = True
    custom_wake_word: str = "Hey Chrome"
    last_connected: Optional[datetime] = None

class MetaRayBanSettingsUpdate(BaseModel):
    device_name: Optional[str] = None
    is_connected: Optional[bool] = None
    voice_feedback_enabled: Optional[bool] = None
    haptic_feedback_enabled: Optional[bool] = None
    wake_word_enabled: Optional[bool] = None
    custom_wake_word: Optional[str] = None

class CommandSuggestion(BaseModel):
    trigger_phrase: str
    action_type: ActionType
    action_target: str
    description: str
    category: str

# ==================== CHROME COMMAND PROCESSING ====================

async def get_custom_commands_for_matching():
    """Get all enabled custom commands for matching"""
    commands = await db.custom_commands.find({"enabled": True}).to_list(100)
    return commands

def fuzzy_match_command(phrase: str, commands: List[dict]) -> Optional[dict]:
    """Perform fuzzy matching on commands"""
    phrase_lower = phrase.lower().strip()
    phrase_words = set(phrase_lower.split())
    
    best_match = None
    best_score = 0
    
    for cmd in commands:
        trigger = cmd.get("trigger_phrase", "").lower().strip()
        trigger_words = set(trigger.split())
        
        # Exact match
        if trigger == phrase_lower:
            return cmd
        
        # Contains match
        if trigger in phrase_lower or phrase_lower in trigger:
            return cmd
        
        # Word overlap score
        overlap = len(phrase_words & trigger_words)
        total = len(phrase_words | trigger_words)
        score = overlap / total if total > 0 else 0
        
        if score > best_score and score >= 0.5:
            best_score = score
            best_match = cmd
    
    return best_match

async def process_chrome_command(command: str, source: str = "app") -> dict:
    """Process a Chrome browser command - first check custom commands, then use AI"""
    
    # First, check if command matches any custom commands
    custom_commands = await get_custom_commands_for_matching()
    
    # Try fuzzy matching
    matched_command = fuzzy_match_command(command, custom_commands)
    if matched_command:
        return {
            "action": matched_command.get("action_type", "custom"),
            "target_tab": matched_command.get("action_target"),
            "response_text": f"Executing: {matched_command.get('description', matched_command.get('action_target'))}",
            "matched_command_id": matched_command.get("id")
        }
    
    # If no custom command matches, use AI
    if not EMERGENT_LLM_KEY:
        return {
            "action": "error",
            "target_tab": None,
            "response_text": "AI not configured. Add a custom command for this action."
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

Available action types:
- navigate: Go to a URL
- switch_tab: Switch to a specific tab
- scroll: Scroll the page (up/down)
- read: Read page content aloud
- search: Search for something
- refresh: Refresh the current page
- close_tab: Close a tab
- new_tab: Open a new tab
- custom_script: Execute custom JavaScript

Interpret the voice command and respond in JSON:
{{
    "action": "navigate|switch_tab|scroll|read|search|refresh|close_tab|new_tab|custom_script",
    "target_tab": "target value or null",
    "response_text": "brief response for glasses to speak (max 50 chars)"
}}

Keep responses very brief - they'll be spoken aloud through the glasses."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chrome-{uuid.uuid4()}",
            system_message=system_prompt
        )
        
        msg = UserMessage(text=f"Voice command from {source}: \"{command}\"")
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
    return {
        "message": "MetaChrome API",
        "version": "2.1.0",
        "features": [
            "Custom voice commands",
            "Meta Ray-Ban integration",
            "AI-powered command processing"
        ]
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Chrome Commands
@api_router.post("/chrome-command", response_model=ChromeCommandResponse)
async def chrome_command(request: ChromeCommandRequest):
    """Process a Chrome browser voice command"""
    result = await process_chrome_command(request.command, request.source)
    
    response = ChromeCommandResponse(
        original_command=request.command,
        action=result.get("action", "unknown"),
        target_tab=result.get("target_tab"),
        response_text=result.get("response_text", "Done"),
        status="success" if result.get("action") != "error" else "error",
        source=request.source
    )
    
    await db.chrome_commands.insert_one(response.dict())
    return response

@api_router.get("/chrome-history")
async def get_chrome_history(limit: int = 20, source: Optional[str] = None):
    """Get recent Chrome command history"""
    query = {}
    if source:
        query["source"] = source
    commands = await db.chrome_commands.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
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
        trigger_phrase=cmd.trigger_phrase.lower().strip(),
        action_type=cmd.action_type,
        action_target=cmd.action_target,
        description=cmd.description or f"{cmd.action_type} -> {cmd.action_target}",
        enabled=cmd.enabled,
        is_meta_rayban=cmd.is_meta_rayban
    )
    await db.custom_commands.insert_one(command.dict())
    return command

@api_router.get("/custom-commands", response_model=List[CustomCommand])
async def get_custom_commands(meta_rayban_only: bool = False):
    """Get all custom commands"""
    query = {}
    if meta_rayban_only:
        query["is_meta_rayban"] = True
    commands = await db.custom_commands.find(query).sort("created_at", -1).to_list(100)
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
            "trigger_phrase": cmd.trigger_phrase.lower().strip(),
            "action_type": cmd.action_type,
            "action_target": cmd.action_target,
            "description": cmd.description,
            "enabled": cmd.enabled,
            "is_meta_rayban": cmd.is_meta_rayban
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
    
    if "trigger_phrase" in update_data:
        update_data["trigger_phrase"] = update_data["trigger_phrase"].lower().strip()
    
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

# ==================== META RAY-BAN SETTINGS ====================

@api_router.get("/meta-rayban/settings", response_model=MetaRayBanSettings)
async def get_meta_rayban_settings(user_id: str = "default"):
    """Get Meta Ray-Ban settings for a user"""
    settings = await db.meta_rayban_settings.find_one({"user_id": user_id})
    if not settings:
        # Return default settings
        return MetaRayBanSettings(user_id=user_id)
    return MetaRayBanSettings(**settings)

@api_router.put("/meta-rayban/settings", response_model=MetaRayBanSettings)
async def update_meta_rayban_settings(user_id: str = "default", updates: MetaRayBanSettingsUpdate = None):
    """Update Meta Ray-Ban settings"""
    update_data = {k: v for k, v in (updates.dict() if updates else {}).items() if v is not None}
    
    if update_data.get("is_connected"):
        update_data["last_connected"] = datetime.utcnow()
    
    result = await db.meta_rayban_settings.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.meta_rayban_settings.find_one({"user_id": user_id})
    return MetaRayBanSettings(**settings)

@api_router.post("/meta-rayban/connect")
async def connect_meta_rayban(device_name: str, user_id: str = "default"):
    """Record Meta Ray-Ban connection"""
    await db.meta_rayban_settings.update_one(
        {"user_id": user_id},
        {"$set": {
            "device_name": device_name,
            "is_connected": True,
            "last_connected": datetime.utcnow()
        }},
        upsert=True
    )
    return {"message": f"Connected to {device_name}", "status": "connected"}

@api_router.post("/meta-rayban/disconnect")
async def disconnect_meta_rayban(user_id: str = "default"):
    """Record Meta Ray-Ban disconnection"""
    await db.meta_rayban_settings.update_one(
        {"user_id": user_id},
        {"$set": {
            "is_connected": False
        }}
    )
    return {"message": "Disconnected", "status": "disconnected"}

# ==================== COMMAND SUGGESTIONS ====================

@api_router.get("/command-suggestions", response_model=List[CommandSuggestion])
async def get_command_suggestions():
    """Get suggested commands for Meta Ray-Ban"""
    suggestions = [
        CommandSuggestion(
            trigger_phrase="open google",
            action_type="navigate",
            action_target="https://google.com",
            description="Navigate to Google",
            category="Navigation"
        ),
        CommandSuggestion(
            trigger_phrase="open github",
            action_type="navigate",
            action_target="https://github.com",
            description="Navigate to GitHub",
            category="Navigation"
        ),
        CommandSuggestion(
            trigger_phrase="open youtube",
            action_type="navigate",
            action_target="https://youtube.com",
            description="Navigate to YouTube",
            category="Navigation"
        ),
        CommandSuggestion(
            trigger_phrase="scroll down",
            action_type="scroll",
            action_target="down",
            description="Scroll the page down",
            category="Page Control"
        ),
        CommandSuggestion(
            trigger_phrase="scroll up",
            action_type="scroll",
            action_target="up",
            description="Scroll the page up",
            category="Page Control"
        ),
        CommandSuggestion(
            trigger_phrase="go to top",
            action_type="scroll",
            action_target="top",
            description="Scroll to top of page",
            category="Page Control"
        ),
        CommandSuggestion(
            trigger_phrase="read this page",
            action_type="read",
            action_target="page",
            description="Read the current page content",
            category="Accessibility"
        ),
        CommandSuggestion(
            trigger_phrase="read selection",
            action_type="read",
            action_target="selection",
            description="Read selected text",
            category="Accessibility"
        ),
        CommandSuggestion(
            trigger_phrase="refresh page",
            action_type="refresh",
            action_target="current",
            description="Refresh the current page",
            category="Page Control"
        ),
        CommandSuggestion(
            trigger_phrase="close tab",
            action_type="close_tab",
            action_target="current",
            description="Close the current tab",
            category="Tab Management"
        ),
        CommandSuggestion(
            trigger_phrase="new tab",
            action_type="new_tab",
            action_target="about:blank",
            description="Open a new empty tab",
            category="Tab Management"
        ),
        CommandSuggestion(
            trigger_phrase="search for",
            action_type="search",
            action_target="",
            description="Search the web",
            category="Search"
        ),
    ]
    return suggestions

@api_router.post("/command-suggestions/import")
async def import_suggestion(suggestion: CommandSuggestion):
    """Import a suggested command as a custom command"""
    command = CustomCommand(
        trigger_phrase=suggestion.trigger_phrase.lower().strip(),
        action_type=suggestion.action_type,
        action_target=suggestion.action_target,
        description=suggestion.description,
        enabled=True,
        is_meta_rayban=True
    )
    await db.custom_commands.insert_one(command.dict())
    return command

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
